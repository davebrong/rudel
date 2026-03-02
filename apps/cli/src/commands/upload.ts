import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { type BatchOptions, batchUpload } from "../lib/batch-uploader.js";
import { classifySession } from "../lib/classifier.js";
import {
	type ScannedCodexProject,
	scanCodexSessions,
} from "../lib/codex-scanner.js";
import { uploadOneCodexSession } from "../lib/codex-uploader.js";
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
import { type UploadConfig, uploadSession } from "../lib/uploader.js";

interface UploadFlags {
	tag?: SessionTag;
	endpoint: string;
	classify: boolean;
	dryRun: boolean;
	org?: string;
}

type SelectionItem =
	| { source: "claude"; group: ProjectGroup }
	| { source: "codex"; codexProject: ScannedCodexProject };

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
	const [claudeProjects, codexProjects] = await Promise.all([
		scanProjects(),
		scanCodexSessions(),
	]);
	const totalProjectCount = claudeProjects.length + codexProjects.length;
	spin.stop(`Found ${totalProjectCount} project(s)`);

	if (totalProjectCount === 0) {
		p.log.warn("No projects with sessions found.");
		p.outro("Nothing to upload.");
		return;
	}

	const cwd = process.cwd();
	spin.start("Grouping by git remote...");
	const groups = await groupProjectsByRemote(claudeProjects, cwd);
	spin.stop(`Found ${groups.length} group(s)`);

	const options: Array<{
		value: SelectionItem;
		label: string;
		hint: string;
	}> = [];
	const preSelected: SelectionItem[] = [];

	for (const group of groups) {
		const item: SelectionItem = { source: "claude", group };
		const label =
			group.projects.length > 1
				? group.displayName
				: (group.projects[0]?.displayPath ?? group.displayName);
		const hint =
			group.projects.length > 1
				? `${sessionCountHint(group.totalSessions)}, ${group.projects.length} locations`
				: sessionCountHint(group.totalSessions);
		options.push({ value: item, label, hint });
		if (group.containsCwd) {
			preSelected.push(item);
		}
	}

	for (const codexProj of codexProjects) {
		const item: SelectionItem = { source: "codex", codexProject: codexProj };
		const isCurrent = codexProj.projectPath === cwd;
		options.push({
			value: item,
			label: `[Codex] ${codexProj.displayPath}`,
			hint: sessionCountHint(codexProj.sessionCount),
		});
		if (isCurrent) {
			preSelected.push(item);
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

	const claudeGroups = selected.filter(
		(s): s is Extract<SelectionItem, { source: "claude" }> =>
			s.source === "claude",
	);
	const codexSelected = selected.filter(
		(s): s is Extract<SelectionItem, { source: "codex" }> =>
			s.source === "codex",
	);

	const claudeSelectedProjects = claudeGroups.flatMap((g) => g.group.projects);
	const claudeSessionCount = claudeGroups.reduce(
		(sum, g) => sum + g.group.totalSessions,
		0,
	);
	const codexSessionCount = codexSelected.reduce(
		(sum, s) => sum + s.codexProject.sessionCount,
		0,
	);
	const totalSessions = claudeSessionCount + codexSessionCount;

	p.log.info(
		`Uploading ${totalSessions} session(s) from ${claudeSelectedProjects.length + codexSelected.length} project(s)`,
	);

	const uploadConfig: UploadConfig = {
		endpoint: flags.endpoint,
		token: credentials?.token ?? "",
	};

	const uploadSpin = p.spinner();
	uploadSpin.start("Uploading sessions...");

	let succeeded = 0;
	let failed = 0;
	const errors: Array<{ sessionId: string; project: string; error: string }> =
		[];
	let completed = 0;

	// Upload Claude sessions
	if (claudeSelectedProjects.length > 0) {
		const batchOpts: BatchOptions = {
			tag: flags.tag,
			classify: flags.classify,
			dryRun: flags.dryRun,
			org: flags.org,
			uploadConfig,
		};

		const claudeResult = await batchUpload(
			claudeSelectedProjects,
			batchOpts,
			(current, _total) => {
				uploadSpin.message(
					`[${completed + current}/${totalSessions}] Uploading...`,
				);
			},
		);
		succeeded += claudeResult.succeeded;
		failed += claudeResult.failed;
		errors.push(...claudeResult.errors);
		completed += claudeSessionCount;
	}

	// Upload Codex sessions
	for (const codexItem of codexSelected) {
		const codexProject = codexItem.codexProject;
		for (const session of codexProject.sessions) {
			completed++;
			uploadSpin.message(`[${completed}/${totalSessions}] Uploading...`);

			const outcome = await uploadOneCodexSession(
				session,
				codexProject.projectPath,
				{
					tag: flags.tag,
					dryRun: flags.dryRun,
					org: flags.org,
					uploadConfig,
				},
			);

			if (outcome.success) {
				succeeded++;
			} else {
				failed++;
				errors.push({
					sessionId: session.meta.id,
					project: codexProject.displayPath,
					error: outcome.error ?? "Unknown error",
				});
			}
		}
	}

	uploadSpin.stop("Upload complete");

	if (succeeded > 0) {
		p.log.success(`${succeeded} session(s) uploaded successfully`);
	}
	if (failed > 0) {
		p.log.error(`${failed} session(s) failed`);
		for (const err of errors.slice(0, 5)) {
			p.log.warn(`  ${err.project}/${err.sessionId}: ${err.error}`);
		}
		if (errors.length > 5) {
			p.log.warn(`  ...and ${errors.length - 5} more`);
		}
	}

	if (flags.dryRun) {
		p.outro("Dry run complete — no sessions were uploaded.");
	} else {
		p.outro("Done!");
	}

	if (failed > 0) {
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
		gitRemote: gitInfo.gitRemote,
		packageName: gitInfo.packageName,
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
			"Upload session transcripts (Claude Code & Codex). No args = interactive project picker.",
	},
});
