import type { IngestCodexSessionInput } from "@rudel/api-routes";
import {
	type Ingestor,
	ingestRudelCodexSessions,
	type RudelCodexSessionsRow,
} from "@rudel/ch-schema/generated";

interface IngestContext {
	userId: string;
	organizationId: string;
}

export function extractCodexTimestampRange(content: string): {
	sessionDate: string;
	lastInteractionDate: string;
} | null {
	let min: string | null = null;
	let max: string | null = null;

	for (const line of content.split("\n")) {
		if (!line) continue;
		let parsed: { timestamp?: string };
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}
		if (parsed.timestamp) {
			const ts = parsed.timestamp;
			if (!min || ts < min) min = ts;
			if (!max || ts > max) max = ts;
		}
	}

	if (!min || !max) return null;

	return { sessionDate: min, lastInteractionDate: max };
}

export function extractCodexSessionMeta(content: string): {
	cliVersion: string;
	modelProvider: string;
} {
	const firstLine = content.split("\n")[0];
	if (!firstLine) return { cliVersion: "", modelProvider: "" };

	try {
		const parsed = JSON.parse(firstLine) as {
			type?: string;
			payload?: { cli_version?: string; model_provider?: string };
		};
		if (parsed.type === "session_meta" && parsed.payload) {
			return {
				cliVersion: parsed.payload.cli_version ?? "",
				modelProvider: parsed.payload.model_provider ?? "",
			};
		}
	} catch {
		// ignore
	}

	return { cliVersion: "", modelProvider: "" };
}

function toClickHouseDateTime(isoString: string): string {
	return isoString.replace("T", " ").replace("Z", "").replace(/\+.*$/, "");
}

export function buildCodexSessionRow(
	input: IngestCodexSessionInput,
	context: IngestContext,
): RudelCodexSessionsRow {
	const now = new Date().toISOString().replace("Z", "");

	const timestamps = extractCodexTimestampRange(input.content);
	const meta = extractCodexSessionMeta(input.content);

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
		ingested_at: now,
		user_id: context.userId,
		git_branch: input.gitBranch ?? null,
		git_sha: input.gitSha ?? null,
		tag: input.tag ?? null,
		cli_version: input.cliVersion ?? meta.cliVersion,
		model_provider: input.modelProvider ?? meta.modelProvider,
		codex_source: input.codexSource ?? "cli",
	};
}

export async function ingestCodexSession(
	ingestor: Ingestor,
	input: IngestCodexSessionInput,
	context: IngestContext,
): Promise<void> {
	const row = buildCodexSessionRow(input, context);
	await ingestRudelCodexSessions(ingestor, [row]);
}
