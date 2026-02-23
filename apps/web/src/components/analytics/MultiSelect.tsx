import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface MultiSelectProps {
	options: string[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	className?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Select items...",
	className = "",
}: MultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleOption = (option: string) => {
		if (selected.includes(option)) {
			onChange(selected.filter((item) => item !== option));
		} else {
			onChange([...selected, option]);
		}
	};

	const clearAll = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange([]);
	};

	const displayText =
		selected.length === 0
			? placeholder
			: selected.length === 1
				? selected[0]
				: `${selected.length} selected`;

	return (
		<div ref={dropdownRef} className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between gap-2"
			>
				<span className={cn("truncate", selected.length === 0 && "text-muted")}>
					{selected.length > 0 && (
						<Check className="w-3 h-3 inline mr-1 text-status-success-icon" />
					)}
					{displayText}
				</span>
				<div className="flex items-center gap-1">
					{selected.length > 0 && (
						<button
							type="button"
							onClick={clearAll}
							className="p-0.5 hover:bg-hover rounded"
							title="Clear all"
						>
							<X className="w-3 h-3 text-muted" />
						</button>
					)}
					<ChevronDown
						className={cn(
							"w-4 h-4 text-muted transition-transform",
							isOpen && "rotate-180",
						)}
					/>
				</div>
			</button>

			{isOpen && (
				<div className="absolute z-50 w-full mt-1 bg-input border border-border rounded-lg max-h-60 overflow-y-auto">
					{options.length === 0 ? (
						<div className="px-3 py-2 text-sm text-muted text-center">
							No options available
						</div>
					) : (
						options.map((option) => {
							const isSelected = selected.includes(option);
							return (
								<button
									key={option}
									type="button"
									onClick={() => toggleOption(option)}
									className={cn(
										"w-full px-3 py-2 text-sm text-left hover:bg-hover flex items-center gap-2",
										isSelected && "bg-accent-light",
									)}
								>
									<div
										className={cn(
											"w-4 h-4 border rounded flex items-center justify-center",
											isSelected ? "bg-accent border-accent" : "border-border",
										)}
									>
										{isSelected && (
											<Check className="w-3 h-3 text-accent-foreground" />
										)}
									</div>
									<span
										className={cn(
											isSelected
												? "font-medium text-accent-text"
												: "text-foreground",
										)}
									>
										{option}
									</span>
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
