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
			{payload.map((entry, index) => {
				const isHidden = hiddenSeries?.has(entry.value) ?? false;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: legend items are positionally stable
					<div
						key={index}
						className="flex items-start gap-2 min-w-0 cursor-pointer select-none"
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
					</div>
				);
			})}
		</div>
	);
}
