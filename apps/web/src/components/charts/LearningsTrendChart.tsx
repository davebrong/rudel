import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";

interface LearningsTrendChartProps {
	data: Record<string, string | number>[];
	splitBy: "user_id" | "repository";
	onSplitByChange: (splitBy: "user_id" | "repository") => void;
	userMap?: Map<string, string>;
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
];

export function LearningsTrendChart({
	data,
	splitBy,
	onSplitByChange,
	userMap,
}: LearningsTrendChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke } = useChartTheme();
	const [isCumulative, setIsCumulative] = useState(true);

	const seriesKeys = useMemo(() => {
		if (data.length === 0) return [];
		const keys = new Set<string>();
		for (const item of data) {
			for (const key of Object.keys(item)) {
				if (key !== "date") {
					keys.add(key);
				}
			}
		}
		return Array.from(keys).sort();
	}, [data]);

	const chartData = useMemo(() => {
		if (!isCumulative) {
			return data.map((item) => ({
				...item,
				displayDate: new Date(item.date as string).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			}));
		}

		const cumulativeData = [];
		const runningTotals: Record<string, number> = {};

		for (const key of seriesKeys) {
			runningTotals[key] = 0;
		}

		for (const item of data) {
			const cumulativeItem: Record<string, unknown> = {
				date: item.date,
				displayDate: new Date(item.date as string).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			};

			for (const key of seriesKeys) {
				runningTotals[key] += (item[key] as number) || 0;
				cumulativeItem[key] = runningTotals[key];
			}

			cumulativeData.push(cumulativeItem);
		}

		return cumulativeData;
	}, [data, isCumulative, seriesKeys]);

	const getDisplayName = (key: string): string => {
		if (splitBy === "user_id" && userMap) {
			return userMap.get(key) || `${key.substring(0, 12)}...`;
		}
		return key;
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-end gap-4">
				<div className="flex items-center gap-2">
					<select
						value={splitBy}
						onChange={(e) =>
							onSplitByChange(e.target.value as "user_id" | "repository")
						}
						className="px-3 py-2 border border-border rounded-md text-sm bg-input focus:outline-none focus:ring-2 focus:ring-accent w-40"
					>
						<option value="user_id">by Developer</option>
						<option value="repository">by Repository</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<label
						htmlFor="cumulative-toggle"
						className="text-sm font-medium text-muted cursor-pointer"
					>
						Cumulative
					</label>
					<button
						type="button"
						id="cumulative-toggle"
						role="switch"
						aria-checked={isCumulative}
						onClick={() => setIsCumulative(!isCumulative)}
						className={`
							relative inline-flex h-6 w-11 items-center rounded-full transition-colors
							${isCumulative ? "bg-accent" : "bg-border"}
						`}
					>
						<span
							className={`
								inline-block h-4 w-4 transform rounded-full bg-input transition-transform
								${isCumulative ? "translate-x-6" : "translate-x-1"}
							`}
						/>
					</button>
				</div>
			</div>

			<ResponsiveContainer width="100%" height={400}>
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
			</ResponsiveContainer>

			{seriesKeys.length === 0 && (
				<div className="text-center text-sm text-muted py-4">
					No data available for the selected time period
				</div>
			)}
		</div>
	);
}
