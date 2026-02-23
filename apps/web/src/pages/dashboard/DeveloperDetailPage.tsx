import { useQuery } from "@tanstack/react-query";
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
import { useDateRange } from "@/contexts/DateRangeContext";
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
	const [sortBy, setSortBy] = useState<"date" | "duration" | "tokens">("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const { data: details, isLoading: detailsLoading } = useQuery(
		orpc.analytics.developers.details.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: sessions } = useQuery(
		orpc.analytics.developers.sessions.queryOptions({
			input: {
				userId: userId as string,
				days,
				limit: 100,
				projectPath: projectFilter || undefined,
				outcome: outcomeFilter,
				sortBy,
				sortOrder,
			},
		}),
	);

	const { data: projects } = useQuery(
		orpc.analytics.developers.projects.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: timeline } = useQuery(
		orpc.analytics.developers.timeline.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: features } = useQuery(
		orpc.analytics.developers.features.queryOptions({
			input: { userId: userId as string, days },
		}),
	);

	const { data: errors } = useQuery(
		orpc.analytics.developers.errors.queryOptions({
			input: { userId: userId as string, days },
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

	if (detailsLoading || !details) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Developer Details"
					description="Loading developer information..."
					actions={
						<Link
							to="/dashboard/developers"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-subheading bg-input border border-border rounded-lg hover:bg-hover"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Developers
						</Link>
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
						<Link
							to="/dashboard/developers"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-subheading bg-input border border-border rounded-lg hover:bg-hover"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Link>
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
											{new Date(error.last_seen).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</AnalyticsCard>
			)}

			{/* Session History */}
			<AnalyticsCard>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-heading">Session History</h2>
					<div className="flex gap-3">
						<select
							value={projectFilter}
							onChange={(e) => setProjectFilter(e.target.value)}
							className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent"
						>
							<option value="">All Projects</option>
							{uniqueProjects.map((path) => (
								<option key={path} value={path}>
									{path.split("/").pop()}
								</option>
							))}
						</select>
						<select
							value={outcomeFilter}
							onChange={(e) =>
								setOutcomeFilter(e.target.value as "all" | "success")
							}
							className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent"
						>
							<option value="all">All Outcomes</option>
							<option value="success">Likely Success</option>
						</select>
						<select
							value={`${sortBy}-${sortOrder}`}
							onChange={(e) => {
								const [s, o] = e.target.value.split("-");
								setSortBy(s as "date" | "duration" | "tokens");
								setSortOrder(o as "asc" | "desc");
							}}
							className="px-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent"
						>
							<option value="date-desc">Date (Newest)</option>
							<option value="date-asc">Date (Oldest)</option>
							<option value="duration-desc">Duration (Longest)</option>
							<option value="duration-asc">Duration (Shortest)</option>
							<option value="tokens-desc">Tokens (Most)</option>
							<option value="tokens-asc">Tokens (Least)</option>
						</select>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-border">
						<thead className="bg-surface">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Project
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Duration
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Tokens
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Features
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="bg-input divide-y divide-border">
							{sessions?.map((session) => (
								<tr key={session.session_id} className="hover:bg-hover">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{new Date(session.session_date).toLocaleString()}
									</td>
									<td className="px-6 py-4 text-sm">
										<span className="font-medium text-foreground">
											{session.project_path.split("/").pop()}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{session.duration_min.toFixed(0)}m
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{(session.total_tokens / 1000).toFixed(0)}K
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<div className="flex gap-1">
											{session.has_subagents && (
												<span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
													SA
												</span>
											)}
											{session.has_skills && (
												<span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
													SK
												</span>
											)}
											{session.has_slash_commands && (
												<span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
													SC
												</span>
											)}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										{session.likely_success ? (
											<span className="px-2 py-1 text-xs bg-status-success-bg text-status-success-text rounded-full">
												Success
											</span>
										) : session.has_errors ? (
											<span className="px-2 py-1 text-xs bg-status-error-bg text-status-error-text rounded-full">
												Error
											</span>
										) : (
											<span className="px-2 py-1 text-xs bg-surface text-subheading rounded-full">
												Unknown
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</AnalyticsCard>
		</div>
	);
}
