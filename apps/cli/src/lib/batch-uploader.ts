import { classifySession } from "./classifier.js";
import { getGitInfo } from "./git-info.js";
import { getProjectOrgId } from "./project-config.js";
import type { ScannedProject } from "./project-scanner.js";
import { readSubagentFiles } from "./subagent-reader.js";
import { extractAgentIds, readTranscript } from "./transcript-reader.js";
import type { IngestRequest, SessionTag, SubagentFile } from "./types.js";
import { type UploadConfig, uploadSession } from "./uploader.js";

export interface BatchOptions {
	tag?: SessionTag;
	classify: boolean;
	dryRun: boolean;
	org?: string;
	uploadConfig: UploadConfig;
}

export interface BatchResult {
	succeeded: number;
	failed: number;
	errors: Array<{ sessionId: string; project: string; error: string }>;
}

export async function uploadOneSession(
	sessionDir: string,
	sessionId: string,
	projectPath: string,
	options: BatchOptions,
): Promise<{ success: boolean; error?: string }> {
	const transcriptPath = `${sessionDir}/${sessionId}.jsonl`;

	let content: string;
	try {
		content = await readTranscript(transcriptPath);
	} catch (error) {
		return {
			success: false,
			error: `Failed to read: ${error instanceof Error ? error.message : String(error)}`,
		};
	}

	const agentIds = extractAgentIds(content);
	let subagents: SubagentFile[] = [];
	if (agentIds.length > 0) {
		subagents = await readSubagentFiles(sessionDir, agentIds, sessionId);
	}

	const gitInfo = await getGitInfo(projectPath);

	let tag = options.tag;
	if (!tag && options.classify) {
		tag = (await classifySession(content)) ?? undefined;
	}

	const organizationId = options.org ?? (await getProjectOrgId(projectPath));

	const request: IngestRequest = {
		sessionId,
		projectPath,
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

	if (options.dryRun) {
		return { success: true };
	}

	const result = await uploadSession(request, options.uploadConfig);
	if (result.success) {
		return { success: true };
	}
	return { success: false, error: result.error };
}

export async function batchUpload(
	projects: ScannedProject[],
	options: BatchOptions,
	onProgress: (current: number, total: number, sessionId: string) => void,
): Promise<BatchResult> {
	const totalSessions = projects.reduce(
		(sum, p) => sum + p.sessionIds.length,
		0,
	);
	let completed = 0;
	const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };

	for (const project of projects) {
		for (const sessionId of project.sessionIds) {
			completed++;
			onProgress(completed, totalSessions, sessionId);

			const outcome = await uploadOneSession(
				project.sessionDir,
				sessionId,
				project.decodedPath,
				options,
			);

			if (outcome.success) {
				result.succeeded++;
			} else {
				result.failed++;
				result.errors.push({
					sessionId,
					project: project.displayPath,
					error: outcome.error ?? "Unknown error",
				});
			}
		}
	}

	return result;
}
