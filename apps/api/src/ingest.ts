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

/**
 * Extracts the earliest and latest top-level `timestamp` values from JSONL content.
 * Returns [earliest, latest] as ISO strings without trailing "Z", or [fallback, fallback]
 * if no valid timestamps are found.
 */
export function extractTimestampRange(
	content: string,
	fallback: string,
): [string, string] {
	const lines = content.split("\n");
	let earliest: number | undefined;
	let latest: number | undefined;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		let parsed: unknown;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			continue;
		}

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			!("timestamp" in parsed)
		)
			continue;

		const ts = (parsed as { timestamp: unknown }).timestamp;
		if (typeof ts !== "string") continue;

		const ms = Date.parse(ts);
		if (Number.isNaN(ms)) continue;

		if (earliest === undefined || ms < earliest) earliest = ms;
		if (latest === undefined || ms > latest) latest = ms;
	}

	if (earliest === undefined || latest === undefined) {
		return [fallback, fallback];
	}

	const fmt = (ms: number) => new Date(ms).toISOString().replace("Z", "");
	return [fmt(earliest), fmt(latest)];
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

	const [sessionDate, lastInteractionDate] = extractTimestampRange(
		input.content,
		now,
	);

	return {
		session_date: sessionDate,
		last_interaction_date: lastInteractionDate,
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
