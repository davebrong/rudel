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
						<Button variant="outline" size="sm" asChild>
							<Link to="/dashboard/projects">
								<ArrowLeft className="h-4 w-4" />
								Back to Projects
							</Link>
						</Button>
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
						<Button variant="outline" size="sm" asChild>
							<Link to="/dashboard/projects">
								<ArrowLeft className="h-4 w-4" />
								Back
							</Link>
						</Button>
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
						<div className="mt-6">
							<Table>
								<TableHeader className="bg-surface">
									<TableRow>
										<TableHead className="px-6 py-3 text-xs text-muted uppercase">
											Developer
										</TableHead>
										<TableHead className="px-6 py-3 text-xs text-muted uppercase">
											Sessions
										</TableHead>
										<TableHead className="px-6 py-3 text-xs text-muted uppercase">
											Contribution
										</TableHead>
										<TableHead className="px-6 py-3 text-xs text-muted uppercase">
											Total Time
										</TableHead>
										<TableHead className="px-6 py-3 text-xs text-muted uppercase">
											Tokens
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="bg-input">
									{contributors.map((contributor) => (
										<TableRow
											key={contributor.user_id}
											className="hover:bg-hover"
										>
											<TableCell className="px-6 py-4 text-sm font-medium text-foreground">
												{formatUsername(contributor.user_id, userMapRecord)}
											</TableCell>
											<TableCell className="px-6 py-4 text-sm text-muted">
												{contributor.sessions}
											</TableCell>
											<TableCell className="px-6 py-4 text-sm text-muted">
												{contributor.contribution_percentage.toFixed(0)}%
											</TableCell>
											<TableCell className="px-6 py-4 text-sm text-muted">
												{(contributor.total_duration_min / 60).toFixed(1)}h
											</TableCell>
											<TableCell className="px-6 py-4 text-sm text-muted">
												{(contributor.total_tokens / 1000).toFixed(0)}K
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</AnalyticsCard>
			)}

			{errors && errors.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-6">
						Errors Encountered
					</h2>
					<Table>
						<TableHeader className="bg-surface">
							<TableRow>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase">
									Error Type
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase">
									Occurrences
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase">
									Affected Users
								</TableHead>
								<TableHead className="px-6 py-3 text-xs text-muted uppercase">
									Last Seen
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="bg-input">
							{errors.map((error, idx) => (
								<TableRow
									// biome-ignore lint/suspicious/noArrayIndexKey: static error list
									key={idx}
									className="hover:bg-hover"
								>
									<TableCell className="px-6 py-4 text-sm font-medium text-foreground">
										{error.error_pattern}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-muted">
										{error.occurrences}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-muted">
										{error.affected_users}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-muted">
										{new Date(error.last_seen).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</AnalyticsCard>
			)}
		</div>
	);
}
