import { z } from "zod";

// ── Content block schemas ──────────────────────────────────────────

export const TextContentSchema = z.object({
	type: z.literal("text"),
	text: z.string(),
});

export const ThinkingContentSchema = z.object({
	type: z.literal("thinking"),
	thinking: z.string(),
});

export const ToolUseContentSchema = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.string(),
	input: z.record(z.string(), z.any()),
});

export const ToolResultContentSchema = z.object({
	type: z.literal("tool_result"),
	tool_use_id: z.string(),
	content: z.union([
		z.string(),
		z.array(
			z.object({
				type: z.string(),
				text: z.string().optional(),
				source: z.any().optional(),
			}),
		),
	]),
	is_error: z.boolean().optional(),
});

export const ContentSchema = z.union([
	TextContentSchema,
	ThinkingContentSchema,
	ToolUseContentSchema,
	ToolResultContentSchema,
]);

// ── Role-based entry schemas ───────────────────────────────────────

export const UserEntrySchema = z.object({
	role: z.literal("user"),
	content: z.union([z.string(), z.array(ContentSchema)]),
	timestamp: z.string().optional(),
});

export const AssistantEntrySchema = z.object({
	role: z.literal("assistant"),
	content: z.union([z.string(), z.array(ContentSchema)]),
	timestamp: z.string().optional(),
});

export const SummaryEntrySchema = z.object({
	role: z.literal("summary"),
	summary: z.string(),
	timestamp: z.string().optional(),
});

export const SystemEntrySchema = z.object({
	role: z.literal("system"),
	content: z.string(),
	timestamp: z.string().optional(),
});

// ── Type-based entry schemas (alternative format from ClickHouse) ──

export const TypeUserEntrySchema = z
	.object({
		type: z.literal("user"),
		message: z
			.object({
				content: z.union([z.string(), z.array(ContentSchema)]),
			})
			.passthrough()
			.optional(),
		content: z.union([z.string(), z.array(ContentSchema)]).optional(),
		timestamp: z.string().optional(),
	})
	.passthrough();

export const TypeAssistantEntrySchema = z
	.object({
		type: z.literal("assistant"),
		message: z
			.object({
				content: z.union([z.string(), z.array(ContentSchema)]),
			})
			.passthrough()
			.optional(),
		content: z.union([z.string(), z.array(ContentSchema)]).optional(),
		timestamp: z.string().optional(),
	})
	.passthrough();

export const TypeSystemEntrySchema = z
	.object({
		type: z.literal("system"),
		content: z.string().optional(),
		text: z.string().optional(),
		timestamp: z.string().optional(),
	})
	.passthrough();

export const ProgressEntrySchema = z
	.object({
		type: z.literal("progress"),
	})
	.passthrough();

export const GenericEntrySchema = z
	.object({
		type: z.string(),
		messageId: z.string().optional(),
	})
	.passthrough();

// ── Conversation entry union ───────────────────────────────────────

export const ConversationSchema = z.union([
	// Role-based entries (original format)
	UserEntrySchema,
	AssistantEntrySchema,
	SummaryEntrySchema,
	SystemEntrySchema,
	// Type-based entries (actual format from ClickHouse)
	TypeUserEntrySchema,
	TypeAssistantEntrySchema,
	TypeSystemEntrySchema,
	ProgressEntrySchema,
	// Fallback for other types
	GenericEntrySchema,
]);

// ── Type exports ───────────────────────────────────────────────────

export type TextContent = z.infer<typeof TextContentSchema>;
export type ThinkingContent = z.infer<typeof ThinkingContentSchema>;
export type ToolUseContent = z.infer<typeof ToolUseContentSchema>;
export type ToolResultContent = z.infer<typeof ToolResultContentSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type UserEntry = z.infer<typeof UserEntrySchema>;
export type AssistantEntry = z.infer<typeof AssistantEntrySchema>;
export type SummaryEntry = z.infer<typeof SummaryEntrySchema>;
export type SystemEntry = z.infer<typeof SystemEntrySchema>;
export type TypeUserEntry = z.infer<typeof TypeUserEntrySchema>;
export type TypeAssistantEntry = z.infer<typeof TypeAssistantEntrySchema>;
export type TypeSystemEntry = z.infer<typeof TypeSystemEntrySchema>;
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;
export type GenericEntry = z.infer<typeof GenericEntrySchema>;
export type ConversationEntry = z.infer<typeof ConversationSchema>;

// ── Parser ─────────────────────────────────────────────────────────

/**
 * Parse JSONL conversation content into structured conversation entries
 */
export function parseConversations(content: string): ConversationEntry[] {
	if (!content || content.trim() === "") {
		return [];
	}

	const lines = content.split("\n").filter((line) => line.trim() !== "");
	const conversations: ConversationEntry[] = [];
	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] as string;
		try {
			const json: unknown = JSON.parse(line);
			const parsed = ConversationSchema.safeParse(json);

			if (parsed.success) {
				conversations.push(parsed.data);
				successCount++;
			} else {
				failCount++;
				if (failCount <= 3) {
					console.warn(
						`[parseConversations] Line ${i + 1} failed validation:`,
						{
							role: (json as Record<string, unknown>)?.role,
							errors: parsed.error.issues,
							sample: JSON.stringify(json).slice(0, 200),
						},
					);
				}
			}
		} catch (error) {
			failCount++;
			if (failCount <= 3) {
				console.warn(
					`[parseConversations] Line ${i + 1} JSON parse error:`,
					error,
				);
				console.warn(
					`[parseConversations] Line content sample:`,
					line.slice(0, 200),
				);
			}
		}
	}

	if (conversations.length > 0) {
		const entryTypes: Record<string, number> = {};
		const roleTypes: Record<string, number> = {};

		for (const entry of conversations) {
			if ("type" in entry) {
				const type = (entry as Record<string, unknown>).type as string;
				entryTypes[type] = (entryTypes[type] || 0) + 1;
			}
			if ("role" in entry) {
				const role = (entry as Record<string, unknown>).role as string;
				roleTypes[role] = (roleTypes[role] || 0) + 1;
			}
		}

		console.log(
			`[parseConversations] Parsed ${successCount} entries, ${failCount} failed out of ${lines.length} lines`,
		);
		console.log(`[parseConversations] Entry types found:`, entryTypes);
		console.log(`[parseConversations] Role types found:`, roleTypes);
	} else {
		console.log(
			`[parseConversations] Parsed ${successCount} entries, ${failCount} failed out of ${lines.length} lines`,
		);
	}

	return conversations;
}
