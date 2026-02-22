import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DatePickerProps {
	startDate: string;
	endDate: string;
	onStartDateChange: (date: string) => void;
	onEndDateChange: (date: string) => void;
}

interface DatePreset {
	label: string;
	getValue: () => { start: string; end: string };
}

const formatLocalDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const DATE_PRESETS: DatePreset[] = [
	{
		label: "Last 7 days",
		getValue: () => {
			const end = new Date();
			const start = new Date();
			start.setDate(start.getDate() - 7);
			return { start: formatLocalDate(start), end: formatLocalDate(end) };
		},
	},
	{
		label: "This week",
		getValue: () => {
			const now = new Date();
			const dayOfWeek = now.getDay();
			const start = new Date(now);
			start.setDate(now.getDate() - dayOfWeek);
			return {
				start: formatLocalDate(start),
				end: formatLocalDate(now),
			};
		},
	},
	{
		label: "Last week",
		getValue: () => {
			const now = new Date();
			const dayOfWeek = now.getDay();
			const start = new Date(now);
			start.setDate(now.getDate() - dayOfWeek - 7);
			const end = new Date(start);
			end.setDate(start.getDate() + 6);
			return {
				start: formatLocalDate(start),
				end: formatLocalDate(end),
			};
		},
	},
	{
		label: "Last 30 days",
		getValue: () => {
			const end = new Date();
			const start = new Date();
			start.setDate(start.getDate() - 30);
			return { start: formatLocalDate(start), end: formatLocalDate(end) };
		},
	},
	{
		label: "This month",
		getValue: () => {
			const now = new Date();
			const start = new Date(now.getFullYear(), now.getMonth(), 1);
			return {
				start: formatLocalDate(start),
				end: formatLocalDate(now),
			};
		},
	},
	{
		label: "Last month",
		getValue: () => {
			const now = new Date();
			const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const end = new Date(now.getFullYear(), now.getMonth(), 0);
			return {
				start: formatLocalDate(start),
				end: formatLocalDate(end),
			};
		},
	},
];

export function DatePicker({
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
}: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempStartDate, setTempStartDate] = useState(startDate);
	const [tempEndDate, setTempEndDate] = useState(endDate);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTempStartDate(startDate);
		setTempEndDate(endDate);
	}, [startDate, endDate]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setTempStartDate(startDate);
				setTempEndDate(endDate);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isOpen, startDate, endDate]);

	const handleApply = () => {
		onStartDateChange(tempStartDate);
		onEndDateChange(tempEndDate);
		setIsOpen(false);
	};

	const handlePresetClick = (preset: DatePreset) => {
		const { start, end } = preset.getValue();
		setTempStartDate(start);
		setTempEndDate(end);
		onStartDateChange(start);
		onEndDateChange(end);
		setIsOpen(false);
	};

	const formatDateRange = () => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const startStr = start.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		const endStr = end.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
		return `${startStr} - ${endStr}`;
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 bg-input border border-border rounded-lg px-4 py-2 hover:bg-hover transition-colors"
			>
				<Calendar className="h-4 w-4 text-muted" />
				<span className="text-sm font-medium text-foreground">
					{formatDateRange()}
				</span>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 bg-input border border-border rounded-lg z-50 flex overflow-hidden">
					<div className="w-40 border-r border-border bg-surface">
						{DATE_PRESETS.map((preset) => (
							<button
								key={preset.label}
								type="button"
								onClick={() => handlePresetClick(preset)}
								className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent-light hover:text-accent-text transition-colors"
							>
								{preset.label}
							</button>
						))}
					</div>

					<div className="p-4 w-64">
						<div className="space-y-3">
							<div>
								<label
									htmlFor="date-picker-start"
									className="block text-xs font-medium text-muted mb-1"
								>
									Start date
								</label>
								<input
									id="date-picker-start"
									type="date"
									value={tempStartDate}
									onChange={(e) => setTempStartDate(e.target.value)}
									max={tempEndDate}
									className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
								/>
							</div>

							<div>
								<label
									htmlFor="date-picker-end"
									className="block text-xs font-medium text-muted mb-1"
								>
									End date
								</label>
								<input
									id="date-picker-end"
									type="date"
									value={tempEndDate}
									onChange={(e) => setTempEndDate(e.target.value)}
									min={tempStartDate}
									max={new Date().toISOString().split("T")[0]}
									className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
								/>
							</div>

							<div className="pt-2">
								<button
									type="button"
									onClick={handleApply}
									className="w-full px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
								>
									Apply
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
