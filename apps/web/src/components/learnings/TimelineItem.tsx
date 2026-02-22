import type { LearningEntry } from "@rudel/api-routes";
import { format } from "date-fns";
import {
	ChevronDown,
	ChevronUp,
	Clock,
	ExternalLink,
	FolderKanban,
	User,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatUsername } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
	learning: LearningEntry;
	userMap?: Record<string, string>;
}

export function TimelineItem({ learning, userMap }: TimelineItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Format date
	const formattedDate = format(new Date(learning.created_at), "MMM dd, yyyy");
	const formattedTime = format(new Date(learning.created_at), "h:mm a");

	// Truncate text for preview
	const contentPreview =
		learning.content.length > 300
			? `${learning.content.slice(0, 300)}...`
			: learning.content;

	// Extract project name from path
	const projectName =
		learning.project_path.split("/").pop() || learning.project_path;

	// Link to session
	const sessionLink = `/dashboard/sessions/${learning.session_id}`;

	// Get type badge color (decorative per-type, keep hardcoded)
	const getTypeBadgeColor = (type: string) => {
		switch (type) {
			case "pattern":
				return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
			case "antipattern":
				return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
			case "convention":
				return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
			case "fix":
				return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
			case "preference":
				return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="relative pl-8 pb-8 border-l-2 border-border last:pb-0">
			{/* Timeline dot */}
			<div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-background shadow" />

			{/* Timestamp badge */}
			<div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
				<Clock className="w-3 h-3" />
				<span>
					{formattedDate} at {formattedTime}
				</span>
			</div>

			{/* Learning card */}
			<div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
				{/* Header */}
				<div className="p-4 border-b border-border">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-2">
							{/* Type and Scope badges */}
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={cn(
										"px-2 py-1 text-xs font-medium rounded",
										getTypeBadgeColor(learning.type),
									)}
								>
									{learning.type}
								</span>
								<span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded font-mono">
									{learning.scope}
								</span>
							</div>

							{/* Metadata */}
							<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<User className="w-3 h-3" />
									<span className="font-medium">
										{formatUsername(learning.user_id, userMap)}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<FolderKanban className="w-3 h-3" />
									<span className="font-mono">{projectName}</span>
								</div>
								{learning.repository && (
									<span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
										{learning.repository}
									</span>
								)}
							</div>

							{/* Tags */}
							{learning.tags && learning.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{learning.tags.map((tag, idx) => (
										<span
											// biome-ignore lint/suspicious/noArrayIndexKey: tags may duplicate
											key={`${tag}-${idx}`}
											className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded"
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</div>

						{/* Link to session */}
						<Link
							to={sessionLink}
							className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors"
						>
							<span>View Session</span>
							<ExternalLink className="w-3 h-3" />
						</Link>
					</div>
				</div>

				{/* Learning content */}
				<div className="p-4">
					<div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
						{isExpanded ? learning.content : contentPreview}
					</div>

					{/* Expand/collapse button */}
					{learning.content.length > 300 && (
						<button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-3"
						>
							{isExpanded ? (
								<>
									<ChevronUp className="w-4 h-4" />
									Show less
								</>
							) : (
								<>
									<ChevronDown className="w-4 h-4" />
									Show more
								</>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
