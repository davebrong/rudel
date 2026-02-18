import { useEffect, useState } from "react";
import { parseConversations } from "@/lib/conversation-schema";
import type { ConversationEntry } from "@/lib/conversation-schema";
import { cn } from "@/lib/utils";
import { ConversationMessage } from "./ConversationMessage";

interface ConversationViewProps {
	content: string; // JSONL formatted conversation data
	className?: string;
}

export function ConversationView({ content, className }: ConversationViewProps) {
	const [conversations, setConversations] = useState<ConversationEntry[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);
	const [totalLines, setTotalLines] = useState(0);

	useEffect(() => {
		if (!content || content.trim() === "") {
			setConversations([]);
			return;
		}

		try {
			const lines = content
				.split("\n")
				.filter((line) => line.trim() !== "");
			setTotalLines(lines.length);

			const parsed = parseConversations(content);

			if (parsed.length === 0 && lines.length > 0) {
				// Try to parse first line to see what's wrong
				try {
					JSON.parse(lines[0]!);
					setParseError(
						`Failed to parse ${lines.length} conversation entries. Check console for details.`,
					);
				} catch {
					setParseError("Content is not valid JSONL format");
				}
			}

			setConversations(parsed);
		} catch (error) {
			console.error(
				"[ConversationView] Error parsing conversations:",
				error,
			);
			setParseError(
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	}, [content]);

	if (parseError) {
		return (
			<div className={cn("py-8", className)}>
				<div className="text-center mb-4">
					<p className="text-red-600 dark:text-red-400 font-semibold mb-2">
						Error parsing conversation data
					</p>
					<p className="text-muted-foreground text-sm">
						{parseError}
					</p>
					<p className="text-muted-foreground text-xs mt-2">
						Total lines: {totalLines}
					</p>
				</div>
				<details className="text-xs border border-red-300 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950">
					<summary className="cursor-pointer text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 font-medium mb-2">
						Show raw data (first 2000 characters)
					</summary>
					<pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto text-xs">
						{content.slice(0, 2000)}
						{content.length > 2000 && "\n\n... (truncated)"}
					</pre>
				</details>
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className={cn("py-8", className)}>
				<div className="text-center mb-4">
					<p className="text-muted-foreground">
						No conversation data available
					</p>
					{totalLines > 0 && (
						<p className="text-muted-foreground text-xs mt-2">
							Found {totalLines} lines but couldn't parse any
							valid entries
						</p>
					)}
				</div>
				<details className="text-xs border border-border rounded-lg p-4 bg-muted/30">
					<summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-2">
						Show raw data (first 2000 characters)
					</summary>
					<pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto text-xs">
						{content.slice(0, 2000)}
						{content.length > 2000 && "\n\n... (truncated)"}
					</pre>
				</details>
			</div>
		);
	}

	// Count actual conversation messages (filter out generic/metadata entries)
	const conversationMessages = conversations.filter((entry) => {
		if ("role" in entry) return true;
		if ("type" in entry) {
			const type = (entry as Record<string, unknown>).type;
			return (
				type === "user" || type === "assistant" || type === "system"
			);
		}
		return false;
	});

	const metadataEntries = conversations.filter((entry) => {
		if ("type" in entry) {
			const type = (entry as Record<string, unknown>).type;
			return type === "file-history-snapshot" || type === "progress";
		}
		return false;
	});

	return (
		<div className={cn("space-y-6", className)}>
			<div className="text-xs text-muted-foreground mb-4 flex items-center justify-between">
				<span>
					Showing {conversationMessages.length} conversation messages
					{metadataEntries.length > 0 &&
						` (${metadataEntries.length} metadata entries hidden)`}
				</span>
				<span className="text-muted-foreground">
					{totalLines} total entries
				</span>
			</div>
			{conversations.map((entry, idx) => (
				<ConversationMessage
					key={idx}
					entry={entry}
					messageIndex={idx}
				/>
			))}
		</div>
	);
}
