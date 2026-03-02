import * as p from "@clack/prompts";
import { type AgentAdapter, getAvailableAdapters } from "@rudel/agent-adapters";
import { buildCommand } from "@stricli/core";
import { createApiClient } from "../lib/api-client.js";
import { verifyAuth } from "../lib/auth.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId, setProjectOrgId } from "../lib/project-config.js";
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

	// Check for existing sessions to upload from all enabled agents
	const endpoint = `${credentials.apiBaseUrl}/rpc`;
	let totalFailed = 0;

	for (const adapter of adaptersToEnable) {
		const sessions = await adapter.findProjectSessions(cwd);
		if (sessions.length === 0) continue;

		const shouldUpload = await p.confirm({
			message: `Found ${sessions.length} previous ${adapter.name} session(s). Upload them now?`,
			initialValue: false,
		});

		if (p.isCancel(shouldUpload) || !shouldUpload) continue;

		const gitInfo = await getGitInfo(cwd);
		let failed = 0;

		await p.tasks(
			sessions.map((session, i) => ({
				title: `[${i + 1}/${sessions.length}] ${session.sessionId}`,
				task: async (message: (msg: string) => void) => {
					try {
						message("Building upload request...");
						const request = await adapter.buildUploadRequest(session, {
							gitInfo,
							organizationId: selectedOrgId,
						});

						message("Uploading...");
						const result = await uploadSession(request, {
							endpoint,
							token: credentials.token,
						});

						if (result.success) return "Uploaded";
						failed++;
						return `Failed: ${result.error}`;
					} catch (error) {
						failed++;
						return `Error: ${error instanceof Error ? error.message : String(error)}`;
					}
				},
			})),
		);

		if (failed > 0) {
			p.log.error(`${failed} ${adapter.name} session(s) failed`);
			totalFailed += failed;
		}
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
