import type { ConversationEntry, Content } from "@/lib/conversation-schema";
import { User, Bot, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "./MessageContent";
import {
	isSlashCommandMessage,
	parseSlashCommand,
} from "@/lib/parse-slash-command";

interface ConversationMessageProps {
	entry: ConversationEntry;
	messageIndex?: number;
	className?: string;
}

export function ConversationMessage({
	entry,
	messageIndex,
	className,
}: ConversationMessageProps) {
	// Generate anchor ID for deep linking
	const anchorId =
		messageIndex !== undefined ? `message-${messageIndex}` : undefined;

	// Skip metadata entries (file-history-snapshot, progress, etc.)
	if ("type" in entry) {
		const entryType = (entry as Record<string, unknown>).type;
		if (
			entryType === "file-history-snapshot" ||
			entryType === "progress"
		) {
			return null;
		}
	}

	// Handle summary entries
	if ("role" in entry && entry.role === "summary") {
		const summaryText =
			"summary" in entry ? String(entry.summary) : "";
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
		const systemContent =
			"content" in entry ? String(entry.content) : "";
		return (
			<div
				id={anchorId}
				className={cn(
					"border border-border bg-muted/30 p-4 rounded-lg scroll-mt-6",
					className,
				)}
			>
				<p className="text-xs font-semibold text-muted-foreground mb-2">
					System
				</p>
				<p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
					{systemContent}
				</p>
			</div>
		);
	}

	// Handle user messages (both role-based and type-based)
	const isUserMessage =
		("role" in entry && entry.role === "user") ||
		("type" in entry &&
			(entry as Record<string, unknown>).type === "user");

	if (isUserMessage) {
		// Type-based entries have content nested in message.content
		// Role-based entries have content directly
		const entryAny = entry as Record<string, unknown>;
		const content =
			(entryAny.message as Record<string, unknown> | undefined)
				?.content ||
			entryAny.content ||
			entryAny.text ||
			"";

		// Check for slash command
		const isSlashCommand =
			typeof content === "string" && isSlashCommandMessage(content);
		const slashCommandInfo = isSlashCommand
			? parseSlashCommand(content)
			: null;

		return (
			<div
				id={anchorId}
				className={cn("flex gap-4 scroll-mt-6", className)}
			>
				<div className="flex-shrink-0">
					<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
						<User className="w-5 h-5 text-white" />
					</div>
				</div>
				<div className="flex-1 min-w-0 bg-card border border-border rounded-lg p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-3">
						<span className="text-sm font-semibold text-foreground">
							User
						</span>
						{!!(entry as Record<string, unknown>).timestamp && (
							<span className="text-xs text-muted-foreground">
								{new Date(
									String(
										(entry as Record<string, unknown>)
											.timestamp,
									),
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
									<span className="font-semibold">
										Command:
									</span>{" "}
									<code className="bg-muted px-2 py-0.5 rounded">
										{slashCommandInfo.commandName}
									</code>
								</div>
							)}
							{slashCommandInfo.commandArgs && (
								<div className="text-sm text-muted-foreground">
									<span className="font-semibold">
										Args:
									</span>{" "}
									<code className="bg-muted px-2 py-0.5 rounded">
										{slashCommandInfo.commandArgs}
									</code>
								</div>
							)}
						</div>
					) : (
						<MessageContent
							content={content as string | Content[]}
						/>
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
		// Type-based entries have content nested in message.content
		// Role-based entries have content directly
		const entryAny = entry as Record<string, unknown>;
		const assistantContent =
			(entryAny.message as Record<string, unknown> | undefined)
				?.content ||
			entryAny.content ||
			entryAny.text ||
			"";

		return (
			<div
				id={anchorId}
				className={cn("flex gap-4 scroll-mt-6", className)}
			>
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
									String(
										(entry as Record<string, unknown>)
											.timestamp,
									),
								).toLocaleTimeString()}
							</span>
						)}
					</div>
					<MessageContent
						content={assistantContent as string | Content[]}
					/>
				</div>
			</div>
		);
	}

	// Handle system messages (type-based)
	const isSystemMessage =
		("role" in entry && entry.role === "system") ||
		("type" in entry &&
			(entry as Record<string, unknown>).type === "system");

	if (isSystemMessage) {
		const entryAny = entry as Record<string, unknown>;
		const systemContent =
			(entryAny.content as string) || (entryAny.text as string) || "";
		return (
			<div
				id={anchorId}
				className={cn(
					"border border-border bg-muted/30 p-4 rounded-lg scroll-mt-6",
					className,
				)}
			>
				<p className="text-xs font-semibold text-muted-foreground mb-2">
					System
				</p>
				<p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
					{systemContent}
				</p>
			</div>
		);
	}

	return null;
}
