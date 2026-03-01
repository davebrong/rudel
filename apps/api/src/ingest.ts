import type { IngestSessionInput } from "@rudel/api-routes";
import type { Ingestor } from "@rudel/ch-schema";
import {
	ingestRudelClaudeSessions,
	type RudelClaudeSessionsRow,
} from "@rudel/ch-schema";

interface IngestContext {
	userId: string;
	organizationId: string;
}

export function extractTimestampRange(content: string): {
	sessionDate: string;
	lastInteractionDate: string;
} | null {
	let min: string | null = null;
	let max: string | null = null;

	for (const line of content.split("\n")) {
		if (!line) continue;
		let parsed: { type?: string; timestamp?: string };
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}
		if (
			(parsed.type === "user" || parsed.type === "assistant") &&
			parsed.timestamp
		) {
			const ts = parsed.timestamp;
			if (!min || ts < min) min = ts;
			if (!max || ts > max) max = ts;
		}
	}

	if (!min || !max) return null;

	return { sessionDate: min, lastInteractionDate: max };
}

function toClickHouseDateTime(isoString: string): string {
	return isoString.replace("T", " ").replace("Z", "").replace(/\+.*$/, "");
}

export function buildSessionRow(
	input: IngestSessionInput,
	context: IngestContext,
): RudelClaudeSessionsRow {
	const now = new Date().toISOString().replace("Z", "");

	const subagents: Record<string, string> = {};
	if (input.subagents) {
		for (const sub of input.subagents) {
			subagents[sub.agentId] = sub.content;
		}
	}

	const timestamps = extractTimestampRange(input.content);

	return {
		session_date: timestamps
			? toClickHouseDateTime(timestamps.sessionDate)
			: now,
		last_interaction_date: timestamps
			? toClickHouseDateTime(timestamps.lastInteractionDate)
			: now,
		session_id: input.sessionId,
		organization_id: context.organizationId,
		project_path: input.projectPath,
		repository: input.repository ?? null,
		content: input.content,
		subagents,
		ingested_at: now,
		user_id: context.userId,
		git_branch: input.gitBranch ?? null,
		git_sha: input.gitSha ?? null,
		tag: input.tag ?? null,
	};
}

export async function ingestSession(
	ingestor: Ingestor,
	input: IngestSessionInput,
	context: IngestContext,
): Promise<void> {
	const row = buildSessionRow(input, context);
	await ingestRudelClaudeSessions(ingestor, [row]);
}
