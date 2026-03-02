import * as p from "@clack/prompts";
import {
	claudeCodeAdapter,
	getAdapter,
	getAvailableAdapters,
	groupProjectsForCwd,
	type ScannedProject,
	type SessionFile,
} from "@rudel/agent-adapters";
import { buildCommand } from "@stricli/core";
import { classifySession } from "../lib/classifier.js";
import { loadCredentials } from "../lib/credentials.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId } from "../lib/project-config.js";
import { resolveSession } from "../lib/session-resolver.js";
import {
	DEFAULT_ENDPOINT,
	SESSION_TAGS,
	type SessionTag,
} from "../lib/types.js";
import { type UploadConfig, uploadSession } from "../lib/uploader.js";

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

	const adapters = getAvailableAdapters();
	const allProjects: ScannedProject[] = [];
	for (const adapter of adapters) {
		const projects = await adapter.scanAllSessions();
		allProjects.push(...projects);
	}

	spin.stop(`Found ${allProjects.length} project(s)`);

	if (allProjects.length === 0) {
		p.log.warn("No projects with sessions found.");
		p.outro("Nothing to upload.");
		return;
	}

	const cwd = process.cwd();
	const grouped = groupProjectsForCwd(allProjects, cwd);

	const options: Array<{
		value: ScannedProject;
		label: string;
		hint: string;
	}> = [];
	const preSelected: ScannedProject[] = [];

	for (const proj of grouped.current) {
		options.push({
			value: proj,
			label: `[${getAdapterName(proj.source)}] ${proj.displayPath}`,
			hint: sessionCountHint(proj.sessionCount),
		});
		preSelected.push(proj);
	}

	for (const sub of grouped.subfolders) {
		const relative = sub.projectPath.slice(cwd.length + 1);
		options.push({
			value: sub,
			label: `  [${getAdapterName(sub.source)}] ${relative}`,
			hint: sessionCountHint(sub.sessionCount),
		});
		preSelected.push(sub);
	}

	for (const other of grouped.others) {
		options.push({
			value: other,
			label: `[${getAdapterName(other.source)}] ${other.displayPath}`,
			hint: sessionCountHint(other.sessionCount),
		});
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

	const totalSessions = selected.reduce(
		(sum, proj) => sum + proj.sessionCount,
		0,
	);
	p.log.info(
		`Uploading ${totalSessions} session(s) from ${selected.length} project(s)`,
	);

	const uploadConfig: UploadConfig = {
		endpoint: flags.endpoint,
		token: credentials?.token ?? "",
	};

	const uploadSpin = p.spinner();
	uploadSpin.start("Uploading sessions...");

	let succeeded = 0;
	let failed = 0;
	let completed = 0;
	const errors: Array<{ sessionId: string; project: string; error: string }> =
		[];

	for (const project of selected) {
		const adapter = getAdapter(project.source);
		const gitInfo = await getGitInfo(project.projectPath);
		const organizationId =
			flags.org ?? (await getProjectOrgId(project.projectPath));

		for (const session of project.sessions) {
			completed++;
			uploadSpin.message(`[${completed}/${totalSessions}] Uploading...`);

			try {
				const request = await adapter.buildUploadRequest(session, {
					tag: flags.tag,
					gitInfo,
					organizationId,
				});

				if (!flags.tag && flags.classify) {
					const classified = await classifySession(request.content);
					if (classified) {
						(request as { tag?: string }).tag = classified;
					}
				}

				if (flags.dryRun) {
					succeeded++;
					continue;
				}

				const result = await uploadSession(request, uploadConfig);
				if (result.success) {
					succeeded++;
				} else {
					failed++;
					errors.push({
						sessionId: session.sessionId,
						project: project.displayPath,
						error: result.error ?? "Unknown error",
					});
				}
			} catch (error) {
				failed++;
				errors.push({
					sessionId: session.sessionId,
					project: project.displayPath,
					error: error instanceof Error ? error.message : String(error),
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

function getAdapterName(source: string): string {
	try {
		return getAdapter(source).name;
	} catch {
		return source;
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

	const gitInfo = await getGitInfo(sessionInfo.projectPath);
	if (gitInfo.repository) write(`Repository: ${gitInfo.repository}`);
	if (gitInfo.branch) write(`Branch: ${gitInfo.branch}`);

	const organizationId =
		flags.org ?? (await getProjectOrgId(sessionInfo.projectPath));
	if (organizationId) write(`Organization: ${organizationId}`);

	write("Building upload request...");
	const sessionFile: SessionFile = {
		sessionId: sessionInfo.sessionId,
		transcriptPath: sessionInfo.transcriptPath,
		projectPath: sessionInfo.projectPath,
	};

	const request = await claudeCodeAdapter.buildUploadRequest(sessionFile, {
		tag: flags.tag,
		gitInfo,
		organizationId,
	});

	write(`Transcript: ${request.content.length} bytes`);
	if (request.subagents && request.subagents.length > 0) {
		write(`Subagents: ${request.subagents.length} file(s)`);
	}

	if (!flags.tag && flags.classify) {
		write("Classifying session...");
		const classified = await classifySession(request.content);
		if (classified) {
			(request as { tag?: string }).tag = classified;
			write(`Classified as: ${classified}`);
		}
	}

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
