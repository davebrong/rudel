import {
	Bot,
	ChevronRight,
	FileText,
	Settings,
	User,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import type { Content, ConversationEntry } from "@/lib/conversation-schema";
import {
	isSlashCommandMessage,
	parseSlashCommand,
} from "@/lib/parse-slash-command";
import { cn } from "@/lib/utils";
import { MessageContent } from "./MessageContent";

interface ConversationMessageProps {
	entry: ConversationEntry;
	messageIndex?: number;
	className?: string;
}

const variantStyles = {
	default: {
		row: "text-muted",
		icon: "w-3.5 h-3.5 shrink-0",
		border: "border-border",
	},
	error: {
		row: "text-red-400",
		icon: "w-3.5 h-3.5 shrink-0 text-red-400",
		border: "border-red-300",
	},
	success: {
		row: "text-green-500",
		icon: "w-3.5 h-3.5 shrink-0 text-green-500",
		border: "border-green-300",
	},
} as const;

/** Collapsed row for tool results, system, and meta entries */
function CollapsedEntry({
	icon: Icon,
	label,
	summary,
	children,
	anchorId,
	className,
	variant = "default",
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	summary: string;
	children: React.ReactNode;
	anchorId?: string;
	className?: string;
	variant?: "default" | "error" | "success";
}) {
	const [open, setOpen] = useState(false);
	const styles = variantStyles[variant];

	return (
		<div id={anchorId} className={cn("scroll-mt-6", className)}>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={cn(
					"flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md hover:bg-hover transition-colors text-xs",
					styles.row,
				)}
			>
				<Icon className={styles.icon} />
				<span className="font-medium">{label}</span>
				<span className="truncate opacity-60">{summary}</span>
				<ChevronRight
					className={cn(
						"w-3 h-3 ml-auto shrink-0 transition-transform",
						open && "rotate-90",
					)}
				/>
			</button>
			{open && (
				<div className={cn("mt-1 ml-5 pl-3 border-l-2", styles.border)}>
					{children}
				</div>
			)}
		</div>
	);
}

/** Extract a short summary from content for the collapsed label */
function contentSummary(content: unknown): string {
	if (typeof content === "string") {
		return content.slice(0, 100);
	}
	if (Array.isArray(content)) {
		const first = content[0] as Record<string, unknown> | undefined;
		if (first?.type === "tool_result") {
			const text =
				typeof first.content === "string"
					? first.content
					: JSON.stringify(first.content);
			return `tool_result: ${text.slice(0, 80)}`;
		}
		if (first?.type === "text" && first?.text) {
			return String(first.text).slice(0, 100);
		}
	}
	return "";
}

export function ConversationMessage({
	entry,
	messageIndex,
	className,
}: ConversationMessageProps) {
	const anchorId =
		messageIndex !== undefined ? `message-${messageIndex}` : undefined;

	// Skip metadata entries (file-history-snapshot, progress, etc.)
	if ("type" in entry) {
		const entryType = (entry as Record<string, unknown>).type;
		if (
			entryType === "file-history-snapshot" ||
			entryType === "progress" ||
			entryType === "queue-operation"
		) {
			return null;
		}
	}

	// Handle summary entries
	if ("role" in entry && entry.role === "summary") {
		const summaryText = "summary" in entry ? String(entry.summary) : "";
		return (
			<div
				id={anchorId}
				className={cn(
					"border-l-4 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-4 rounded-r scroll-mt-6",
					className,
				)}
			>
				<div className="flex items-start gap-3">
					<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
							Session Summary
						</p>
						<p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">
							{summaryText}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Handle system entries (role-based)
	if ("role" in entry && entry.role === "system") {
		const systemContent = "content" in entry ? String(entry.content) : "";
		return (
			<CollapsedEntry
				icon={Settings}
				label="System"
				summary={systemContent.slice(0, 100)}
				anchorId={anchorId}
				className={className}
			>
				<p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono py-2">
					{systemContent}
				</p>
			</CollapsedEntry>
		);
	}

	// Handle user messages (both role-based and type-based)
	const isUserMessage =
		("role" in entry && entry.role === "user") ||
		("type" in entry && (entry as Record<string, unknown>).type === "user");

	if (isUserMessage) {
		const entryAny = entry as Record<string, unknown>;

		// Type-based entries have content nested in message.content
		const content =
			(entryAny.message as Record<string, unknown> | undefined)?.content ||
			entryAny.content ||
			entryAny.text ||
			"";

		// Tool result entries — collapsed with wrench icon
		if (entryAny.toolUseResult != null) {
			const toolResult = entryAny.toolUseResult as Record<string, unknown>;
			const toolType = (toolResult.type as string) || "tool";

			// Check for errors: exit code, stderr, interrupted, or is_error on content items
			const hasNonZeroExit =
				typeof toolResult.code === "number" && toolResult.code !== 0;
			const hasStderr =
				typeof toolResult.stderr === "string" && toolResult.stderr.length > 0;
			const wasInterrupted = toolResult.interrupted === true;
			const contentHasError =
				Array.isArray(content) &&
				content.some((item: Record<string, unknown>) => item?.is_error);
			const isError =
				hasNonZeroExit || hasStderr || wasInterrupted || contentHasError;

			return (
				<CollapsedEntry
					icon={Wrench}
					label={`Tool Result (${toolType})`}
					summary={contentSummary(content)}
					variant={isError ? "error" : "success"}
					anchorId={anchorId}
					className={className}
				>
					<div className="py-2">
						<MessageContent content={content as string | Content[]} />
					</div>
				</CollapsedEntry>
			);
		}

		// Meta entries — collapsed with settings icon
		if (entryAny.isMeta || entryAny.isCompactSummary) {
			return (
				<CollapsedEntry
					icon={Settings}
					label={entryAny.isCompactSummary ? "Compact Summary" : "Meta"}
					summary={contentSummary(content)}
					anchorId={anchorId}
					className={className}
				>
					<div className="py-2">
						<MessageContent content={content as string | Content[]} />
					</div>
				</CollapsedEntry>
			);
		}

		// Content that's all tool_result items — collapsed with wrench icon
		if (Array.isArray(content)) {
			const allToolResults = content.every(
				(item: Record<string, unknown>) => item?.type === "tool_result",
			);
			if (allToolResults) {
				const hasError = content.some(
					(item: Record<string, unknown>) => item?.is_error,
				);
				return (
					<CollapsedEntry
						icon={Wrench}
						label={`Tool Results (${content.length})`}
						summary={contentSummary(content)}
						variant={hasError ? "error" : "success"}
						anchorId={anchorId}
						className={className}
					>
						<div className="py-2">
							<MessageContent content={content as Content[]} />
						</div>
					</CollapsedEntry>
				);
			}
		}

		// Check for slash command
		const isSlashCommand =
			typeof content === "string" && isSlashCommandMessage(content);
		const slashCommandInfo = isSlashCommand ? parseSlashCommand(content) : null;

		return (
			<div id={anchorId} className={cn("flex gap-4 scroll-mt-6", className)}>
				<div className="flex-shrink-0">
					<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
						<User className="w-5 h-5 text-white" />
					</div>
				</div>
				<div className="flex-1 min-w-0 bg-card border border-border rounded-lg p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-3">
						<span className="text-sm font-semibold text-foreground">User</span>
						{!!(entry as Record<string, unknown>).timestamp && (
							<span className="text-xs text-muted-foreground">
								{new Date(
									String((entry as Record<string, unknown>).timestamp),
								).toLocaleTimeString()}
							</span>
						)}
					</div>

					{isSlashCommand && slashCommandInfo ? (
						<div className="space-y-2">
							{slashCommandInfo.commandMessage && (
								<div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm font-mono">
									{slashCommandInfo.commandMessage}
								</div>
							)}
							{slashCommandInfo.commandName && (
								<div className="text-sm text-muted-foreground">
									<span className="font-semibold">Command:</span>{" "}
									<code className="bg-muted px-2 py-0.5 rounded">
										{slashCommandInfo.commandName}
									</code>
								</div>
							)}
							{slashCommandInfo.commandArgs && (
								<div className="text-sm text-muted-foreground">
									<span className="font-semibold">Args:</span>{" "}
									<code className="bg-muted px-2 py-0.5 rounded">
										{slashCommandInfo.commandArgs}
									</code>
								</div>
							)}
						</div>
					) : (
						<MessageContent content={content as string | Content[]} />
					)}
				</div>
			</div>
		);
	}

	// Handle assistant messages (both role-based and type-based)
	const isAssistantMessage =
		("role" in entry && entry.role === "assistant") ||
		("type" in entry &&
			(entry as Record<string, unknown>).type === "assistant");

	if (isAssistantMessage) {
		const entryAny = entry as Record<string, unknown>;
		const assistantContent =
			(entryAny.message as Record<string, unknown> | undefined)?.content ||
			entryAny.content ||
			entryAny.text ||
			"";

		return (
			<div id={anchorId} className={cn("flex gap-4 scroll-mt-6", className)}>
				<div className="flex-shrink-0">
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
						<Bot className="w-5 h-5 text-white" />
					</div>
				</div>
				<div className="flex-1 min-w-0 bg-card border border-border rounded-lg p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-3">
						<span className="text-sm font-semibold text-foreground">
							Assistant
						</span>
						{!!(entry as Record<string, unknown>).timestamp && (
							<span className="text-xs text-muted-foreground">
								{new Date(
									String((entry as Record<string, unknown>).timestamp),
								).toLocaleTimeString()}
							</span>
						)}
					</div>
					<MessageContent content={assistantContent as string | Content[]} />
				</div>
			</div>
		);
	}

	// Handle system messages (type-based)
	const isSystemMessage =
		("role" in entry && entry.role === "system") ||
		("type" in entry && (entry as Record<string, unknown>).type === "system");

	if (isSystemMessage) {
		const entryAny = entry as Record<string, unknown>;
		const systemContent =
			(entryAny.content as string) || (entryAny.text as string) || "";
		const subtype = (entryAny.subtype as string) || "system";
		return (
			<CollapsedEntry
				icon={Settings}
				label={`System (${subtype})`}
				summary={systemContent.slice(0, 100)}
				anchorId={anchorId}
				className={className}
			>
				<p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono py-2">
					{systemContent}
				</p>
			</CollapsedEntry>
		);
	}

	return null;
}
