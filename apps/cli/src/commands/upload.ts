import { buildCommand } from "@stricli/core";
import { classifySession } from "../lib/classifier.js";
import { loadCredentials } from "../lib/credentials.js";
import { getGitInfo } from "../lib/git-info.js";
import { resolveSession } from "../lib/session-resolver.js";
import { readSubagentFiles } from "../lib/subagent-reader.js";
import { extractAgentIds, readTranscript } from "../lib/transcript-reader.js";
import {
	DEFAULT_ENDPOINT,
	type IngestRequest,
	SESSION_TAGS,
	type SessionTag,
	type SubagentFile,
} from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";

async function runUpload(
	flags: {
		tag?: SessionTag;
		endpoint: string;
		classify: boolean;
		dryRun: boolean;
	},
	session: string,
): Promise<void> {
	const write = (msg: string) => {
		process.stdout.write(`${msg}\n`);
	};
	const writeError = (msg: string) => {
		process.stderr.write(`${msg}\n`);
	};

	// Load credentials
	const credentials = loadCredentials();
	if (!credentials && !flags.dryRun) {
		writeError("Error: Not authenticated. Run `rudel login` first.");
		process.exitCode = 1;
		return;
	}

	// Resolve session (by ID or path)
	write(`Resolving session: ${session}`);
	let sessionInfo: Awaited<ReturnType<typeof resolveSession>>;
	try {
		sessionInfo = await resolveSession(session);
	} catch (error) {
		writeError(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
		return;
	}
	write(`Found session at: ${sessionInfo.transcriptPath}`);

	// Read transcript
	write("Reading transcript...");
	let content: string;
	try {
		content = await readTranscript(sessionInfo.transcriptPath);
	} catch (error) {
		writeError(
			`Error reading transcript: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
		return;
	}
	write(`Transcript: ${content.length} bytes`);

	// Extract and read subagents
	const agentIds = extractAgentIds(content);
	let subagents: SubagentFile[] = [];
	if (agentIds.length > 0) {
		write(`Found ${agentIds.length} subagent(s): ${agentIds.join(", ")}`);
		subagents = await readSubagentFiles(
			sessionInfo.sessionDir,
			agentIds,
			sessionInfo.sessionId,
		);
		write(
			`Read ${subagents.length} subagent file(s): ${subagents.reduce((sum, s) => sum + s.content.length, 0)} bytes total`,
		);
	}

	// Get git info
	const gitInfo = await getGitInfo(sessionInfo.projectPath);
	if (gitInfo.repository) write(`Repository: ${gitInfo.repository}`);
	if (gitInfo.branch) write(`Branch: ${gitInfo.branch}`);

	// Classify if requested
	let tag = flags.tag;
	if (!tag && flags.classify) {
		write("Classifying session...");
		tag = (await classifySession(content)) ?? undefined;
		if (tag) write(`Classified as: ${tag}`);
	}

	// Build request
	const request: IngestRequest = {
		sessionId: sessionInfo.sessionId,
		projectPath: sessionInfo.projectPath,
		repository: gitInfo.repository,
		gitBranch: gitInfo.branch,
		gitSha: gitInfo.sha,
		tag,
		content,
		subagents: subagents.length > 0 ? subagents : undefined,
	};

	// Upload or dry-run
	if (flags.dryRun) {
		const preview = {
			...request,
			content: `[${request.content.length} bytes]`,
			subagents: request.subagents?.map((s) => ({
				...s,
				content: `[${s.content.length} bytes]`,
			})),
		};
		write("Dry run - would upload:");
		write(JSON.stringify(preview, null, 2));
		return;
	}

	write("Uploading...");
	const result = await uploadSession(request, {
		endpoint: flags.endpoint,
		// biome-ignore lint/style/noNonNullAssertion: validated above with early return
		token: credentials!.token,
	});

	if (result.success) {
		write("Upload successful!");
	} else {
		writeError(`Upload failed: ${result.error}`);
		process.exitCode = 1;
	}
}

export const uploadCommand = buildCommand({
	loader: async () => ({ default: runUpload }),
	parameters: {
		positional: {
			kind: "tuple",
			parameters: [
				{
					brief: "Session ID or path to a session .jsonl file",
					parse: String,
					placeholder: "session",
				},
			],
		},
		flags: {
			tag: {
				kind: "enum",
				values: [...SESSION_TAGS],
				brief: "Session tag/category",
				optional: true,
			},
			endpoint: {
				kind: "parsed",
				parse: String,
				brief: "Override the upload endpoint URL",
				default: DEFAULT_ENDPOINT,
			},
			classify: {
				kind: "boolean",
				brief: "Auto-classify session tag using Claude CLI",
				default: false,
			},
			dryRun: {
				kind: "boolean",
				brief: "Preview what would be uploaded without sending",
				default: false,
			},
		},
		aliases: {
			t: "tag",
			c: "classify",
			n: "dryRun",
		},
	},
	docs: {
		brief: "Upload a Claude Code session transcript to the backend",
	},
});
