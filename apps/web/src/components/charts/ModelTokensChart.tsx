import type { ModelTokensTrendData } from "@rudel/api-routes";
import { useMemo } from "react";
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

const MODEL_COLORS = [
	"#3b82f6",
	"#f59e0b",
	"#10b981",
	"#8b5cf6",
	"#ef4444",
	"#06b6d4",
	"#ec4899",
	"#f97316",
	"#6b7280",
];

function formatCompactNumber(num: number): string {
	if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toFixed(0);
}

function shortenModelName(model: string): string {
	return model.replace("claude-", "").replace(/-\d{8}$/, "");
}

interface ModelTokensChartProps {
	data: ModelTokensTrendData[];
}

export function ModelTokensChart({ data }: ModelTokensChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke } = useChartTheme();

	const { chartData, models } = useMemo(() => {
		const modelSet = new Set<string>();
		const byDate = new Map<
			string,
			{ _sort: string } & Record<string, number | string>
		>();

		for (const row of data) {
			modelSet.add(row.model);
			const dateLabel = new Date(row.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
			const entry = byDate.get(row.date) || {
				date: dateLabel,
				_sort: row.date,
			};
			entry[row.model] = row.total_tokens;
			byDate.set(row.date, entry);
		}

		const sorted = Array.from(byDate.values()).sort((a, b) =>
			a._sort.localeCompare(b._sort),
		);

		return {
			chartData: sorted,
			models: Array.from(modelSet),
		};
	}, [data]);

	if (chartData.length === 0) return null;

	return (
		<ResponsiveContainer width="100%" height={400}>
			<AreaChart
				data={chartData}
				margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
			>
				<CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
				<XAxis
					dataKey="date"
					tick={{ fontSize: 12 }}
					angle={-45}
					textAnchor="end"
					height={80}
				/>
				<YAxis tick={{ fontSize: 12 }} tickFormatter={formatCompactNumber} />
				<Tooltip
					contentStyle={{
						backgroundColor: tooltipBg,
						border: `1px solid ${tooltipBorder}`,
						borderRadius: "2px",
						padding: "12px",
					}}
					formatter={(value, name) => [
						formatCompactNumber((value as number) ?? 0),
						shortenModelName(String(name ?? "")),
					]}
					labelFormatter={(label) => label}
				/>
				<Legend formatter={shortenModelName} />
				{models.map((model, i) => (
					<Area
						key={model}
						type="monotone"
						dataKey={model}
						stackId="1"
						fill={MODEL_COLORS[i % MODEL_COLORS.length]}
						stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
						fillOpacity={0.6}
						name={model}
					/>
				))}
			</AreaChart>
		</ResponsiveContainer>
	);
}
