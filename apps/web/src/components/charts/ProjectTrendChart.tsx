import type { ProjectTrendDataPoint } from "@rudel/api-routes";
import { Activity, Clock, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
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

interface ProjectTrendChartProps {
	data: ProjectTrendDataPoint[];
	maxProjects?: number;
}

type MetricType = "sessions" | "hours" | "tokens" | "success_rate";

const METRICS = {
	sessions: {
		key: "sessions",
		label: "Sessions",
		icon: Activity,
		formatter: (value: number) => value.toLocaleString(),
	},
	hours: {
		key: "total_hours",
		label: "Hours",
		icon: Clock,
		formatter: (value: number) => `${value.toFixed(1)}h`,
	},
	tokens: {
		key: "total_tokens",
		label: "Tokens",
		icon: Zap,
		formatter: (value: number) => {
			if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
			if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
			return value.toFixed(0);
		},
	},
	success_rate: {
		key: "avg_success_rate",
		label: "Success Rate",
		icon: TrendingUp,
		formatter: (value: number) => `${value.toFixed(0)}%`,
	},
};

const PROJECT_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#8b5cf6",
	"#ef4444",
	"#ec4899",
	"#14b8a6",
	"#f97316",
	"#6366f1",
	"#84cc16",
];

export function ProjectTrendChart({
	data,
	maxProjects = 10,
}: ProjectTrendChartProps) {
	const { tooltipBg, tooltipBorder, gridStroke, axisStroke } = useChartTheme();
	const [selectedMetric, setSelectedMetric] = useState<MetricType>("sessions");

	const currentMetric = METRICS[selectedMetric];

	// Get top projects by total sessions
	const projectTotals = data.reduce((acc, d) => {
		const current = acc.get(d.project_path) || 0;
		acc.set(d.project_path, current + d.sessions);
		return acc;
	}, new Map<string, number>());

	const topProjects = Array.from(projectTotals.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxProjects)
		.map(([path]) => path);

	const filteredData = data.filter((d) => topProjects.includes(d.project_path));
	const allDates = Array.from(new Set(filteredData.map((d) => d.date))).sort();

	const chartData = allDates.map((date) => {
		const dateObj: Record<string, string | number> = {
			date,
			displayDate: new Date(date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
		};

		for (const projectPath of topProjects) {
			const dataPoint = filteredData.find(
				(d) => d.date === date && d.project_path === projectPath,
			);
			dateObj[projectPath] = dataPoint
				? (dataPoint[
						currentMetric.key as keyof ProjectTrendDataPoint
					] as number)
				: 0;
		}

		return dateObj;
	});

	const formatProjectName = (projectPath: string) => {
		const parts = projectPath.split("/");
		return parts[parts.length - 1] || projectPath.substring(0, 20);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
				{Object.entries(METRICS).map(([key, metric]) => {
					const isSelected = selectedMetric === key;
					const Icon = metric.icon;
					return (
						<button
							type="button"
							key={key}
							onClick={() => setSelectedMetric(key as MetricType)}
							className={`
								flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
								transition-all duration-200
								${
									isSelected
										? "bg-accent-light text-accent-text border-2 border-accent"
										: "bg-surface text-muted border-2 border-transparent hover:bg-hover"
								}
							`}
						>
							<Icon className="w-4 h-4" />
							<span>{metric.label}</span>
						</button>
					);
				})}
			</div>

			<ResponsiveContainer width="100%" height={400}>
				{selectedMetric === "success_rate" ? (
					<LineChart
						data={chartData}
						margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
						<XAxis
							dataKey="displayDate"
							stroke={axisStroke}
							style={{ fontSize: "12px" }}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis
							stroke={axisStroke}
							style={{ fontSize: "12px" }}
							tickFormatter={currentMetric.formatter}
							domain={[0, 100]}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: tooltipBg,
								border: `1px solid ${tooltipBorder}`,
								borderRadius: "8px",
								padding: "12px",
							}}
							formatter={(value, name) => {
								if (!name || name === "date" || name === "displayDate")
									return null;
								return [
									currentMetric.formatter((value as number) ?? 0),
									formatProjectName(String(name)),
								];
							}}
							labelFormatter={(label) => label}
						/>
						<Legend
							formatter={(value) => formatProjectName(value)}
							wrapperStyle={{ paddingTop: "20px" }}
						/>
						{topProjects.map((projectPath, index) => (
							<Line
								key={projectPath}
								type="monotone"
								dataKey={projectPath}
								stroke={PROJECT_COLORS[index % PROJECT_COLORS.length]}
								strokeWidth={2}
								dot={{ r: 3 }}
								activeDot={{ r: 5 }}
								connectNulls
							/>
						))}
					</LineChart>
				) : (
					<AreaChart
						data={chartData}
						margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
						<XAxis
							dataKey="displayDate"
							stroke={axisStroke}
							style={{ fontSize: "12px" }}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis
							stroke={axisStroke}
							style={{ fontSize: "12px" }}
							tickFormatter={currentMetric.formatter}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: tooltipBg,
								border: `1px solid ${tooltipBorder}`,
								borderRadius: "8px",
								padding: "12px",
							}}
							formatter={(value, name) => {
								if (!name || name === "date" || name === "displayDate")
									return null;
								return [
									currentMetric.formatter((value as number) ?? 0),
									formatProjectName(String(name)),
								];
							}}
							labelFormatter={(label) => label}
						/>
						<Legend
							formatter={(value) => formatProjectName(value)}
							wrapperStyle={{ paddingTop: "20px" }}
						/>
						{topProjects.map((projectPath, index) => (
							<Area
								key={projectPath}
								type="monotone"
								dataKey={projectPath}
								stackId="1"
								stroke={PROJECT_COLORS[index % PROJECT_COLORS.length]}
								fill={PROJECT_COLORS[index % PROJECT_COLORS.length]}
								fillOpacity={0.6}
								strokeWidth={2}
							/>
						))}
					</AreaChart>
				)}
			</ResponsiveContainer>

			{projectTotals.size > maxProjects && (
				<p className="text-sm text-muted text-center">
					Showing top {maxProjects} of {projectTotals.size} projects
				</p>
			)}
		</div>
	);
}
