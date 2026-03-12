import { Clipboard, Download, Share2, Twitter } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { toast } from "sonner";
import {
	captureElement,
	copyToClipboard,
	downloadAsImage,
	shareToX,
} from "../../lib/screenshot";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AnalyticsCard } from "./AnalyticsCard";

interface ChartCardProps {
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
	shareable?: boolean;
}

export function ChartCard({
	title,
	description,
	children,
	className,
	shareable = true,
}: ChartCardProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	const handleCapture = async () => {
		if (!chartRef.current) return null;
		return captureElement(chartRef.current);
	};

	const handleShareToX = async () => {
		const blob = await handleCapture();
		if (!blob) return;
		const copied = await copyToClipboard(blob);
		if (copied) {
			toast.success("Chart copied to clipboard — paste it into your post!");
		}
		shareToX(`Check out my ${title} analytics from @rudel_ai`);
	};

	const handleCopyAsImage = async () => {
		const blob = await handleCapture();
		if (!blob) return;
		const copied = await copyToClipboard(blob);
		if (copied) {
			toast.success("Chart copied to clipboard");
		} else {
			toast.error("Failed to copy — try downloading instead");
		}
	};

	const handleDownload = async () => {
		const blob = await handleCapture();
		if (!blob) return;
		const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
		const slug = title.toLowerCase().replace(/\s+/g, "-");
		downloadAsImage(blob, `rudel-${slug}-${timestamp}.png`);
		toast.success("Chart downloaded");
	};

	return (
		<AnalyticsCard className={className}>
			<div className="flex items-start justify-between mb-4">
				<div>
					<h2 className="text-xl font-bold text-heading">{title}</h2>
					{description && (
						<p className="text-sm text-muted mt-1">{description}</p>
					)}
				</div>
				{shareable && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="p-2 rounded-md hover:bg-hover text-muted hover:text-foreground transition-colors"
								aria-label="Share chart"
							>
								<Share2 className="h-4 w-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleShareToX}>
								<Twitter className="h-4 w-4" />
								Share on X
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCopyAsImage}>
								<Clipboard className="h-4 w-4" />
								Copy as image
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleDownload}>
								<Download className="h-4 w-4" />
								Download as PNG
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
			<div ref={chartRef} className="relative">
				{children}
				{/* Watermark */}
				<div
					className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
					aria-hidden="true"
				>
					<span className="text-foreground text-2xl font-bold opacity-15">
						rudel.ai
					</span>
				</div>
				<div
					className="pointer-events-none select-none absolute bottom-2 right-3"
					aria-hidden="true"
				>
					<span className="text-foreground text-[0.65rem] opacity-20">
						powered by ObsessionDB
					</span>
				</div>
			</div>
		</AnalyticsCard>
	);
}
