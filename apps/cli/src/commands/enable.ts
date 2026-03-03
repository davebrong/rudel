import * as p from "@clack/prompts";
import {
	type AgentAdapter,
	getAdapter,
	getAvailableAdapters,
} from "@rudel/agent-adapters";
import { buildCommand } from "@stricli/core";
import { createApiClient } from "../lib/api-client.js";
import { verifyAuth } from "../lib/auth.js";
import type { BatchUploadItem } from "../lib/batch-upload.js";
import { renderBatchSummary, runBatchUpload } from "../lib/batch-upload-ui.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId, setProjectOrgId } from "../lib/project-config.js";
import { scanAndGroupProjects } from "../lib/project-grouping.js";
import { uploadSession } from "../lib/uploader.js";

async function runEnable(): Promise<void> {
	p.intro("rudel enable");

	// Verify auth (loads credentials + pings API)
	const auth = await verifyAuth();
	if (!auth.authenticated) {
		p.log.error(auth.message);
		p.outro("Run `rudel login` to authenticate.");
		process.exitCode = 1;
		return;
	}

	const { credentials } = auth;

	// Fetch user's organizations
	const client = createApiClient(credentials);
	let orgs: { id: string; name: string; slug: string }[];
	try {
		orgs = await client.listMyOrganizations();
	} catch {
		p.log.error("Failed to fetch organizations. Check your connection.");
		process.exitCode = 1;
		return;
	}

	if (orgs.length === 0) {
		p.log.error("No organizations found.");
		p.outro("Create one at app.rudel.ai first.");
		process.exitCode = 1;
		return;
	}

	// Check if already configured for this project
	const cwd = process.cwd();
	const existingOrgId = await getProjectOrgId(cwd);
	const existingOrg = existingOrgId
		? orgs.find((o) => o.id === existingOrgId)
		: undefined;

	let selectedOrgId: string;

	const [firstOrg] = orgs;
	if (orgs.length === 1 && firstOrg) {
		selectedOrgId = firstOrg.id;
		p.log.info(`Using organization: ${firstOrg.name}`);
	} else if (existingOrg) {
		p.log.info(`Currently configured for: ${existingOrg.name}`);
		selectedOrgId = existingOrg.id;
	} else {
		const selected = await p.select({
			message: "Select an organization for this repository",
			options: orgs.map((org) => ({
				value: org.id,
				label: org.name,
				hint: org.slug,
			})),
		});

		if (p.isCancel(selected)) {
			p.cancel("Setup cancelled.");
			return;
		}

		selectedOrgId = selected;
		const selectedOrg = orgs.find((o) => o.id === selected);
		if (selectedOrg) {
			p.log.success(`Selected: ${selectedOrg.name}`);
		}
	}

	await setProjectOrgId(cwd, selectedOrgId);

	// Detect available agents and install hooks
	const adapters = getAvailableAdapters();
	let adaptersToEnable: AgentAdapter[];

	if (adapters.length > 1) {
		const agentOptions = adapters.map((a) => ({
			value: a,
			label: a.name,
			hint: a.isHookInstalled() ? "already enabled" : undefined,
		}));
		const selectedAdapters = await p.multiselect({
			message: "Select agents to enable auto-upload for",
			options: agentOptions,
			initialValues: adapters,
			required: true,
		});

		if (p.isCancel(selectedAdapters)) {
			p.cancel("Setup cancelled.");
			return;
		}
		adaptersToEnable = selectedAdapters;
	} else {
		adaptersToEnable = adapters;
	}

	for (const adapter of adaptersToEnable) {
		if (adapter.isHookInstalled()) {
			p.log.info(
				`${adapter.name}: Auto-upload hook is already enabled. Organization updated.`,
			);
		} else {
			adapter.installHook();
			p.log.success(
				`${adapter.name}: Auto-upload hook enabled in ${adapter.getHookConfigPath()}`,
			);
		}
	}

	// Check for existing sessions to upload (including other checkouts of the same repo)
	const endpoint = `${credentials.apiBaseUrl}/rpc`;
	let totalFailed = 0;

	const enabledSources = new Set(adaptersToEnable.map((a) => a.source));
	const { groups } = await scanAndGroupProjects(cwd);
	const cwdGroup = groups.find((g) => g.containsCwd);
	const matchingProjects = cwdGroup
		? cwdGroup.projects.filter((proj) => enabledSources.has(proj.source))
		: [];
	const totalSessions = matchingProjects.reduce(
		(sum, p) => sum + p.sessionCount,
		0,
	);

	if (totalSessions > 0) {
		const groupLabel = cwdGroup?.displayName ?? "this project";
		const shouldUpload = await p.confirm({
			message: `Found ${totalSessions} previous session(s) for ${groupLabel}. Upload them now?`,
			initialValue: false,
		});

		if (!p.isCancel(shouldUpload) && shouldUpload) {
			const items: BatchUploadItem[] = matchingProjects.flatMap((proj) =>
				proj.sessions.map((session) => ({
					sessionId: session.sessionId,
					label: session.sessionId,
					transcriptPath: session.transcriptPath,
					projectPath: session.projectPath,
					source: proj.source,
					organizationId: selectedOrgId,
				})),
			);

			const summary = await runBatchUpload({
				items,
				label: "Uploading sessions...",
				upload: async (item, onRetry) => {
					const adapter = getAdapter(item.source ?? "claude_code");
					const session = matchingProjects
						.flatMap((proj) => proj.sessions)
						.find((s) => s.sessionId === item.sessionId);
					if (!session) {
						return { success: false, error: "Session not found" };
					}
					const gitInfo = await getGitInfo(session.projectPath);
					const request = await adapter.buildUploadRequest(session, {
						gitInfo,
						organizationId: selectedOrgId,
					});
					return uploadSession(request, {
						endpoint,
						token: credentials.token,
						onRetry,
					});
				},
			});

			renderBatchSummary(summary);
			totalFailed += summary.failed;
		}
	}

	if (totalFailed > 0) {
		p.log.info("Run `rudel upload --retry` to retry failed uploads.");
	}

	p.outro("Done!");

	if (totalFailed > 0) {
		process.exitCode = 1;
	}
}

export const enableCommand = buildCommand({
	loader: async () => ({ default: runEnable }),
	parameters: {},
	docs: {
		brief: "Enable automatic session upload for coding agents",
	},
});
