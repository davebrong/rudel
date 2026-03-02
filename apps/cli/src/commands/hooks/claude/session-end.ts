import { getLogger } from "@logtape/logtape";
import { buildCommand } from "@stricli/core";
import { loadCredentials } from "../../../lib/credentials.js";
import { getGitInfo } from "../../../lib/git-info.js";
import { getProjectOrgId } from "../../../lib/project-config.js";
import { readSubagentFiles } from "../../../lib/subagent-reader.js";
import {
	extractAgentIds,
	readTranscript,
} from "../../../lib/transcript-reader.js";
import type { IngestRequest } from "../../../lib/types.js";
import { uploadSession } from "../../../lib/uploader.js";
import { disposeLogging, setupHookLogging } from "../../../logging.js";

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
	await setupHookLogging();
	const logger = getLogger(["rudel", "cli", "hook"]);

	try {
		const raw = await readStdin();
		if (!raw.trim()) return;

		const input = JSON.parse(raw) as HookInput;
		if (!input.session_id || !input.transcript_path) return;

		const credentials = loadCredentials();
		if (!credentials) return;

		logger.info("Uploading session {sessionId}", {
			sessionId: input.session_id,
		});

		const content = await readTranscript(input.transcript_path);

		const agentIds = extractAgentIds(content);
		const { dirname } = await import("node:path");
		const sessionDir = dirname(input.transcript_path);
		const subagents =
			agentIds.length > 0
				? await readSubagentFiles(sessionDir, agentIds, input.session_id)
				: [];

		const gitInfo = await getGitInfo(input.cwd);
		const organizationId = await getProjectOrgId(input.cwd);

		const request: IngestRequest = {
			sessionId: input.session_id,
			projectPath: input.cwd,
			repository: gitInfo.repository,
			gitBranch: gitInfo.branch,
			gitSha: gitInfo.sha,
			content,
			subagents: subagents.length > 0 ? subagents : undefined,
			organizationId,
		};

		const apiBase = process.env.RUDEL_API_BASE ?? credentials.apiBaseUrl;
		const endpoint = `${apiBase}/rpc`;
		await uploadSession(request, { endpoint, token: credentials.token });

		logger.info("Upload successful for session {sessionId}", {
			sessionId: input.session_id,
		});
	} catch (error) {
		logger.error("Session end hook failed: {error}", { error });
	} finally {
		await disposeLogging();
	}
}

export const sessionEndCommand = buildCommand({
	loader: async () => ({ default: runSessionEnd }),
	parameters: {},
	docs: {
		brief: "Handle Claude Code SessionEnd hook",
	},
});
