import { readFile } from "node:fs/promises";
import { buildCommand } from "@stricli/core";
import {
	type IngestCodexRequest,
	uploadCodexSession,
} from "../../../lib/codex-uploader.js";
import { loadCredentials } from "../../../lib/credentials.js";
import { getGitInfo } from "../../../lib/git-info.js";
import { getProjectOrgId } from "../../../lib/project-config.js";

interface CodexNotifyInput {
	type: string;
	thread_id: string;
	turn_id?: string;
	cwd: string;
	transcript_path?: string;
}

async function readStdin(): Promise<string> {
	const chunks: string[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
	}
	return chunks.join("");
}

async function findActiveRolloutFile(threadId: string): Promise<string | null> {
	const { homedir } = await import("node:os");
	const { join } = await import("node:path");
	const { readdir } = await import("node:fs/promises");

	const sessionsDir = join(homedir(), ".codex", "sessions");

	async function walk(dir: string): Promise<string | null> {
		let entries: string[];
		try {
			entries = await readdir(dir);
		} catch {
			return null;
		}

		for (const entry of entries) {
			const fullPath = join(dir, entry);
			if (entry.endsWith(".jsonl")) {
				try {
					const content = await readFile(fullPath, "utf-8");
					const firstLine = content.split("\n")[0];
					if (!firstLine) continue;
					const parsed = JSON.parse(firstLine) as {
						type?: string;
						payload?: { id?: string };
					};
					if (
						parsed.type === "session_meta" &&
						parsed.payload?.id === threadId
					) {
						return fullPath;
					}
				} catch {
					// skip malformed files
				}
			} else if (!entry.includes(".")) {
				const found = await walk(fullPath);
				if (found) return found;
			}
		}
		return null;
	}

	return walk(sessionsDir);
}

async function runTurnComplete(): Promise<void> {
	try {
		const raw = await readStdin();
		if (!raw.trim()) return;

		const input = JSON.parse(raw) as CodexNotifyInput;
		if (!input.thread_id || !input.cwd) return;

		const credentials = loadCredentials();
		if (!credentials) return;

		const transcriptPath =
			input.transcript_path ?? (await findActiveRolloutFile(input.thread_id));
		if (!transcriptPath) return;

		const content = await readFile(transcriptPath, "utf-8");

		// Extract session meta for Codex-specific fields
		let cliVersion: string | undefined;
		let modelProvider: string | undefined;
		const firstLine = content.split("\n")[0];
		if (firstLine) {
			try {
				const parsed = JSON.parse(firstLine) as {
					type?: string;
					payload?: { cli_version?: string; model_provider?: string };
				};
				if (parsed.type === "session_meta" && parsed.payload) {
					cliVersion = parsed.payload.cli_version;
					modelProvider = parsed.payload.model_provider;
				}
			} catch {
				// ignore
			}
		}

		const gitInfo = await getGitInfo(input.cwd);
		const organizationId = await getProjectOrgId(input.cwd);

		const request: IngestCodexRequest = {
			sessionId: input.thread_id,
			projectPath: input.cwd,
			repository: gitInfo.repository,
			gitBranch: gitInfo.branch,
			gitSha: gitInfo.sha,
			content,
			organizationId,
			cliVersion,
			modelProvider,
		};

		const apiBase = process.env.RUDEL_API_BASE ?? credentials.apiBaseUrl;
		const endpoint = `${apiBase}/rpc`;
		await uploadCodexSession(request, {
			endpoint,
			token: credentials.token,
		});
	} catch {
		// Swallow all errors — this runs async in the background
	}
}

export const turnCompleteCommand = buildCommand({
	loader: async () => ({ default: runTurnComplete }),
	parameters: {},
	docs: {
		brief: "Handle Codex agent-turn-complete hook",
	},
});
