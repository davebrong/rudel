import type {
	Content,
	TextContent,
	ThinkingContent,
	ToolResultContent,
	ToolUseContent,
} from "@/lib/conversation-schema";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import { ToolInvocation } from "./ToolInvocation";

interface MessageContentProps {
	content: string | Content[];
	className?: string;
}

// Parse code blocks from text content
function parseTextContent(
	text: string,
): Array<{ type: "text" | "code"; content: string; language?: string }> {
	const parts: Array<{
		type: "text" | "code";
		content: string;
		language?: string;
	}> = [];

	// Match code blocks with language specifier: ```language\ncode\n```
	const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null = codeBlockRegex.exec(text);

	while (match !== null) {
		// Add text before code block
		if (match.index > lastIndex) {
			const textContent = text.slice(lastIndex, match.index).trim();
			if (textContent) {
				parts.push({ type: "text", content: textContent });
			}
		}

		// Add code block
		const language = match[1] || "text";
		const code = match[2] as string;
		parts.push({ type: "code", content: code, language });

		lastIndex = match.index + match[0].length;
		match = codeBlockRegex.exec(text);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		const textContent = text.slice(lastIndex).trim();
		if (textContent) {
			parts.push({ type: "text", content: textContent });
		}
	}

	// If no code blocks found, return the whole text
	if (parts.length === 0 && text.trim()) {
		parts.push({ type: "text", content: text.trim() });
	}

	return parts;
}

export function MessageContent({ content, className }: MessageContentProps) {
	// Handle undefined or null content
	if (!content) {
		return (
			<div className={cn("text-muted-foreground text-sm italic", className)}>
				(No content)
			</div>
		);
	}

	// Handle string content
	if (typeof content === "string") {
		const parts = parseTextContent(content);

		return (
			<div className={cn("space-y-3", className)}>
				{parts.map((part, idx) =>
					part.type === "code" ? (
						<CodeBlock
							// biome-ignore lint/suspicious/noArrayIndexKey: static parsed content blocks
							key={idx}
							code={part.content}
							language={part.language}
						/>
					) : (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static parsed content blocks
							key={idx}
							className="prose prose-sm max-w-none"
						>
							<p className="whitespace-pre-wrap text-foreground leading-relaxed">
								{part.content}
							</p>
						</div>
					),
				)}
			</div>
		);
	}

	// Handle non-array content (shouldn't happen, but be safe)
	if (!Array.isArray(content)) {
		return (
			<div className={cn("text-muted-foreground text-sm italic", className)}>
				(Invalid content format: {typeof content})
			</div>
		);
	}

	// Handle array of content blocks
	const toolUses = new Map<string, ToolUseContent>();
	const toolResults = new Map<string, ToolResultContent>();

	// First pass: collect tool uses and results
	for (const block of content) {
		if (block.type === "tool_use") {
			toolUses.set(block.id, block);
		} else if (block.type === "tool_result") {
			toolResults.set(block.tool_use_id, block);
		}
	}

	return (
		<div className={cn("space-y-3", className)}>
			{content.map((block, idx) => {
				switch (block.type) {
					case "text": {
						const textBlock = block as TextContent;
						const parts = parseTextContent(textBlock.text);

						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: content blocks have no stable id
								key={idx}
								className="space-y-3"
							>
								{parts.map((part, partIdx) =>
									part.type === "code" ? (
										<CodeBlock
											// biome-ignore lint/suspicious/noArrayIndexKey: static parsed content blocks
											key={partIdx}
											code={part.content}
											language={part.language}
										/>
									) : (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: static parsed content blocks
											key={partIdx}
											className="prose prose-sm max-w-none"
										>
											<p className="whitespace-pre-wrap text-foreground leading-relaxed">
												{part.content}
											</p>
										</div>
									),
								)}
							</div>
						);
					}

					case "thinking": {
						const thinkingBlock = block as ThinkingContent;
						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: content blocks have no stable id
								key={idx}
								className="border-l-4 border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 rounded-r"
							>
								<p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
									Internal Thinking
								</p>
								<p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap leading-relaxed italic">
									{thinkingBlock.thinking}
								</p>
							</div>
						);
					}

					case "tool_use": {
						const toolUse = block as ToolUseContent;
						const toolResult = toolResults.get(toolUse.id);

						return (
							<ToolInvocation
								// biome-ignore lint/suspicious/noArrayIndexKey: content blocks have no stable id
								key={idx}
								toolName={toolUse.name}
								input={toolUse.input}
								result={
									toolResult
										? {
												content: toolResult.content,
												is_error: toolResult.is_error,
											}
										: undefined
								}
							/>
						);
					}

					case "tool_result": {
						// Skip standalone tool results (they're shown with tool_use blocks)
						const toolResult = block as ToolResultContent;
						// Only show if there's no matching tool_use
						if (!toolUses.has(toolResult.tool_use_id)) {
							const resultContent =
								typeof toolResult.content === "string"
									? toolResult.content
									: Array.isArray(toolResult.content)
										? toolResult.content
												.map(
													(item: { text?: string }) =>
														item.text || JSON.stringify(item),
												)
												.join("\n")
										: JSON.stringify(toolResult.content);

							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: content blocks have no stable id
									key={idx}
									className={cn(
										"border rounded-lg p-4",
										toolResult.is_error
											? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
											: "border-border bg-muted/30",
									)}
								>
									<p
										className={cn(
											"text-xs font-semibold mb-2",
											toolResult.is_error
												? "text-red-700 dark:text-red-300"
												: "text-muted-foreground",
										)}
									>
										{toolResult.is_error ? "Tool Error" : "Tool Result"}
									</p>
									<CodeBlock code={resultContent} language="text" />
								</div>
							);
						}
						return null;
					}

					default:
						return null;
				}
			})}
		</div>
	);
}
