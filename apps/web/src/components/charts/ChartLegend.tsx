interface LegendEntry {
	value: string;
	color?: string;
}

interface ChartLegendProps {
	payload?: LegendEntry[];
	formatter?: (value: string) => string;
	hiddenSeries?: Set<string>;
	onToggle?: (key: string) => void;
}

export function ChartLegend({
	payload,
	formatter,
	hiddenSeries,
	onToggle,
}: ChartLegendProps) {
	if (!payload || payload.length === 0) return null;

	return (
		<div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pl-4 pr-1 py-1">
			{payload.map((entry) => {
				const isHidden = hiddenSeries?.has(entry.value) ?? false;
				return (
					<button
						key={entry.value}
						type="button"
						className="flex items-start gap-2 min-w-0 cursor-pointer select-none text-left bg-transparent border-none p-0"
						onClick={() => onToggle?.(entry.value)}
					>
						<div
							className={`w-3 h-3 rounded-sm flex-shrink-0 mt-0.5 transition-opacity ${isHidden ? "opacity-30" : ""}`}
							style={{ backgroundColor: entry.color }}
						/>
						<span
							className={`text-xs leading-tight break-words min-w-0 transition-all ${
								isHidden
									? "line-through opacity-30 text-muted-foreground"
									: "text-muted-foreground"
							}`}
						>
							{formatter ? formatter(entry.value) : entry.value}
						</span>
					</button>
				);
			})}
		</div>
	);
}
