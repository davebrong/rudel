import type { IngestSessionInput } from "@rudel/api-routes";
import type { Ingestor } from "@rudel/ch-schema";
import {
	type FlickClaudeSessionsRow,
	ingestFlickClaudeSessions,
} from "@rudel/ch-schema";

interface IngestContext {
	userId: string;
	organizationId: string;
}

export function buildSessionRow(
	input: IngestSessionInput,
	context: IngestContext,
): FlickClaudeSessionsRow {
	const now = new Date().toISOString().replace("Z", "");

	const subagents: Record<string, string> = {};
	if (input.subagents) {
		for (const sub of input.subagents) {
			subagents[sub.agentId] = sub.content;
		}
	}

	return {
		session_date: now,
		last_interaction_date: now,
		session_id: input.sessionId,
		organization_id: context.organizationId,
		project_path: input.projectPath,
		repository: input.repository ?? null,
		content: input.content,
		subagents,
		skills: [],
		slash_commands: [],
		subagent_types: [],
		ingested_at: now,
		user_id: context.userId,
		git_branch: input.gitBranch ?? null,
		git_sha: input.gitSha ?? null,
		input_tokens: "0",
		output_tokens: "0",
		cache_read_input_tokens: "0",
		cache_creation_input_tokens: "0",
		total_tokens: "0",
		tag: input.tag ?? null,
	};
}

export async function ingestSession(
	ingestor: Ingestor,
	input: IngestSessionInput,
	context: IngestContext,
): Promise<void> {
	const row = buildSessionRow(input, context);
	await ingestFlickClaudeSessions(ingestor, [row]);
}
