import { useQuery } from "@tanstack/react-query";
import {
	Clock,
	DollarSign,
	FolderKanban,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { ProjectTrendChart } from "@/components/charts/ProjectTrendChart";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useDateRange } from "@/contexts/DateRangeContext";
import { encodeProjectPath } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function ProjectsListPage() {
	const navigate = useNavigate();
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const days = calculateDays();

	const { data: projects, isLoading } = useQuery(
		orpc.analytics.projects.investment.queryOptions({ input: { days } }),
	);

	const { data: trendData } = useQuery(
		orpc.analytics.projects.trends.queryOptions({ input: { days } }),
	);

	const totalProjects = projects?.length ?? 0;
	const totalSessions = projects?.reduce((sum, p) => sum + p.sessions, 0) ?? 0;
	const totalHours =
		(projects?.reduce((sum, p) => sum + p.total_duration_min, 0) ?? 0) / 60;
	const totalCost = projects?.reduce((sum, p) => sum + (p.cost || 0), 0) ?? 0;
	const totalTokens =
		projects?.reduce((sum, p) => sum + (p.total_tokens || 0), 0) ?? 0;
	const avgUsersPerProject =
		totalProjects > 0
			? (
					(projects?.reduce((sum, p) => sum + p.unique_users, 0) ?? 0) /
					totalProjects
				).toFixed(1)
			: "0";

	const formatTokens = (tokens: number) => {
		if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
		if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
		return tokens.toString();
	};

	if (isLoading) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Projects"
					description="Analyze project activity and team investment"
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
					<p className="text-center text-muted">Loading project metrics...</p>
				</AnalyticsCard>
			</div>
		);
	}

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="Projects"
				description="Analyze project activity and team investment"
				actions={
					<DatePicker
						startDate={startDate}
						endDate={endDate}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
					/>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
				<StatCard
					title="Active Projects"
					value={totalProjects}
					icon={FolderKanban}
					iconColor="text-blue-600"
				/>
				<StatCard
					title="Total Sessions"
					value={totalSessions.toLocaleString()}
					icon={TrendingUp}
					iconColor="text-green-600"
				/>
				<StatCard
					title="Total Time"
					value={totalHours.toFixed(0)}
					icon={Clock}
					iconColor="text-purple-600"
				/>
				<StatCard
					title="Total Tokens"
					value={formatTokens(totalTokens)}
					icon={Zap}
					iconColor="text-amber-600"
				/>
				<StatCard
					title="Total Cost"
					value={`$${totalCost.toFixed(2)}`}
					icon={DollarSign}
					iconColor="text-emerald-600"
				/>
				<StatCard
					title="Avg Users"
					value={avgUsersPerProject}
					icon={Users}
					iconColor="text-indigo-600"
				/>
			</div>

			{trendData && trendData.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-4">
						Project Trends
					</h2>
					<p className="text-sm text-muted mb-6">
						Activity metrics over time split by project (top 10)
					</p>
					<ProjectTrendChart data={trendData} maxProjects={10} />
				</AnalyticsCard>
			)}

			<AnalyticsCard>
				<h2 className="text-xl font-bold text-heading mb-4">Project Details</h2>
				{projects && projects.length > 0 ? (
					<Table>
						<TableHeader className="bg-surface">
							<TableRow>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
									Project
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
									Sessions
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
									Time
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase tracking-wider">
									Tokens
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
							</TableRow>
						</TableHeader>
						<TableBody className="bg-input">
							{projects.map((project, index) => {
								const encodedPath = encodeProjectPath(project.project_path);
								const successRate = project.success_rate || 0;
								const successRateColor =
									successRate >= 70
										? "text-status-success-icon"
										: successRate >= 50
											? "text-status-warning-icon"
											: "text-status-error-icon";
								const trend = project.success_rate_trend || 0;
								const trendIconStr =
									trend > 0 ? "\u2191" : trend < 0 ? "\u2193" : "-";
								const trendColor =
									trend > 0
										? "text-status-success-icon"
										: trend < 0
											? "text-status-error-icon"
											: "text-muted";

								return (
									<TableRow
										// biome-ignore lint/suspicious/noArrayIndexKey: static project list
										key={index}
										onClick={() =>
											navigate(`/dashboard/projects/${encodedPath}`)
										}
										className="hover:bg-hover cursor-pointer"
									>
										<TableCell className="px-6 py-4 text-sm font-medium text-foreground">
											{project.project_path.split("/").pop()}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-muted">
											{project.sessions}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-muted">
											{(project.total_duration_min / 60).toFixed(1)}h
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-muted">
											{formatTokens(project.total_tokens || 0)}
										</TableCell>
										<TableCell
											className={`px-6 py-4 text-sm font-semibold ${successRateColor}`}
										>
											{successRate.toFixed(0)}%
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-muted">
											${(project.cost || 0).toFixed(2)}
										</TableCell>
										<TableCell
											className={`px-6 py-4 text-sm font-semibold ${trendColor}`}
										>
											{trendIconStr} {Math.abs(trend).toFixed(1)}%
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				) : (
					<p className="text-center text-muted py-8">
						No project data available
					</p>
				)}
			</AnalyticsCard>
		</div>
	);
}
