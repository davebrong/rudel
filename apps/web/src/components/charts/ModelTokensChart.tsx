import type { ModelTokensTrendData } from "@rudel/api-routes";
import { useMemo } from "react";
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
import { useChartTheme } from "@/hooks/useChartTheme";

const MODEL_COLORS = [
	"#6b7280",
	"#3b82f6",
	"#f59e0b",
	"#10b981",
	"#8b5cf6",
	"#ef4444",
	"#06b6d4",
	"#ec4899",
	"#f97316",
];

function formatCompactNumber(num: number): string {
	if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toFixed(0);
}

function shortenModelName(model: string): string {
	if (model === "Weighted") return "Weighted";
	return model.replace("claude-", "").replace(/-\d{8}$/, "");
}

function getModelWeight(model: string): number {
	const lower = model.toLowerCase();
	if (lower.includes("opus")) return 3.2;
	if (lower.includes("haiku")) return 0.53;
	return 1;
}

interface ModelTokensChartProps {
	data: ModelTokensTrendData[];
}

export function ModelTokensChart({ data }: ModelTokensChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke } = useChartTheme();

	const { chartData, models } = useMemo(() => {
		const modelSet = new Set<string>();
		const byDate = new Map<string, Record<string, number | string>>();

		for (const row of data) {
			modelSet.add(row.model);
			const dateLabel = new Date(row.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
			const entry = byDate.get(dateLabel) || { date: dateLabel, Weighted: 0 };
			entry[row.model] = row.total_tokens;
			entry.Weighted =
				((entry.Weighted as number) || 0) +
				row.total_tokens * getModelWeight(row.model);
			byDate.set(dateLabel, entry);
		}

		return {
			chartData: Array.from(byDate.values()),
			models: ["Weighted", ...Array.from(modelSet)],
		};
	}, [data]);

	if (chartData.length === 0) return null;

	return (
		<ResponsiveContainer width="100%" height={400}>
			<BarChart
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
					cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
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
					<Bar
						key={model}
						dataKey={model}
						fill={MODEL_COLORS[i % MODEL_COLORS.length]}
						name={model}
					/>
				))}
			</BarChart>
		</ResponsiveContainer>
	);
}
