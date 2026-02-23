import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	ArrowDown,
	ArrowUp,
	Clock,
	Code,
	Minus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { DeveloperTrendChart } from "@/components/charts/DeveloperTrendChart";
import { useDateRange } from "@/contexts/DateRangeContext";
import { formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function DevelopersListPage() {
	const navigate = useNavigate();
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const days = calculateDays();

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
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					title="Total Developers"
					value={developers?.length ?? 0}
					icon={Users}
					iconColor="text-blue-600"
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
							<button
								type="button"
								key={key}
								onClick={() => setSortBy(key)}
								className={`px-3 py-1 text-sm rounded ${
									sortBy === key
										? "bg-accent text-accent-foreground"
										: "bg-surface text-subheading"
								}`}
							>
								{key === "sessions"
									? "Sessions"
									: key === "tokens"
										? "Tokens"
										: key === "success_rate"
											? "Success Rate"
											: "Last Active"}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-border">
						<thead className="bg-surface">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Developer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Sessions
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Active Days
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Total Tokens
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Success Rate
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Cost
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Trend
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Avg Session
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Last Active
								</th>
							</tr>
						</thead>
						<tbody className="bg-input divide-y divide-border">
							{sortedDevelopers.map((dev) => (
								<tr
									key={dev.user_id}
									onClick={() =>
										navigate(`/dashboard/developers/${dev.user_id}`)
									}
									className="hover:bg-hover cursor-pointer"
								>
									<td className="px-6 py-4 whitespace-nowrap">
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
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{dev.total_sessions}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{dev.active_days}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{(dev.total_tokens / 1000).toFixed(0)}K
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
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
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										${dev.cost.toFixed(2)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
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
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{dev.avg_session_duration_min.toFixed(0)}m
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{new Date(dev.last_active_date).toLocaleDateString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
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
