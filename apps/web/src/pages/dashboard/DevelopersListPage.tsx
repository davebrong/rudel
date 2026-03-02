import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	ArrowDown,
	ArrowUp,
	Clock,
	Code,
	Minus,
	UserCheck,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { DeveloperTrendChart } from "@/components/charts/DeveloperTrendChart";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { authClient } from "@/lib/auth-client";
import { formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function DevelopersListPage() {
	const navigate = useNavigate();
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const days = calculateDays();

	const { activeOrg } = useOrganization();
	const [memberCount, setMemberCount] = useState<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch when org changes
	useEffect(() => {
		if (!activeOrg) return;
		authClient.organization
			.getFullOrganization({ query: { organizationId: activeOrg.id } })
			.then((res) => {
				if (res.data) {
					setMemberCount(
						(res.data as { members: readonly unknown[] }).members.length,
					);
				}
			});
	}, [activeOrg?.id]);

	const [sortBy, setSortBy] = useState<
		"sessions" | "tokens" | "last_active" | "success_rate"
	>("sessions");

	const { data: developers, isLoading } = useQuery(
		orpc.analytics.developers.list.queryOptions({ input: { days } }),
	);

	const { data: trendsData } = useQuery(
		orpc.analytics.developers.trends.queryOptions({ input: { days } }),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 30 } }),
	);

	const userMap = useMemo(() => {
		const map = new Map<string, string>();
		if (userMappings) {
			for (const m of userMappings) {
				map.set(m.user_id, m.username);
			}
		}
		return map;
	}, [userMappings]);

	const userMapRecord = useMemo(() => Object.fromEntries(userMap), [userMap]);

	const sortedDevelopers = useMemo(() => {
		if (!developers) return [];
		return [...developers].sort((a, b) => {
			if (sortBy === "sessions") return b.total_sessions - a.total_sessions;
			if (sortBy === "tokens") return b.total_tokens - a.total_tokens;
			if (sortBy === "success_rate") return b.success_rate - a.success_rate;
			return (
				new Date(b.last_active_date).getTime() -
				new Date(a.last_active_date).getTime()
			);
		});
	}, [developers, sortBy]);

	const totalSessions =
		developers?.reduce((sum, d) => sum + d.total_sessions, 0) ?? 0;
	const totalTokens =
		developers?.reduce((sum, d) => sum + d.total_tokens, 0) ?? 0;
	const totalHours =
		(developers?.reduce((sum, d) => sum + d.total_duration_min, 0) ?? 0) / 60;

	if (isLoading) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Developers"
					description="Individual developer activity and metrics"
					actions={
						<DatePicker
							startDate={startDate}
							endDate={endDate}
							onStartDateChange={setStartDate}
							onEndDateChange={setEndDate}
						/>
					}
				/>
				<AnalyticsCard>
					<p className="text-center text-muted">Loading developers...</p>
				</AnalyticsCard>
			</div>
		);
	}

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="Developers"
				description="Individual developer activity and metrics"
				actions={
					<DatePicker
						startDate={startDate}
						endDate={endDate}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
					/>
				}
			/>

			{/* Summary Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
				<StatCard
					title="Team Members"
					value={memberCount ?? "..."}
					icon={Users}
					iconColor="text-blue-600"
				/>
				<StatCard
					title="Active Developers"
					value={developers?.length ?? 0}
					icon={UserCheck}
					iconColor="text-cyan-600"
				/>
				<StatCard
					title="Total Sessions"
					value={totalSessions.toLocaleString()}
					icon={Activity}
					iconColor="text-green-600"
				/>
				<StatCard
					title="Total Tokens"
					value={`${(totalTokens / 1000000).toFixed(1)}M`}
					icon={Code}
					iconColor="text-purple-600"
				/>
				<StatCard
					title="Total Hours"
					value={totalHours.toFixed(0)}
					icon={Clock}
					iconColor="text-orange-600"
				/>
			</div>

			{/* Developers Table */}
			<AnalyticsCard>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-heading">Developer List</h2>
					<div className="flex gap-2">
						{(
							["sessions", "tokens", "success_rate", "last_active"] as const
						).map((key) => (
							<Button
								key={key}
								variant={sortBy === key ? "default" : "secondary"}
								size="sm"
								onClick={() => setSortBy(key)}
							>
								{key === "sessions"
									? "Sessions"
									: key === "tokens"
										? "Tokens"
										: key === "success_rate"
											? "Success Rate"
											: "Last Active"}
							</Button>
						))}
					</div>
				</div>

				<Table>
					<TableHeader className="bg-surface">
						<TableRow>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Developer
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Sessions
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Active Days
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Total Tokens
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Success Rate
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Cost
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Trend
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Avg Session
							</TableHead>
							<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
								Last Active
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="bg-input">
						{sortedDevelopers.map((dev) => (
							<TableRow
								key={dev.user_id}
								onClick={() => navigate(`/dashboard/developers/${dev.user_id}`)}
								className="hover:bg-hover cursor-pointer"
							>
								<TableCell className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center">
										<div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
											<span className="text-blue-600 font-semibold text-sm">
												{formatUsername(dev.user_id, userMapRecord)
													.substring(0, 2)
													.toUpperCase()}
											</span>
										</div>
										<div className="ml-4">
											<div className="text-sm font-medium text-foreground">
												{formatUsername(dev.user_id, userMapRecord)}
											</div>
										</div>
									</div>
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									{dev.total_sessions}
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									{dev.active_days}
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									{(dev.total_tokens / 1000).toFixed(0)}K
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									<span
										className={`font-medium ${
											dev.success_rate >= 70
												? "text-status-success-icon"
												: dev.success_rate >= 50
													? "text-status-warning-icon"
													: "text-status-error-icon"
										}`}
									>
										{dev.success_rate.toFixed(0)}%
									</span>
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									${dev.cost.toFixed(2)}
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm">
									<div className="flex items-center">
										{dev.success_rate_trend > 0 && (
											<>
												<ArrowUp className="w-4 h-4 text-status-success-icon mr-1" />
												<span className="text-status-success-icon font-medium">
													+{dev.success_rate_trend.toFixed(0)}%
												</span>
											</>
										)}
										{dev.success_rate_trend < 0 && (
											<>
												<ArrowDown className="w-4 h-4 text-status-error-icon mr-1" />
												<span className="text-status-error-icon font-medium">
													{dev.success_rate_trend.toFixed(0)}%
												</span>
											</>
										)}
										{dev.success_rate_trend === 0 && (
											<>
												<Minus className="w-4 h-4 text-muted mr-1" />
												<span className="text-muted">0%</span>
											</>
										)}
									</div>
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									{dev.avg_session_duration_min.toFixed(0)}m
								</TableCell>
								<TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted">
									{new Date(dev.last_active_date).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</AnalyticsCard>

			{/* Developer Trend Chart */}
			{trendsData && trendsData.length > 0 && (
				<AnalyticsCard className="mt-8">
					<h2 className="text-xl font-bold text-heading mb-4">
						Developer Activity Trends
					</h2>
					<p className="text-sm text-muted mb-6">
						Activity metrics over time split by developer
					</p>
					<DeveloperTrendChart data={trendsData} userMap={userMap} />
				</AnalyticsCard>
			)}
		</div>
	);
}
