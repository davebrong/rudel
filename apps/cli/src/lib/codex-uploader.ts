import { readFile } from "node:fs/promises";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@rudel/api-routes";
import type { ScannedCodexSession } from "./codex-scanner.js";
import { getGitInfo } from "./git-info.js";
import { getProjectOrgId } from "./project-config.js";
import type { SessionTag, UploadResult } from "./types.js";
import type { UploadConfig } from "./uploader.js";

export interface IngestCodexRequest {
	sessionId: string;
	projectPath: string;
	repository?: string;
	gitBranch?: string;
	gitSha?: string;
	tag?: SessionTag;
	content: string;
	organizationId?: string;
	cliVersion?: string;
	modelProvider?: string;
	codexSource?: "cli" | "vscode";
}

export async function uploadCodexSession(
	request: IngestCodexRequest,
	config: UploadConfig,
): Promise<UploadResult> {
	const link = new RPCLink({
		url: config.endpoint,
		headers: {
			Authorization: `Bearer ${config.token}`,
		},
	});

	const client: ContractRouterClient<typeof contract> = createORPCClient(link);

	try {
		await client.ingestCodexSession(request);
		return { success: true, status: 200 };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function uploadOneCodexSession(
	session: ScannedCodexSession,
	projectPath: string,
	options: {
		tag?: SessionTag;
		dryRun: boolean;
		org?: string;
		uploadConfig: UploadConfig;
	},
): Promise<{ success: boolean; error?: string }> {
	let content: string;
	try {
		content = await readFile(session.filePath, "utf-8");
	} catch (error) {
		return {
			success: false,
			error: `Failed to read: ${error instanceof Error ? error.message : String(error)}`,
		};
	}

	const gitInfo = await getGitInfo(projectPath);
	const organizationId = options.org ?? (await getProjectOrgId(projectPath));

	const request: IngestCodexRequest = {
		sessionId: session.meta.id,
		projectPath,
		repository: gitInfo.repository,
		gitBranch: session.meta.gitBranch ?? gitInfo.branch,
		gitSha: session.meta.gitSha ?? gitInfo.sha,
		tag: options.tag,
		content,
		organizationId,
		cliVersion: session.meta.cliVersion,
		modelProvider: session.meta.modelProvider,
	};

	if (options.dryRun) {
		return { success: true };
	}

	const result = await uploadCodexSession(request, options.uploadConfig);
	if (result.success) {
		return { success: true };
	}
	return { success: false, error: result.error };
}
