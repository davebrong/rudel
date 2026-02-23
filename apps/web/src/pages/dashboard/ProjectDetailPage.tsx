import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Clock, Code, Users, Zap } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useChartTheme } from "@/hooks/useChartTheme";
import { decodeProjectPath, formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function ProjectDetailPage() {
	const { projectPath: encodedProjectPath } = useParams<{
		projectPath: string;
	}>();
	const projectPath = decodeProjectPath(encodedProjectPath || "");
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const chartTheme = useChartTheme();
	const days = calculateDays();

	const { data: details, isLoading } = useQuery(
		orpc.analytics.projects.details.queryOptions({
			input: { projectPath, days },
		}),
	);

	const { data: contributors } = useQuery(
		orpc.analytics.projects.contributors.queryOptions({
			input: { projectPath, days },
		}),
	);

	const { data: features } = useQuery(
		orpc.analytics.projects.features.queryOptions({
			input: { projectPath, days },
		}),
	);

	const { data: errors } = useQuery(
		orpc.analytics.projects.errors.queryOptions({
			input: { projectPath, days },
		}),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 30 } }),
	);

	const userMapRecord = useMemo(() => {
		const record: Record<string, string> = {};
		if (userMappings) {
			for (const m of userMappings) {
				record[m.user_id] = m.username;
			}
		}
		return record;
	}, [userMappings]);

	const contributorChartData = useMemo(() => {
		if (!contributors) return [];
		return contributors.slice(0, 10).map((c) => ({
			name: formatUsername(c.user_id, userMapRecord),
			sessions: c.sessions,
			hours: parseFloat((c.total_duration_min / 60).toFixed(1)),
		}));
	}, [contributors, userMapRecord]);

	if (isLoading || !details) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Project Details"
					description="Loading project information..."
					actions={
						<Link
							to="/dashboard/projects"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-subheading bg-input border border-border rounded-lg hover:bg-hover"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Projects
						</Link>
					}
				/>
				<AnalyticsCard>
					<p className="text-center text-muted">Loading...</p>
				</AnalyticsCard>
			</div>
		);
	}

	const projectName = projectPath.split("/").pop() || "Unknown Project";

	return (
		<div className="px-8 py-6">
			<PageHeader
				title={projectName}
				description="Project analytics and contributor insights"
				actions={
					<div className="flex items-center gap-3">
						<DatePicker
							startDate={startDate}
							endDate={endDate}
							onStartDateChange={setStartDate}
							onEndDateChange={setEndDate}
						/>
						<Link
							to="/dashboard/projects"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-subheading bg-input border border-border rounded-lg hover:bg-hover"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Link>
					</div>
				}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					title="Total Sessions"
					value={details.total_sessions}
					icon={Activity}
					iconColor="text-blue-600"
				/>
				<StatCard
					title="Contributors"
					value={details.contributors_count}
					icon={Users}
					iconColor="text-green-600"
				/>
				<StatCard
					title="Total Tokens"
					value={`${(details.total_tokens / 1000000).toFixed(1)}M`}
					icon={Code}
					iconColor="text-purple-600"
				/>
				<StatCard
					title="Total Time"
					value={`${(details.total_duration_min / 60).toFixed(0)}h`}
					icon={Clock}
					iconColor="text-orange-600"
				/>
			</div>

			{features && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<AnalyticsCard>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted">Subagents</p>
								<p className="text-2xl font-bold text-heading">
									{features.subagents_adoption_rate.toFixed(0)}%
								</p>
							</div>
							<Zap className="h-8 w-8 text-blue-600" />
						</div>
					</AnalyticsCard>
					<AnalyticsCard>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted">Skills</p>
								<p className="text-2xl font-bold text-heading">
									{features.skills_adoption_rate.toFixed(0)}%
								</p>
							</div>
							<Zap className="h-8 w-8 text-purple-600" />
						</div>
					</AnalyticsCard>
					<AnalyticsCard>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted">Slash Commands</p>
								<p className="text-2xl font-bold text-heading">
									{features.slash_commands_adoption_rate.toFixed(0)}%
								</p>
							</div>
							<Zap className="h-8 w-8 text-green-600" />
						</div>
					</AnalyticsCard>
				</div>
			)}

			{contributorChartData.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-6">Contributors</h2>
					<ResponsiveContainer width="100%" height={350}>
						<BarChart data={contributorChartData} margin={{ bottom: 60 }}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={chartTheme.gridStroke}
							/>
							<XAxis
								dataKey="name"
								angle={-45}
								textAnchor="end"
								height={80}
								interval={0}
								stroke={chartTheme.axisStroke}
							/>
							<YAxis yAxisId="left" stroke={chartTheme.axisStroke} />
							<YAxis
								yAxisId="right"
								orientation="right"
								stroke={chartTheme.axisStroke}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: chartTheme.tooltipBg,
									borderColor: chartTheme.tooltipBorder,
								}}
							/>
							<Legend />
							<Bar
								yAxisId="left"
								dataKey="sessions"
								fill="#3b82f6"
								name="Sessions"
							/>
							<Bar
								yAxisId="right"
								dataKey="hours"
								fill="#10b981"
								name="Hours"
							/>
						</BarChart>
					</ResponsiveContainer>
					{contributors && (
						<div className="mt-6 overflow-x-auto">
							<table className="min-w-full divide-y divide-border">
								<thead className="bg-surface">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
											Developer
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
											Sessions
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
											Contribution
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
											Total Time
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
											Tokens
										</th>
									</tr>
								</thead>
								<tbody className="bg-input divide-y divide-border">
									{contributors.map((contributor) => (
										<tr key={contributor.user_id} className="hover:bg-hover">
											<td className="px-6 py-4 text-sm font-medium text-foreground">
												{formatUsername(contributor.user_id, userMapRecord)}
											</td>
											<td className="px-6 py-4 text-sm text-muted">
												{contributor.sessions}
											</td>
											<td className="px-6 py-4 text-sm text-muted">
												{contributor.contribution_percentage.toFixed(0)}%
											</td>
											<td className="px-6 py-4 text-sm text-muted">
												{(contributor.total_duration_min / 60).toFixed(1)}h
											</td>
											<td className="px-6 py-4 text-sm text-muted">
												{(contributor.total_tokens / 1000).toFixed(0)}K
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</AnalyticsCard>
			)}

			{errors && errors.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-6">
						Errors Encountered
					</h2>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-border">
							<thead className="bg-surface">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
										Error Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
										Occurrences
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
										Affected Users
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
										Last Seen
									</th>
								</tr>
							</thead>
							<tbody className="bg-input divide-y divide-border">
								{errors.map((error, idx) => (
									<tr
										// biome-ignore lint/suspicious/noArrayIndexKey: static error list
										key={idx}
										className="hover:bg-hover"
									>
										<td className="px-6 py-4 text-sm font-medium text-foreground">
											{error.error_pattern}
										</td>
										<td className="px-6 py-4 text-sm text-muted">
											{error.occurrences}
										</td>
										<td className="px-6 py-4 text-sm text-muted">
											{error.affected_users}
										</td>
										<td className="px-6 py-4 text-sm text-muted">
											{new Date(error.last_seen).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</AnalyticsCard>
			)}
		</div>
	);
}
