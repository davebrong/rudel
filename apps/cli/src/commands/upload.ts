import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { type BatchOptions, batchUpload } from "../lib/batch-uploader.js";
import { classifySession } from "../lib/classifier.js";
import { loadCredentials } from "../lib/credentials.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId } from "../lib/project-config.js";
import {
	groupProjectsByRemote,
	type ProjectGroup,
	scanProjects,
} from "../lib/project-scanner.js";
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

interface UploadFlags {
	tag?: SessionTag;
	endpoint: string;
	classify: boolean;
	dryRun: boolean;
	org?: string;
}

async function runInteractiveUpload(flags: UploadFlags): Promise<void> {
	const credentials = loadCredentials();
	if (!credentials && !flags.dryRun) {
		p.log.error("Not authenticated. Run `rudel login` first.");
		process.exitCode = 1;
		return;
	}

	p.intro("rudel upload");

	const spin = p.spinner();
	spin.start("Scanning projects...");
	const projects = await scanProjects();
	spin.stop(`Found ${projects.length} project(s)`);

	if (projects.length === 0) {
		p.log.warn("No projects with sessions found in ~/.claude/projects/");
		p.outro("Nothing to upload.");
		return;
	}

	const cwd = process.cwd();
	spin.start("Grouping by git remote...");
	const groups = await groupProjectsByRemote(projects, cwd);
	spin.stop(`Found ${groups.length} group(s)`);

	const options: Array<{
		value: ProjectGroup;
		label: string;
		hint: string;
	}> = [];
	const preSelected: ProjectGroup[] = [];

	for (const group of groups) {
		const label =
			group.projects.length > 1
				? group.displayName
				: (group.projects[0]?.displayPath ?? group.displayName);
		const hint =
			group.projects.length > 1
				? `${sessionCountHint(group.totalSessions)}, ${group.projects.length} locations`
				: sessionCountHint(group.totalSessions);
		options.push({ value: group, label, hint });
		if (group.containsCwd) {
			preSelected.push(group);
		}
	}

	const selected = await p.multiselect({
		message: "Select projects to upload",
		options,
		initialValues: preSelected,
		required: true,
	});

	if (p.isCancel(selected)) {
		p.cancel("Upload cancelled.");
		return;
	}

	const selectedProjects = selected.flatMap((g) => g.projects);
	const totalSessions = selected.reduce((sum, g) => sum + g.totalSessions, 0);
	p.log.info(
		`Uploading ${totalSessions} session(s) from ${selectedProjects.length} project(s)`,
	);

	const batchOpts: BatchOptions = {
		tag: flags.tag,
		classify: flags.classify,
		dryRun: flags.dryRun,
		org: flags.org,
		uploadConfig: {
			endpoint: flags.endpoint,
			token: credentials?.token ?? "",
		},
	};

	const uploadSpin = p.spinner();
	uploadSpin.start("Uploading sessions...");

	const result = await batchUpload(
		selectedProjects,
		batchOpts,
		(current, total) => {
			uploadSpin.message(`[${current}/${total}] Uploading...`);
		},
	);

	uploadSpin.stop("Upload complete");

	if (result.succeeded > 0) {
		p.log.success(`${result.succeeded} session(s) uploaded successfully`);
	}
	if (result.failed > 0) {
		p.log.error(`${result.failed} session(s) failed`);
		for (const err of result.errors.slice(0, 5)) {
			p.log.warn(`  ${err.project}/${err.sessionId}: ${err.error}`);
		}
		if (result.errors.length > 5) {
			p.log.warn(`  ...and ${result.errors.length - 5} more`);
		}
	}

	if (flags.dryRun) {
		p.outro("Dry run complete — no sessions were uploaded.");
	} else {
		p.outro("Done!");
	}

	if (result.failed > 0) {
		process.exitCode = 1;
	}
}

function sessionCountHint(count: number): string {
	return `${count} session${count !== 1 ? "s" : ""}`;
}

async function runSingleUpload(
	flags: UploadFlags,
	session: string,
): Promise<void> {
	const write = (msg: string) => {
		process.stdout.write(`${msg}\n`);
	};
	const writeError = (msg: string) => {
		process.stderr.write(`${msg}\n`);
	};

	const credentials = loadCredentials();
	if (!credentials && !flags.dryRun) {
		writeError("Error: Not authenticated. Run `rudel login` first.");
		process.exitCode = 1;
		return;
	}

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

	const gitInfo = await getGitInfo(sessionInfo.projectPath);
	if (gitInfo.repository) write(`Repository: ${gitInfo.repository}`);
	if (gitInfo.branch) write(`Branch: ${gitInfo.branch}`);

	let tag = flags.tag;
	if (!tag && flags.classify) {
		write("Classifying session...");
		tag = (await classifySession(content)) ?? undefined;
		if (tag) write(`Classified as: ${tag}`);
	}

	const organizationId =
		flags.org ?? (await getProjectOrgId(sessionInfo.projectPath));
	if (organizationId) write(`Organization: ${organizationId}`);

	const request: IngestRequest = {
		sessionId: sessionInfo.sessionId,
		projectPath: sessionInfo.projectPath,
		repository: gitInfo.repository,
		gitBranch: gitInfo.branch,
		gitSha: gitInfo.sha,
		tag,
		content,
		subagents: subagents.length > 0 ? subagents : undefined,
		organizationId,
	};

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

async function runUpload(
	flags: UploadFlags,
	...sessions: string[]
): Promise<void> {
	if (sessions.length === 0) {
		return runInteractiveUpload(flags);
	}
	return runSingleUpload(flags, sessions[0] as string);
}

export const uploadCommand = buildCommand({
	loader: async () => ({ default: runUpload }),
	parameters: {
		positional: {
			kind: "array",
			parameter: {
				brief: "Session ID or path to a session .jsonl file",
				parse: String,
				placeholder: "session",
			},
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
			org: {
				kind: "parsed",
				parse: String,
				brief: "Override the organization ID to upload to",
				optional: true,
			},
		},
		aliases: {
			t: "tag",
			c: "classify",
			n: "dryRun",
			o: "org",
		},
	},
	docs: {
		brief:
			"Upload Claude Code session transcripts. No args = interactive project picker.",
	},
});
