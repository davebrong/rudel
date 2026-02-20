import { buildCommand } from "@stricli/core";
import { loadCredentials } from "../../../lib/credentials.js";
import { getGitInfo } from "../../../lib/git-info.js";
import { readSubagentFiles } from "../../../lib/subagent-reader.js";
import {
	extractAgentIds,
	readTranscript,
} from "../../../lib/transcript-reader.js";
import type { IngestRequest } from "../../../lib/types.js";
import { uploadSession } from "../../../lib/uploader.js";

interface HookInput {
	session_id: string;
	transcript_path: string;
	cwd: string;
}

async function readStdin(): Promise<string> {
	const chunks: string[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
	}
	return chunks.join("");
}

async function runSessionEnd(): Promise<void> {
	try {
		const raw = await readStdin();
		if (!raw.trim()) return;

		const input = JSON.parse(raw) as HookInput;
		if (!input.session_id || !input.transcript_path) return;

		const credentials = loadCredentials();
		if (!credentials) return;

		const content = await readTranscript(input.transcript_path);

		const agentIds = extractAgentIds(content);
		const { dirname } = await import("node:path");
		const sessionDir = dirname(input.transcript_path);
		const subagents =
			agentIds.length > 0
				? await readSubagentFiles(sessionDir, agentIds, input.session_id)
				: [];

		const gitInfo = await getGitInfo(input.cwd);

		const request: IngestRequest = {
			sessionId: input.session_id,
			projectPath: input.cwd,
			repository: gitInfo.repository,
			gitBranch: gitInfo.branch,
			gitSha: gitInfo.sha,
			content,
			subagents: subagents.length > 0 ? subagents : undefined,
		};

		const endpoint = `${credentials.apiBaseUrl}/rpc`;
		await uploadSession(request, { endpoint, token: credentials.token });
	} catch {
		// Swallow all errors — this runs async in the background
	}
}

export const sessionEndCommand = buildCommand({
	loader: async () => ({ default: runSessionEnd }),
	parameters: {},
	docs: {
		brief: "Handle Claude Code SessionEnd hook",
	},
});
