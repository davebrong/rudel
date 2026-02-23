import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationEntry } from "@/lib/conversation-schema";
import { parseConversations } from "@/lib/conversation-schema";
import { isSlashCommandMessage } from "@/lib/parse-slash-command";
import { cn } from "@/lib/utils";
import { ConversationMessage } from "./ConversationMessage";
import type { TokenDataPoint } from "./TokenUsageChart";
import type { ToolActivityPoint } from "./ToolActivityChart";

interface ConversationViewProps {
	content: string;
	className?: string;
	scrollContainerRef?: React.RefObject<HTMLElement | null>;
	onActiveMessageChange?: (messageIndex: number) => void;
	onTokenDataReady?: (data: TokenDataPoint[], totalMessages: number) => void;
	onToolActivityReady?: (data: ToolActivityPoint[]) => void;
	scrollToMessageIndex?: number | null;
}

/** Extract token usage data from parsed conversations */
function extractTokenData(entries: ConversationEntry[]): TokenDataPoint[] {
	const points: TokenDataPoint[] = [];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i] as ConversationEntry;
		const entryAny = entry as Record<string, unknown>;

		if (
			("role" in entry && entry.role === "assistant") ||
			("type" in entry && entryAny.type === "assistant")
		) {
			const message = entryAny.message as Record<string, unknown> | undefined;
			const usage = message?.usage as Record<string, unknown> | undefined;

			if (usage) {
				points.push({
					messageIndex: i,
					inputTokens: (usage.input_tokens as number) || 0,
					outputTokens: (usage.output_tokens as number) || 0,
				});
			}
		}
	}

	return points;
}

/** Extract tool, skill, and subagent activity from parsed conversations */
function extractToolActivity(
	entries: ConversationEntry[],
): ToolActivityPoint[] {
	const points: ToolActivityPoint[] = [];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i] as ConversationEntry;
		const entryAny = entry as Record<string, unknown>;

		const isUser =
			("role" in entry && entry.role === "user") ||
			("type" in entry && entryAny.type === "user");

		const isAssistant =
			("role" in entry && entry.role === "assistant") ||
			("type" in entry && entryAny.type === "assistant");

		// User messages with toolUseResult → tool invocation result
		if (isUser && entryAny.toolUseResult != null) {
			const toolResult = entryAny.toolUseResult as Record<string, unknown>;
			const toolType = (toolResult.type as string) || "tool";

			const hasNonZeroExit =
				typeof toolResult.code === "number" && toolResult.code !== 0;
			const hasStderr =
				typeof toolResult.stderr === "string" && toolResult.stderr.length > 0;
			const wasInterrupted = toolResult.interrupted === true;

			const content =
				(entryAny.message as Record<string, unknown> | undefined)?.content ||
				entryAny.content;
			const contentHasError =
				Array.isArray(content) &&
				content.some((item: Record<string, unknown>) => item?.is_error);

			const isError =
				hasNonZeroExit || hasStderr || wasInterrupted || contentHasError;

			// Check if this is a subagent (Task tool)
			if (toolType === "Task") {
				points.push({
					messageIndex: i,
					category: "subagent",
					name: toolType,
					isError,
				});
			} else {
				points.push({
					messageIndex: i,
					category: "tool",
					name: toolType,
					isError,
				});
			}
		}

		// User messages with slash command content → skill
		if (isUser) {
			const content =
				(entryAny.message as Record<string, unknown> | undefined)?.content ||
				entryAny.content ||
				entryAny.text ||
				"";
			if (typeof content === "string" && isSlashCommandMessage(content)) {
				points.push({
					messageIndex: i,
					category: "skill",
					name: "slash-command",
					isError: false,
				});
			}
		}

		// Assistant messages — scan content for tool_use items to capture Task/subagent launches
		if (isAssistant) {
			const message = entryAny.message as Record<string, unknown> | undefined;
			const content = (message?.content || entryAny.content) as
				| unknown[]
				| undefined;

			if (Array.isArray(content)) {
				for (const block of content) {
					const b = block as Record<string, unknown>;
					if (b?.type === "tool_use" && b?.name === "Task") {
						const input = b.input as Record<string, unknown> | undefined;
						points.push({
							messageIndex: i,
							category: "subagent",
							name: (input?.subagent_type as string) || "Task",
							isError: false,
						});
					}
				}
			}
		}
	}

	return points;
}

export function ConversationView({
	content,
	className,
	scrollContainerRef,
	onActiveMessageChange,
	onTokenDataReady,
	onToolActivityReady,
	scrollToMessageIndex,
}: ConversationViewProps) {
	const [conversations, setConversations] = useState<ConversationEntry[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);
	const messageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Parse content
	useEffect(() => {
		if (!content || content.trim() === "") {
			setConversations([]);
			return;
		}

		try {
			const lines = content.split("\n").filter((line) => line.trim() !== "");

			const parsed = parseConversations(content);

			if (parsed.length === 0 && lines.length > 0) {
				try {
					JSON.parse(lines[0] as string);
					setParseError(
						`Failed to parse ${lines.length} conversation entries. Check console for details.`,
					);
				} catch {
					setParseError("Content is not valid JSONL format");
				}
			}

			setConversations(parsed);

			if (parsed.length > 0) {
				if (onTokenDataReady) {
					const tokenData = extractTokenData(parsed);
					onTokenDataReady(tokenData, parsed.length);
				}
				if (onToolActivityReady) {
					const activityData = extractToolActivity(parsed);
					onToolActivityReady(activityData);
				}
			}
		} catch (error) {
			console.error("[ConversationView] Error parsing conversations:", error);
			setParseError(error instanceof Error ? error.message : "Unknown error");
		}
	}, [content, onTokenDataReady, onToolActivityReady]);

	// Set up IntersectionObserver for scroll tracking
	useEffect(() => {
		if (!onActiveMessageChange) return;

		const root = scrollContainerRef?.current || null;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				let topmostIndex = -1;
				let topmostTop = Infinity;

				for (const ioEntry of entries) {
					if (ioEntry.isIntersecting) {
						const idx = Number(
							ioEntry.target.getAttribute("data-message-index"),
						);
						if (
							!Number.isNaN(idx) &&
							ioEntry.boundingClientRect.top < topmostTop
						) {
							topmostTop = ioEntry.boundingClientRect.top;
							topmostIndex = idx;
						}
					}
				}

				if (topmostIndex >= 0) {
					onActiveMessageChange(topmostIndex);
				}
			},
			{
				root,
				rootMargin: "0px 0px -80% 0px",
				threshold: 0,
			},
		);

		for (const [, el] of messageRefsMap.current) {
			observerRef.current.observe(el);
		}

		return () => {
			observerRef.current?.disconnect();
		};
	}, [onActiveMessageChange, scrollContainerRef]);

	// Scroll to message when scrollToMessageIndex changes
	useEffect(() => {
		if (scrollToMessageIndex == null) return;

		const el = messageRefsMap.current.get(scrollToMessageIndex);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [scrollToMessageIndex]);

	const registerMessageRef = useCallback(
		(index: number, el: HTMLDivElement | null) => {
			if (el) {
				messageRefsMap.current.set(index, el);
				observerRef.current?.observe(el);
			} else {
				const existing = messageRefsMap.current.get(index);
				if (existing) {
					observerRef.current?.unobserve(existing);
				}
				messageRefsMap.current.delete(index);
			}
		},
		[],
	);

	if (parseError) {
		return (
			<div className={cn("py-8 text-center", className)}>
				<p className="text-red-600 dark:text-red-400 font-semibold mb-2">
					Error parsing conversation data
				</p>
				<p className="text-muted-foreground text-sm">{parseError}</p>
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className={cn("py-8 text-center", className)}>
				<p className="text-muted-foreground">No conversation data available</p>
			</div>
		);
	}

	const conversationMessages = conversations.filter((entry) => {
		if ("role" in entry) return true;
		if ("type" in entry) {
			const type = (entry as Record<string, unknown>).type;
			return type === "user" || type === "assistant" || type === "system";
		}
		return false;
	});

	const metadataEntries = conversations.filter((entry) => {
		if ("type" in entry) {
			const type = (entry as Record<string, unknown>).type;
			return (
				type === "file-history-snapshot" ||
				type === "progress" ||
				type === "queue-operation"
			);
		}
		return false;
	});

	return (
		<div className={cn("space-y-6", className)}>
			<div className="text-xs text-muted-foreground mb-4">
				Showing {conversationMessages.length} messages
				{metadataEntries.length > 0 &&
					` (${metadataEntries.length} metadata entries hidden)`}
			</div>
			{conversations.map((entry, idx) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: stable conversation order
					key={idx}
					ref={(el) => registerMessageRef(idx, el)}
					data-message-index={idx}
				>
					<ConversationMessage entry={entry} messageIndex={idx} />
				</div>
			))}
		</div>
	);
}
