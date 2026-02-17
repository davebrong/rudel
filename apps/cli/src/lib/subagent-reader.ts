import { join } from "node:path";
import type { SubagentFile } from "./types.js";

/**
 * Read all subagent files for a session.
 * Subagent transcripts can be stored in multiple locations:
 * 1. {sessionDir}/agent-{agentId}.jsonl (legacy)
 * 2. {sessionDir}/{sessionId}/subagents/agent-{agentId}.jsonl (new format)
 */
export async function readSubagentFiles(
	sessionDir: string,
	agentIds: string[],
	sessionId?: string,
): Promise<SubagentFile[]> {
	const subagents: SubagentFile[] = [];

	for (const agentId of agentIds) {
		const possiblePaths = [
			join(sessionDir, `agent-${agentId}.jsonl`),
			...(sessionId
				? [join(sessionDir, sessionId, "subagents", `agent-${agentId}.jsonl`)]
				: []),
		];

		for (const agentPath of possiblePaths) {
			try {
				const file = Bun.file(agentPath);
				if (await file.exists()) {
					const content = await file.text();
					subagents.push({ agentId, content });
					break;
				}
			} catch {
				// Try next path
			}
		}
	}

	return subagents;
}
