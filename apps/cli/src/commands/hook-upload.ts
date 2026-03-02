import { dirname } from "node:path";
import { getLogger } from "@logtape/logtape";
import { buildCommand } from "@stricli/core";
import { classifySession } from "../lib/classifier.js";
import { readConfig } from "../lib/config.js";
import { getGitInfo } from "../lib/git-info.js";
import { parseStdinInput, readStdin } from "../lib/stdin.js";
import { readSubagentFiles } from "../lib/subagent-reader.js";
import { extractAgentIds, readTranscript } from "../lib/transcript-reader.js";
import { DEFAULT_ENDPOINT, type IngestRequest } from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";
import { disposeLogging, setupHookLogging } from "../logging.js";

/**
 * Hook-based session upload that reads session metadata from stdin.
 * Designed to be called by the Claude Code plugin's SessionEnd hook.
 * Runs silently — all output goes to the log file, not stdout.
 */
async function runHookUpload(): Promise<void> {
	await setupHookLogging();
	const logger = getLogger(["rudel", "cli", "hook"]);

	try {
		logger.debug("Hook upload started");

		const config = await readConfig();

		if (!config.apiKey) {
			logger.debug("Not logged in, skipping session upload.");
			return;
		}

		const stdinContent = await readStdin();
		const input = parseStdinInput(stdinContent);

		if (!input) {
			logger.debug("No stdin input, exiting.");
			return;
		}

		const { session_id, transcript_path, cwd } = input;
		if (!session_id || !transcript_path) {
			logger.error("Missing session_id or transcript_path");
			return;
		}

		const content = await readTranscript(transcript_path);

		const agentIds = extractAgentIds(content);
		const sessionDir = dirname(transcript_path);
		const subagents =
			agentIds.length > 0
				? await readSubagentFiles(sessionDir, agentIds, session_id)
				: undefined;

		const [gitInfo, tag] = await Promise.all([
			getGitInfo(cwd),
			classifySession(content),
		]);

		const request: IngestRequest = {
			sessionId: session_id,
			projectPath: cwd,
			repository: gitInfo.repository,
			gitBranch: gitInfo.branch,
			gitSha: gitInfo.sha,
			tag: tag ?? undefined,
			content,
			subagents: subagents?.length ? subagents : undefined,
		};

		const endpoint =
			process.env.GAZED_INGEST_ENDPOINT ?? config.endpoint ?? DEFAULT_ENDPOINT;

		logger.info(
			"Uploading session {sessionId}, repo={repository}, branch={branch}, tag={tag}, bytes={bytes}, subagents={subagents}",
			{
				sessionId: request.sessionId,
				repository: request.repository ?? "none",
				branch: request.gitBranch ?? "none",
				tag: request.tag ?? "none",
				bytes: request.content.length,
				subagents: request.subagents?.length ?? 0,
			},
		);

		const result = await uploadSession(request, {
			endpoint,
			token: config.apiKey,
		});

		if (result.success) {
			logger.info("Upload successful for session {sessionId}", {
				sessionId: request.sessionId,
			});
		} else {
			logger.error("Upload failed: {error}", { error: result.error });
		}
	} catch (error) {
		logger.error("Unexpected error: {error}", { error });
	} finally {
		await disposeLogging();
	}
}

export const hookUploadCommand = buildCommand({
	loader: async () => ({ default: runHookUpload }),
	parameters: {},
	docs: {
		brief: "Upload session from Claude Code hook (reads stdin, logs to file)",
	},
});
