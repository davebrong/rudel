import type { DeveloperError, DeveloperSession } from "@rudel/api-routes";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, ArrowLeft, Calendar, Clock, Code, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
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
import { DataTable } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useAnalyticsQuery } from "@/hooks/useAnalyticsQuery";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
	calculateRollingAverage,
	calculateWeekOverWeek,
	formatWoWChange,
	getTrendColor,
	getTrendDirection,
	getTrendIcon,
} from "@/lib/analytics";
import { formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function DeveloperDetailPage() {
	const { userId } = useParams<{ userId: string }>();
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const chartTheme = useChartTheme();
	const days = calculateDays();

	const [projectFilter, setProjectFilter] = useState<string>("");
	const [outcomeFilter, setOutcomeFilter] = useState<"all" | "success">("all");

	const { data: details, isLoading: detailsLoading } = useAnalyticsQuery(
		orpc.analytics.developers.details.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: sessions } = useAnalyticsQuery(
		orpc.analytics.developers.sessions.queryOptions({
			input: {
				userId: userId as string,
				days,
				limit: 100,
				projectPath: projectFilter || undefined,
				outcome: outcomeFilter,
				sortBy: "date" as const,
				sortOrder: "desc" as const,
			},
		}),
	);

	const { data: projects } = useAnalyticsQuery(
		orpc.analytics.developers.projects.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: timeline } = useAnalyticsQuery(
		orpc.analytics.developers.timeline.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: features } = useAnalyticsQuery(
		orpc.analytics.developers.features.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: errors } = useAnalyticsQuery(
		orpc.analytics.developers.errors.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: userMappings } = useAnalyticsQuery(
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

	const username = formatUsername(userId || "", userMapRecord);

	const chartData = useMemo(() => {
		if (!timeline) return [];
		const sessionValues = timeline.map((d) => d.sessions);
		const rollingAvg7 = calculateRollingAverage(sessionValues, 7);
		const rollingAvg30 = calculateRollingAverage(sessionValues, 30);

		return timeline.map((day, index) => ({
			date: new Date(day.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			sessions: day.sessions,
			hours: parseFloat((day.total_duration_min / 60).toFixed(1)),
			avg7Sessions: rollingAvg7[index],
			avg30Sessions: rollingAvg30[index],
		}));
	}, [timeline]);

	const { wowChange, trendColorClass, trendIcon } = useMemo(() => {
		if (!timeline || timeline.length < 14) {
			return {
				wowChange: 0,
				trendColorClass: "text-gray-500",
				trendIcon: "\u2192",
			};
		}
		const sessionValues = timeline.map((d) => d.sessions);
		const currentWeek = sessionValues.slice(-7);
		const previousWeek = sessionValues.slice(-14, -7);
		const wow = calculateWeekOverWeek(currentWeek, previousWeek);
		const direction = getTrendDirection(sessionValues);
		return {
			wowChange: wow,
			trendColorClass: getTrendColor(direction),
			trendIcon: getTrendIcon(direction),
		};
	}, [timeline]);

	const projectChartData = useMemo(() => {
		if (!projects) return [];
		return projects.slice(0, 10).map((p) => ({
			name: p.project_path.split("/").pop() || "Unknown",
			sessions: p.sessions,
			hours: parseFloat((p.total_duration_min / 60).toFixed(1)),
		}));
	}, [projects]);

	const uniqueProjects = useMemo(() => {
		if (!sessions) return [];
		return Array.from(new Set(sessions.map((s) => s.project_path)));
	}, [sessions]);

	const errorColumns = useMemo<ColumnDef<DeveloperError>[]>(
		() => [
			{
				accessorKey: "error_pattern",
				header: "Error Type",
				cell: ({ row }) => (
					<span className="font-medium text-foreground">
						{row.original.error_pattern}
					</span>
				),
			},
			{
				accessorKey: "occurrences",
				header: "Occurrences",
				cell: ({ row }) => (
					<span className="text-muted">{row.original.occurrences}</span>
				),
			},
			{
				accessorFn: (row) => new Date(row.last_seen).getTime(),
				id: "last_seen",
				header: "Last Seen",
				cell: ({ row }) => (
					<span className="text-muted">
						{new Date(row.original.last_seen).toLocaleDateString()}
					</span>
				),
			},
		],
		[],
	);

	const sessionColumns = useMemo<ColumnDef<DeveloperSession>[]>(
		() => [
			{
				accessorFn: (row) => new Date(row.session_date).getTime(),
				id: "date",
				header: "Date",
				cell: ({ row }) => (
					<span className="text-muted">
						{new Date(row.original.session_date).toLocaleString()}
					</span>
				),
			},
			{
				accessorKey: "project_path",
				header: "Project",
				cell: ({ row }) => (
					<span className="font-medium text-foreground">
						{row.original.project_path.split("/").pop()}
					</span>
				),
			},
			{
				accessorKey: "duration_min",
				header: "Duration",
				cell: ({ row }) => (
					<span className="text-muted">
						{row.original.duration_min.toFixed(0)}m
					</span>
				),
			},
			{
				accessorKey: "total_tokens",
				header: "Tokens",
				cell: ({ row }) => (
					<span className="text-muted">
						{(row.original.total_tokens / 1000).toFixed(0)}K
					</span>
				),
			},
			{
				id: "features",
				header: "Features",
				enableSorting: false,
				cell: ({ row }) => (
					<div className="flex gap-1">
						{row.original.has_subagents && (
							<span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
								SA
							</span>
						)}
						{row.original.has_skills && (
							<span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
								SK
							</span>
						)}
						{row.original.has_slash_commands && (
							<span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
								SC
							</span>
						)}
					</div>
				),
			},
			{
				id: "status",
				header: "Status",
				enableSorting: false,
				cell: ({ row }) => {
					if (row.original.likely_success) {
						return (
							<span className="px-2 py-1 text-xs bg-status-success-bg text-status-success-text rounded-full">
								Success
							</span>
						);
					}
					if (row.original.has_errors) {
						return (
							<span className="px-2 py-1 text-xs bg-status-error-bg text-status-error-text rounded-full">
								Error
							</span>
						);
					}
					return (
						<span className="px-2 py-1 text-xs bg-surface text-subheading rounded-full">
							Unknown
						</span>
					);
				},
			},
		],
		[],
	);

	if (detailsLoading || !details) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Developer Details"
					description="Loading developer information..."
					actions={
						<Button variant="outline" size="sm" asChild>
							<Link to="/dashboard/developers">
								<ArrowLeft className="h-4 w-4" />
								Back to Developers
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

	return (
		<div className="px-8 py-6">
			<PageHeader
				title={username}
				description="Detailed developer activity and metrics"
				actions={
					<div className="flex items-center gap-3">
						<DatePicker
							startDate={startDate}
							endDate={endDate}
							onStartDateChange={setStartDate}
							onEndDateChange={setEndDate}
						/>
						<Button variant="outline" size="sm" asChild>
							<Link to="/dashboard/developers">
								<ArrowLeft className="h-4 w-4" />
								Back
							</Link>
						</Button>
					</div>
				}
			/>

			{/* Summary Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					title="Total Sessions"
					value={details.total_sessions}
					icon={Activity}
					iconColor="text-blue-600"
				/>
				<StatCard
					title="Active Days"
					value={details.active_days}
					icon={Calendar}
					iconColor="text-green-600"
				/>
				<StatCard
					title="Total Tokens"
					value={`${(details.total_tokens / 1000000).toFixed(1)}M`}
					icon={Code}
					iconColor="text-purple-600"
				/>
				<StatCard
					title="Avg Session"
					value={`${details.avg_session_duration_min.toFixed(0)}m`}
					icon={Clock}
					iconColor="text-orange-600"
				/>
			</div>

			{/* Activity Timeline */}
			{chartData.length > 0 && (
				<AnalyticsCard className="mb-8">
					<div className="flex justify-between items-start mb-4">
						<div>
							<h2 className="text-xl font-bold text-heading">
								Daily Activity{" "}
								<span className={`ml-2 ${trendColorClass}`}>{trendIcon}</span>
							</h2>
						</div>
						{timeline && timeline.length >= 14 && (
							<div className="bg-surface px-4 py-2 rounded-lg">
								<p className="text-xs text-muted">Week-over-Week</p>
								<p
									className={`text-lg font-bold ${wowChange >= 0 ? "text-status-success-icon" : "text-status-error-icon"}`}
								>
									{formatWoWChange(wowChange)}
								</p>
							</div>
						)}
					</div>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke={chartTheme.gridStroke}
							/>
							<XAxis dataKey="date" stroke={chartTheme.axisStroke} />
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
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="sessions"
								stroke="#3b82f6"
								strokeWidth={2}
								name="Sessions"
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="hours"
								stroke="#10b981"
								strokeWidth={2}
								name="Hours"
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="avg7Sessions"
								stroke="#93c5fd"
								strokeWidth={2}
								strokeDasharray="5 5"
								name="7-Day Avg"
								dot={false}
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="avg30Sessions"
								stroke="#fb923c"
								strokeWidth={2}
								strokeDasharray="5 5"
								name="30-Day Avg"
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</AnalyticsCard>
			)}

			{/* Feature Adoption */}
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

			{/* Projects */}
			{projectChartData.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-6">
						Projects Worked On
					</h2>
					<ResponsiveContainer width="100%" height={350}>
						<BarChart data={projectChartData} margin={{ bottom: 60 }}>
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
				</AnalyticsCard>
			)}

			{/* Errors */}
			{errors && errors.length > 0 && (
				<AnalyticsCard className="mb-8">
					<h2 className="text-xl font-bold text-heading mb-4">
						Errors Encountered
					</h2>
					<DataTable
						columns={errorColumns}
						data={errors}
						defaultSorting={[{ id: "occurrences", desc: true }]}
						defaultPageSize={50}
					/>
				</AnalyticsCard>
			)}

			{/* Session History */}
			<AnalyticsCard>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold text-heading">Session History</h2>
					<div className="flex gap-3">
						<Select
							value={projectFilter || "all"}
							onValueChange={(v) => setProjectFilter(v === "all" ? "" : v)}
						>
							<SelectTrigger className="w-auto">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Projects</SelectItem>
								{uniqueProjects.map((path) => (
									<SelectItem key={path} value={path}>
										{path.split("/").pop()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={outcomeFilter}
							onValueChange={(v) => setOutcomeFilter(v as "all" | "success")}
						>
							<SelectTrigger className="w-auto">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Outcomes</SelectItem>
								<SelectItem value="success">Likely Success</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<DataTable
					columns={sessionColumns}
					data={sessions ?? []}
					defaultSorting={[{ id: "date", desc: true }]}
				/>
			</AnalyticsCard>
		</div>
	);
}
