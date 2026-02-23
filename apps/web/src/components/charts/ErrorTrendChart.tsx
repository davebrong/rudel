import type { ErrorTrendDataPoint } from "@rudel/api-routes";
import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";

interface ErrorTrendChartProps {
	data: ErrorTrendDataPoint[];
	metric:
		| "avg_errors_per_interaction"
		| "avg_errors_per_session"
		| "total_errors";
	splitBy: "repository" | "user_id" | "model";
	onMetricChange: (
		metric:
			| "avg_errors_per_interaction"
			| "avg_errors_per_session"
			| "total_errors",
	) => void;
	onSplitByChange: (splitBy: "repository" | "user_id" | "model") => void;
	userMap?: Map<string, string>;
}

const COLORS = [
	"#ef4444",
	"#f59e0b",
	"#10b981",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#14b8a6",
	"#f97316",
	"#6366f1",
];

const METRIC_LABELS: Record<string, string> = {
	avg_errors_per_interaction: "Avg Errors per Interaction",
	avg_errors_per_session: "Avg Errors per Session",
	total_errors: "Total Errors",
};

const SPLIT_LABELS: Record<string, string> = {
	repository: "by Repository",
	user_id: "by Developer",
	model: "by Model",
};

export function ErrorTrendChart({
	data,
	metric,
	splitBy,
	onMetricChange,
	onSplitByChange,
	userMap,
}: ErrorTrendChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke } = useChartTheme();

	const seriesKeys = useMemo(() => {
		if (data.length === 0) return [];
		const keys = new Set<string>();
		for (const item of data) {
			keys.add(item.dimension);
		}
		return Array.from(keys).sort();
	}, [data]);

	const chartData = useMemo(() => {
		if (data.length === 0) return [];

		const allDates = Array.from(new Set(data.map((item) => item.date))).sort();
		if (allDates.length === 0) return [];

		const minDate = new Date(allDates[0]);
		const maxDate = new Date(allDates[allDates.length - 1]);
		const dateRange: string[] = [];

		for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
			dateRange.push(d.toISOString().split("T")[0]);
		}

		const dateMap = new Map<string, Record<string, unknown>>();

		for (const dateKey of dateRange) {
			const dateData: Record<string, unknown> = {
				date: dateKey,
				displayDate: new Date(dateKey).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			};
			for (const key of seriesKeys) {
				dateData[key] = 0;
			}
			dateMap.set(dateKey, dateData);
		}

		for (const item of data) {
			const dateKey = item.date;
			const dateData = dateMap.get(dateKey);
			if (dateData) {
				dateData[item.dimension] = item[metric];
			}
		}

		return Array.from(dateMap.values()).sort((a, b) =>
			(a.date as string).localeCompare(b.date as string),
		);
	}, [data, metric, seriesKeys]);

	const getDisplayName = (key: string): string => {
		if (splitBy === "user_id" && userMap) {
			return userMap.get(key) || `${key.substring(0, 12)}...`;
		}
		return key;
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<label
						htmlFor="error-metric-select"
						className="text-sm font-medium text-muted"
					>
						Metric:
					</label>
					<select
						id="error-metric-select"
						value={metric}
						onChange={(e) => onMetricChange(e.target.value as typeof metric)}
						className="px-3 py-2 border border-border rounded-md text-sm bg-input focus:outline-none focus:ring-2 focus:ring-accent w-56"
					>
						{Object.entries(METRIC_LABELS).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2">
					<label
						htmlFor="error-split-select"
						className="text-sm font-medium text-muted"
					>
						Split:
					</label>
					<select
						id="error-split-select"
						value={splitBy}
						onChange={(e) => onSplitByChange(e.target.value as typeof splitBy)}
						className="px-3 py-2 border border-border rounded-md text-sm bg-input focus:outline-none focus:ring-2 focus:ring-accent w-40"
					>
						{Object.entries(SPLIT_LABELS).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</select>
				</div>
			</div>

			<ResponsiveContainer width="100%" height={400}>
				{metric === "total_errors" ? (
					<AreaChart
						data={chartData}
						margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
						<XAxis
							dataKey="displayDate"
							tick={{ fontSize: 12 }}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: tooltipBg,
								border: `1px solid ${tooltipBorder}`,
								borderRadius: "8px",
								padding: "12px",
							}}
							formatter={(value, name) => {
								const displayName = name ? getDisplayName(String(name)) : "";
								return [((value as number) ?? 0).toLocaleString(), displayName];
							}}
							labelFormatter={(label) => `Date: ${label}`}
						/>
						<Legend
							formatter={(value) => getDisplayName(value)}
							wrapperStyle={{ fontSize: "12px" }}
						/>
						{seriesKeys.map((key, index) => (
							<Area
								key={key}
								type="monotone"
								dataKey={key}
								name={key}
								stackId="1"
								stroke={COLORS[index % COLORS.length]}
								fill={COLORS[index % COLORS.length]}
								fillOpacity={0.6}
							/>
						))}
					</AreaChart>
				) : (
					<LineChart
						data={chartData}
						margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
						<XAxis
							dataKey="displayDate"
							tick={{ fontSize: 12 }}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: tooltipBg,
								border: `1px solid ${tooltipBorder}`,
								borderRadius: "8px",
								padding: "12px",
							}}
							formatter={(value, name) => {
								const displayName = name ? getDisplayName(String(name)) : "";
								return [((value as number) ?? 0).toFixed(2), displayName];
							}}
							labelFormatter={(label) => `Date: ${label}`}
						/>
						<Legend
							formatter={(value) => getDisplayName(value)}
							wrapperStyle={{ fontSize: "12px" }}
						/>
						{seriesKeys.map((key, index) => (
							<Line
								key={key}
								type="monotone"
								dataKey={key}
								name={key}
								stroke={COLORS[index % COLORS.length]}
								strokeWidth={2}
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
								connectNulls={false}
							/>
						))}
					</LineChart>
				)}
			</ResponsiveContainer>

			{seriesKeys.length === 0 && (
				<div className="text-center text-sm text-muted py-4">
					No error data available for the selected time period
				</div>
			)}
		</div>
	);
}
