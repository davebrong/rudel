import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { MultiSelect } from "@/components/analytics/MultiSelect";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { DimensionAnalysisChart } from "@/components/charts/DimensionAnalysisChart";
import { useDateRange } from "@/contexts/DateRangeContext";
import { calculateCost, formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function SessionsListPage() {
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const days = calculateDays();

	const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
		[],
	);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const [selectedDimension, setSelectedDimension] = useState("repository");
	const [selectedMetric, setSelectedMetric] = useState("session_count");
	const [selectedSplitBy, setSelectedSplitBy] = useState<string>("");
	const [showPercentage, setShowPercentage] = useState(false);

	const [debouncedDimension, setDebouncedDimension] = useState("repository");
	const [debouncedMetric, setDebouncedMetric] = useState("session_count");
	const [debouncedSplitBy, setDebouncedSplitBy] = useState<string>("");

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedDimension(selectedDimension);
			setDebouncedMetric(selectedMetric);
			setDebouncedSplitBy(selectedSplitBy);
		}, 300);
		return () => clearTimeout(timer);
	}, [selectedDimension, selectedMetric, selectedSplitBy]);

	const { data: summary } = useQuery(
		orpc.analytics.sessions.summary.queryOptions({ input: { days } }),
	);

	const { data: comparison } = useQuery(
		orpc.analytics.sessions.summaryComparison.queryOptions({
			input: { days },
		}),
	);

	const { data: sessions, isLoading } = useQuery(
		orpc.analytics.sessions.list.queryOptions({
			input: { days, limit: 100, sortBy: "session_date", sortOrder: "desc" },
		}),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 30 } }),
	);

	const { data: dimensionData, isLoading: dimensionLoading } = useQuery(
		orpc.analytics.sessions.dimensionAnalysis.queryOptions({
			input: {
				days,
				dimension: debouncedDimension,
				metric: debouncedMetric,
				splitBy: debouncedSplitBy || undefined,
				limit: 10,
			},
		}),
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

	const filteredSessions = useMemo(() => {
		if (!sessions) return [];
		return sessions.filter((session) => {
			const repoMatch =
				selectedRepositories.length === 0 ||
				(session.repository &&
					selectedRepositories.includes(session.repository));
			const userMatch =
				selectedUsers.length === 0 || selectedUsers.includes(session.user_id);
			return repoMatch && userMatch;
		});
	}, [sessions, selectedRepositories, selectedUsers]);

	const repositories = useMemo(() => {
		if (!sessions) return [];
		return Array.from(
			new Set(sessions.map((s) => s.repository).filter(Boolean)),
		).sort() as string[];
	}, [sessions]);

	const users = useMemo(() => {
		if (!sessions) return [];
		return Array.from(
			new Set(sessions.map((s) => s.user_id).filter(Boolean)),
		).sort();
	}, [sessions]);

	if (isLoading) {
		return (
			<div className="px-8 py-6">
				<PageHeader
					title="Sessions"
					description="Analyze session interaction timing and patterns"
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
					<p className="text-center text-muted">Loading session analytics...</p>
				</AnalyticsCard>
			</div>
		);
	}

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="Sessions"
				description="Analyze session interaction timing and patterns"
				actions={
					<DatePicker
						startDate={startDate}
						endDate={endDate}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
					/>
				}
			/>

			{summary && comparison && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<StatCard
						title="Total Sessions"
						value={summary.total_sessions.toLocaleString()}
						icon={Activity}
						iconColor="text-blue-600"
						trend={{ value: comparison.changes.total_sessions }}
					/>
					<StatCard
						title="Avg Session Duration"
						value={`${summary.avg_session_duration_min.toFixed(1)} min`}
						icon={Clock}
						iconColor="text-purple-600"
						trend={{ value: comparison.changes.avg_session_duration_min }}
					/>
					<StatCard
						title="Avg Response Time"
						value={`${summary.avg_response_time_sec.toFixed(1)}s`}
						icon={Timer}
						iconColor="text-green-600"
						trend={{ value: comparison.changes.avg_response_time_sec }}
					/>
				</div>
			)}

			{/* Dimension Analysis */}
			<AnalyticsCard className="mb-8">
				<h3 className="text-lg font-semibold mb-4">
					Multi-Dimensional Analysis
				</h3>
				<p className="text-sm text-muted mb-6">
					Analyze sessions across different dimensions and metrics.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div>
						<label
							htmlFor="sessions-metric-select"
							className="block text-sm font-medium text-subheading mb-2"
						>
							Measure (Y-Axis)
						</label>
						<select
							id="sessions-metric-select"
							value={selectedMetric}
							onChange={(e) => setSelectedMetric(e.target.value)}
							className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
						>
							<option value="session_count">Session Count</option>
							<option value="avg_duration">Avg Duration (min)</option>
							<option value="total_duration">Total Duration (hours)</option>
							<option value="avg_tokens">Avg Tokens</option>
							<option value="total_tokens">Total Tokens</option>
							<option value="avg_success_score">Avg Success Score</option>
							<option value="total_errors">Total Errors</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="sessions-dimension-select"
							className="block text-sm font-medium text-subheading mb-2"
						>
							Group By (X-Axis)
						</label>
						<select
							id="sessions-dimension-select"
							value={selectedDimension}
							onChange={(e) => setSelectedDimension(e.target.value)}
							className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
						>
							<option value="">None</option>
							<option value="task_type">Task Type</option>
							<option value="session_archetype">Session Type</option>
							<option value="model_used">Model Used</option>
							<option value="user_id">User/Developer</option>
							<option value="project_path">Project</option>
							<option value="repository">Repository</option>
							<option value="has_commit">Has Commit</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="sessions-splitby-select"
							className="block text-sm font-medium text-subheading mb-2"
						>
							Split By (Optional)
						</label>
						<select
							id="sessions-splitby-select"
							value={selectedSplitBy}
							onChange={(e) => {
								setSelectedSplitBy(e.target.value);
								if (!e.target.value) setShowPercentage(false);
							}}
							className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
						>
							<option value="">None</option>
							<option value="task_type">Task Type</option>
							<option value="session_archetype">Session Type</option>
							<option value="model_used">Model Used</option>
							<option value="user_id">User/Developer</option>
							<option value="repository">Repository</option>
						</select>
					</div>
				</div>

				{selectedSplitBy && (
					<div className="mb-4 flex justify-end items-center gap-3">
						<span className="text-sm text-muted">
							{showPercentage ? "Showing as %" : "Showing absolute values"}
						</span>
						<button
							type="button"
							onClick={() => setShowPercentage(!showPercentage)}
							className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
							style={{
								backgroundColor: showPercentage
									? "var(--color-accent)"
									: "var(--color-border)",
							}}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
									showPercentage ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>
				)}

				{dimensionLoading ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
							<p className="text-muted">Loading chart...</p>
						</div>
					</div>
				) : (
					<DimensionAnalysisChart
						data={dimensionData || []}
						dimension={selectedDimension}
						metric={selectedMetric}
						split_by={selectedSplitBy || undefined}
						showPercentage={showPercentage}
						userMap={userMap}
					/>
				)}
			</AnalyticsCard>

			{/* Sessions Table */}
			<AnalyticsCard>
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-lg font-semibold">
							Recent Sessions ({filteredSessions.length})
						</h3>
					</div>
					<div className="flex gap-3">
						<MultiSelect
							options={repositories}
							selected={selectedRepositories}
							onChange={setSelectedRepositories}
							placeholder="All Repositories"
							className="w-48"
						/>
						<MultiSelect
							options={users}
							selected={selectedUsers}
							onChange={setSelectedUsers}
							placeholder="All Developers"
							className="w-48"
						/>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-border">
						<thead className="bg-surface">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Session ID
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Project
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Duration
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Success Score
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
									Cost
								</th>
							</tr>
						</thead>
						<tbody className="bg-input divide-y divide-border">
							{filteredSessions.map((session) => (
								<tr
									key={session.session_id}
									className="hover:bg-hover cursor-pointer"
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<Link
											to={`/dashboard/sessions/${session.session_id}`}
											className="text-accent hover:text-accent-hover hover:underline font-mono text-xs"
										>
											{session.session_id.slice(0, 8)}...
										</Link>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
										{new Date(session.session_date).toLocaleDateString()}
										<br />
										<span className="text-xs text-muted">
											{new Date(session.session_date).toLocaleTimeString()}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-subheading">
										{formatUsername(session.user_id, userMapRecord)}
									</td>
									<td className="px-6 py-4 text-sm text-foreground">
										<div
											className="max-w-xs truncate"
											title={session.project_path}
										>
											{session.project_path.split("/").pop() ||
												session.project_path}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
										{session.duration_min.toFixed(0)} min
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span
											className={`font-semibold ${
												session.success_score >= 70
													? "text-status-success-icon"
													: session.success_score >= 40
														? "text-status-warning-icon"
														: "text-status-error-icon"
											}`}
										>
											{session.success_score.toFixed(0)}
										</span>
										<span className="text-xs text-muted"> / 100</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
										$
										{calculateCost(
											session.input_tokens,
											session.output_tokens,
										).toFixed(4)}
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
