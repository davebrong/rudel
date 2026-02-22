import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	DollarSign,
	Target,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
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
import { formatUsername } from "@/lib/format";
import { orpc } from "@/lib/orpc";

export function ROIPage() {
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const chartTheme = useChartTheme();
	const days = calculateDays();

	const [roiInputs, setRoiInputs] = useState({
		codePercentage: 65,
		tokensPerLOC: 15,
		locPerHour: 30,
		devHourlyRate: 100,
	});

	const { data: metrics, isLoading } = useQuery(
		orpc.analytics.roi.metrics.queryOptions({ input: { days } }),
	);

	const { data: trends } = useQuery(
		orpc.analytics.roi.trends.queryOptions({ input: { days: 56 } }),
	);

	const { data: developerCosts } = useQuery(
		orpc.analytics.roi.breakdownDevelopers.queryOptions({ input: { days } }),
	);

	const { data: projectCosts } = useQuery(
		orpc.analytics.roi.breakdownProjects.queryOptions({ input: { days } }),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 90 } }),
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

	const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
	const formatPercent = (value: number) =>
		`${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

	const formatCompact = (value: number): string => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
		return value.toString();
	};

	const calculatedROI = useMemo(() => {
		if (!metrics) return null;
		const loc =
			(metrics.output_tokens * (roiInputs.codePercentage / 100)) /
			roiInputs.tokensPerLOC;
		const hoursSaved = loc / roiInputs.locPerHour;
		const valueCreated = hoursSaved * roiInputs.devHourlyRate;
		const dollarValueSaved = valueCreated - metrics.total_cost;
		const roiPercentage =
			metrics.total_cost > 0
				? (dollarValueSaved / metrics.total_cost) * 100
				: 0;

		return {
			loc: Math.round(loc),
			hoursSaved: parseFloat(hoursSaved.toFixed(2)),
			valueCreated: parseFloat(valueCreated.toFixed(2)),
			dollarValueSaved: parseFloat(dollarValueSaved.toFixed(2)),
			roiPercentage: parseFloat(roiPercentage.toFixed(2)),
		};
	}, [metrics, roiInputs]);

	const resetToDefaults = () => {
		setRoiInputs({
			codePercentage: 65,
			tokensPerLOC: 15,
			locPerHour: 30,
			devHourlyRate: 100,
		});
	};

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="ROI & Business Value"
				description="Track return on investment and measure business impact of Claude Code"
				actions={
					<DatePicker
						startDate={startDate}
						endDate={endDate}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
					/>
				}
			/>

			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-4" />
						<p className="text-muted">Loading ROI data...</p>
					</div>
				</div>
			)}

			{!isLoading && metrics && calculatedROI && (
				<>
					{/* Input Configuration */}
					<AnalyticsCard className="mb-6">
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-heading">
								ROI Calculation Parameters
							</h3>
							<p className="text-sm text-muted mt-1">
								Adjust inputs to explore different ROI scenarios
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div>
								<label
									htmlFor="codePercentage"
									className="block text-sm font-medium text-subheading mb-1"
								>
									Code Percentage (%)
								</label>
								<input
									id="codePercentage"
									type="number"
									value={roiInputs.codePercentage}
									onChange={(e) =>
										setRoiInputs({
											...roiInputs,
											codePercentage: parseFloat(e.target.value) || 0,
										})
									}
									min={0}
									max={100}
									className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-accent focus:border-accent"
								/>
								<p className="text-xs text-muted mt-1">
									% of output that is actual code
								</p>
							</div>
							<div>
								<label
									htmlFor="tokensPerLOC"
									className="block text-sm font-medium text-subheading mb-1"
								>
									Tokens per LOC
								</label>
								<input
									id="tokensPerLOC"
									type="number"
									value={roiInputs.tokensPerLOC}
									onChange={(e) =>
										setRoiInputs({
											...roiInputs,
											tokensPerLOC: parseFloat(e.target.value) || 1,
										})
									}
									min={1}
									className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-accent focus:border-accent"
								/>
								<p className="text-xs text-muted mt-1">
									Average tokens per line of code
								</p>
							</div>
							<div>
								<label
									htmlFor="locPerHour"
									className="block text-sm font-medium text-subheading mb-1"
								>
									LOC per Hour (baseline)
								</label>
								<input
									id="locPerHour"
									type="number"
									value={roiInputs.locPerHour}
									onChange={(e) =>
										setRoiInputs({
											...roiInputs,
											locPerHour: parseFloat(e.target.value) || 1,
										})
									}
									min={1}
									className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-accent focus:border-accent"
								/>
								<p className="text-xs text-muted mt-1">
									Manual coding speed without Claude
								</p>
							</div>
							<div>
								<label
									htmlFor="devHourlyRate"
									className="block text-sm font-medium text-subheading mb-1"
								>
									Developer Rate ($/hr)
								</label>
								<input
									id="devHourlyRate"
									type="number"
									value={roiInputs.devHourlyRate}
									onChange={(e) =>
										setRoiInputs({
											...roiInputs,
											devHourlyRate: parseFloat(e.target.value) || 1,
										})
									}
									min={1}
									className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-accent focus:border-accent"
								/>
								<p className="text-xs text-muted mt-1">Hourly developer cost</p>
							</div>
						</div>
						<div className="mt-4">
							<button
								type="button"
								onClick={resetToDefaults}
								className="px-4 py-2 text-sm font-medium text-accent bg-accent-light border border-accent-light rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
							>
								Reset to Defaults
							</button>
						</div>
					</AnalyticsCard>

					{/* KPI Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<StatCard
							title="Total Spend"
							value={formatCurrency(metrics.total_cost)}
							icon={DollarSign}
							iconColor="text-red-600"
							trend={{ value: metrics.total_cost_change_pct }}
						/>
						<StatCard
							title="Cost per Commit"
							value={
								metrics.cost_per_commit > 0
									? formatCurrency(metrics.cost_per_commit)
									: "N/A"
							}
							icon={Target}
							iconColor="text-blue-600"
							trend={{ value: metrics.cost_per_commit_change_pct }}
						/>
						<StatCard
							title="Dev Hours Saved"
							value={`${formatCompact(calculatedROI.hoursSaved)}h`}
							icon={Activity}
							iconColor="text-green-600"
							trend={{ value: metrics.dev_hours_saved_change_pct }}
						/>
						<StatCard
							title="Dollar Value Saved"
							value={`$${formatCompact(calculatedROI.dollarValueSaved)}`}
							icon={
								calculatedROI.roiPercentage >= 0 ? TrendingUp : TrendingDown
							}
							iconColor={
								calculatedROI.roiPercentage >= 0
									? "text-green-600"
									: "text-red-600"
							}
						/>
					</div>

					{/* ROI Breakdown */}
					<AnalyticsCard className="mb-8">
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-heading">
								ROI Calculation Breakdown
							</h3>
						</div>
						<div className="bg-surface rounded-lg p-6 font-mono text-sm">
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-muted">Output Tokens:</span>
									<span className="font-semibold text-foreground">
										{formatCompact(metrics.output_tokens)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted">
										Code % ({roiInputs.codePercentage}%):
									</span>
									<span className="font-semibold text-foreground">
										{formatCompact(calculatedROI.loc)} LOC
									</span>
								</div>
								<div className="flex justify-between border-b border-border pb-2">
									<span className="text-muted">
										Hours Saved (LOC / {roiInputs.locPerHour}):
									</span>
									<span className="font-semibold text-foreground">
										{formatCompact(calculatedROI.hoursSaved)} hours
									</span>
								</div>
								<div className="pt-2 space-y-2">
									<div className="flex justify-between">
										<span className="text-muted">Value Created:</span>
										<span className="font-semibold text-status-success-icon">
											${formatCompact(calculatedROI.valueCreated)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted">Token Cost:</span>
										<span className="font-semibold text-status-error-icon">
											-{formatCurrency(metrics.total_cost)}
										</span>
									</div>
									<div className="flex justify-between border-t-2 border-border pt-2 mt-2">
										<span className="text-foreground font-bold">
											Net Value:
										</span>
										<span className="font-bold text-accent text-lg">
											${formatCompact(calculatedROI.dollarValueSaved)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-foreground font-bold">ROI:</span>
										<span
											className={`font-bold text-lg ${
												calculatedROI.roiPercentage >= 0
													? "text-status-success-icon"
													: "text-status-error-icon"
											}`}
										>
											{formatPercent(calculatedROI.roiPercentage)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</AnalyticsCard>

					{/* Trends Charts */}
					{trends && trends.length > 0 && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
							<AnalyticsCard>
								<div className="mb-4">
									<h3 className="text-lg font-semibold text-heading">
										Weekly Cost Trend
									</h3>
									<p className="text-sm text-muted mt-1">
										Total spend over time
									</p>
								</div>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={trends}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={chartTheme.gridStroke}
										/>
										<XAxis
											dataKey="week_start"
											stroke={chartTheme.axisStroke}
											fontSize={12}
											tickFormatter={(value) =>
												new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})
											}
										/>
										<YAxis
											stroke={chartTheme.axisStroke}
											fontSize={12}
											tickFormatter={(value) => `$${value}`}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: chartTheme.tooltipBg,
												borderColor: chartTheme.tooltipBorder,
											}}
											formatter={(value) => [
												`$${((value as number) ?? 0).toFixed(2)}`,
												"Cost",
											]}
											labelFormatter={(label) =>
												`Week of ${new Date(label).toLocaleDateString()}`
											}
										/>
										<Line
											type="monotone"
											dataKey="total_cost"
											stroke="#3b82f6"
											strokeWidth={2}
											dot={{ r: 4 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</AnalyticsCard>

							<AnalyticsCard>
								<div className="mb-4">
									<h3 className="text-lg font-semibold text-heading">
										Weekly Productivity Score
									</h3>
									<p className="text-sm text-muted mt-1">
										Commits per dollar x 100
									</p>
								</div>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={trends}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={chartTheme.gridStroke}
										/>
										<XAxis
											dataKey="week_start"
											stroke={chartTheme.axisStroke}
											fontSize={12}
											tickFormatter={(value) =>
												new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})
											}
										/>
										<YAxis stroke={chartTheme.axisStroke} fontSize={12} />
										<Tooltip
											contentStyle={{
												backgroundColor: chartTheme.tooltipBg,
												borderColor: chartTheme.tooltipBorder,
											}}
											labelFormatter={(label) =>
												`Week of ${new Date(label).toLocaleDateString()}`
											}
										/>
										<Line
											type="monotone"
											dataKey="productivity_score"
											stroke="#10b981"
											strokeWidth={2}
											dot={{ r: 4 }}
											name="Productivity Score"
										/>
									</LineChart>
								</ResponsiveContainer>
							</AnalyticsCard>
						</div>
					)}

					{/* Cost Breakdown Tables */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<AnalyticsCard>
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-heading">
									Developer Cost Breakdown
								</h3>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-border">
									<thead>
										<tr className="bg-surface">
											<th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
												Developer
											</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
												Cost
											</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
												Sessions
											</th>
										</tr>
									</thead>
									<tbody className="bg-input divide-y divide-border">
										{developerCosts?.map((dev) => (
											<tr key={dev.user_id} className="hover:bg-hover">
												<td className="px-4 py-3 text-sm font-medium text-foreground">
													{formatUsername(dev.user_id, userMapRecord)}
												</td>
												<td className="px-4 py-3 text-sm text-right text-subheading">
													{formatCurrency(dev.cost)}
												</td>
												<td className="px-4 py-3 text-sm text-right text-subheading">
													{dev.sessions}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</AnalyticsCard>

						<AnalyticsCard>
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-heading">
									Project Cost Breakdown
								</h3>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-border">
									<thead>
										<tr className="bg-surface">
											<th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
												Project
											</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
												Cost
											</th>
											<th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
												Sessions
											</th>
										</tr>
									</thead>
									<tbody className="bg-input divide-y divide-border">
										{projectCosts?.slice(0, 10).map((proj) => (
											<tr key={proj.project_path} className="hover:bg-hover">
												<td className="px-4 py-3 text-sm font-medium text-foreground truncate max-w-xs">
													{proj.project_path.split("/").pop() ||
														proj.project_path}
												</td>
												<td className="px-4 py-3 text-sm text-right text-subheading">
													{formatCurrency(proj.cost)}
												</td>
												<td className="px-4 py-3 text-sm text-right text-subheading">
													{proj.sessions}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</AnalyticsCard>
					</div>
				</>
			)}
		</div>
	);
}
