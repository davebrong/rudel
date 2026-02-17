import { oc } from "@orpc/contract";
import { z } from "zod";

export const HealthSchema = z.object({
	status: z.literal("ok"),
	timestamp: z.number(),
});

export const UserSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string(),
});

export const SessionTagSchema = z.enum([
	"research",
	"new_feature",
	"bug_fix",
	"refactoring",
	"documentation",
	"tests",
	"other",
]);

export const SubagentFileSchema = z.object({
	agentId: z.string(),
	content: z.string(),
});

export const IngestSessionInputSchema = z.object({
	sessionId: z.string(),
	projectPath: z.string(),
	repository: z.string().optional(),
	gitBranch: z.string().optional(),
	gitSha: z.string().optional(),
	tag: SessionTagSchema.optional(),
	content: z.string(),
	subagents: z.array(SubagentFileSchema).optional(),
});

export const IngestSessionOutputSchema = z.object({
	success: z.literal(true),
	sessionId: z.string(),
});

export type IngestSessionInput = z.infer<typeof IngestSessionInputSchema>;

export const contract = {
	health: oc.output(HealthSchema),
	me: oc.output(UserSchema),
	ingestSession: oc
		.input(IngestSessionInputSchema)
		.output(IngestSessionOutputSchema),
};
