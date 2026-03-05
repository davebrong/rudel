import { useMemo, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useChartTheme } from "@/hooks/useChartTheme";

const MAX_SERIES = 14;
const OTHER_COLOR = "#9ca3af";

interface LearningsTrendChartProps {
	data: Record<string, string | number>[];
	splitBy: "user_id" | "repository";
	onSplitByChange: (splitBy: "user_id" | "repository") => void;
	userMap?: Record<string, string>;
}

const COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#8b5cf6",
	"#ef4444",
	"#06b6d4",
	"#ec4899",
	"#14b8a6",
	"#f97316",
	"#6366f1",
	"#84cc16",
	"#a855f7",
	"#f43f5e",
	"#0ea5e9",
];

export function LearningsTrendChart({
	data,
	splitBy,
	onSplitByChange,
	userMap,
}: LearningsTrendChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke } = useChartTheme();
	const [isCumulative, setIsCumulative] = useState(true);

	// All series keys from the data
	const allSeriesKeys = useMemo(() => {
		if (data.length === 0) return [];
		const keys = new Set<string>();
		for (const item of data) {
			for (const key of Object.keys(item)) {
				if (key !== "date") keys.add(key);
			}
		}
		return Array.from(keys).sort();
	}, [data]);

	// Cap at MAX_SERIES, rest → "Other"
	const { seriesKeys, hasOther } = useMemo(() => {
		if (allSeriesKeys.length <= MAX_SERIES) {
			return { seriesKeys: allSeriesKeys, hasOther: false };
		}
		// Rank by total value across all dates
		const totals = new Map<string, number>();
		for (const item of data) {
			for (const key of allSeriesKeys) {
				totals.set(key, (totals.get(key) ?? 0) + ((item[key] as number) || 0));
			}
		}
		const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
		return {
			seriesKeys: sorted.slice(0, MAX_SERIES).map(([k]) => k),
			hasOther: true,
		};
	}, [allSeriesKeys, data]);

	const filledData = useMemo(() => {
		if (data.length === 0) return [];

		const existingDates = Array.from(
			new Set(data.map((d) => d.date as string)),
		).sort();
		const minDate = new Date(existingDates[0]);
		const maxDate = new Date(existingDates[existingDates.length - 1]);
		const dateRange: string[] = [];
		for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
			dateRange.push(d.toISOString().split("T")[0]);
		}

		const dataByDate = new Map(data.map((item) => [item.date as string, item]));
		const topKeysSet = new Set(seriesKeys);

		return dateRange.map((dateKey) => {
			const item = dataByDate.get(dateKey);
			const entry: Record<string, string | number> = { date: dateKey };
			for (const key of seriesKeys) {
				entry[key] = item ? (item[key] as number) || 0 : 0;
			}
			if (hasOther) {
				entry.Other = item
					? allSeriesKeys
							.filter((k) => !topKeysSet.has(k))
							.reduce((sum, k) => sum + ((item[k] as number) || 0), 0)
					: 0;
			}
			return entry;
		});
	}, [data, seriesKeys, allSeriesKeys, hasOther]);

	const displayKeys = hasOther ? [...seriesKeys, "Other"] : seriesKeys;

	const chartData = useMemo(() => {
		if (!isCumulative) {
			return filledData.map((item) => ({
				...item,
				displayDate: new Date(item.date as string).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			}));
		}

		const cumulativeData = [];
		const runningTotals: Record<string, number> = {};
		for (const key of displayKeys) {
			runningTotals[key] = 0;
		}

		for (const item of filledData) {
			const cumulativeItem: Record<string, unknown> = {
				date: item.date,
				displayDate: new Date(item.date as string).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			};
			for (const key of displayKeys) {
				runningTotals[key] += (item[key] as number) || 0;
				cumulativeItem[key] = runningTotals[key];
			}
			cumulativeData.push(cumulativeItem);
		}

		return cumulativeData;
	}, [filledData, isCumulative, displayKeys]);

	const getDisplayName = (key: string): string => {
		if (key === "Other") return "Other";
		if (splitBy === "user_id" && userMap) {
			return userMap[key] || `${key.substring(0, 12)}...`;
		}
		return key;
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-end gap-4">
				<div className="flex items-center gap-2">
					<Select
						value={splitBy}
						onValueChange={(v) =>
							onSplitByChange(v as "user_id" | "repository")
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="user_id">by Developer</SelectItem>
							<SelectItem value="repository">by Repository</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<label
						htmlFor="cumulative-toggle"
						className="text-sm font-medium text-muted cursor-pointer"
					>
						Cumulative
					</label>
					<Switch
						id="cumulative-toggle"
						checked={isCumulative}
						onCheckedChange={setIsCumulative}
					/>
				</div>
			</div>

			<ResponsiveContainer width="100%" height={400}>
				<BarChart
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
						tickMargin={8}
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
					{displayKeys.map((key, index) => (
						<Bar
							key={key}
							dataKey={key}
							name={key}
							stackId="1"
							fill={
								key === "Other" ? OTHER_COLOR : COLORS[index % COLORS.length]
							}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>

			{displayKeys.length === 0 && (
				<div className="text-center text-sm text-muted py-4">
					No data available for the selected time period
				</div>
			)}
		</div>
	);
}
