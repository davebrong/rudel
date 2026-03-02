import { dirname } from "node:path";
import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { getDefaultAgent } from "../lib/agents/index.js";
import { createApiClient } from "../lib/api-client.js";
import { verifyAuth } from "../lib/auth.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId, setProjectOrgId } from "../lib/project-config.js";
import { findSessionsForCwd } from "../lib/project-scanner.js";
import { readSubagentFiles } from "../lib/subagent-reader.js";
import { extractAgentIds, readTranscript } from "../lib/transcript-reader.js";
import type { IngestRequest } from "../lib/types.js";
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

	// Install hook via agent abstraction
	const agent = getDefaultAgent();

	if (agent.isHookInstalled()) {
		p.log.info("Auto-upload hook is already enabled. Organization updated.");
	} else {
		agent.installHook();
		p.log.success(`Auto-upload hook enabled in ${agent.getHookSettingsPath()}`);
	}

	// Check for existing sessions to upload (uses same scan logic as `upload`)
	const sessions = await findSessionsForCwd(cwd);
	if (sessions.length === 0) {
		p.outro("Done!");
		return;
	}

	const shouldUpload = await p.confirm({
		message: `Found ${sessions.length} previous session(s). Upload them now?`,
		initialValue: false,
	});

	if (p.isCancel(shouldUpload) || !shouldUpload) {
		p.outro("Done!");
		return;
	}

	const endpoint = `${credentials.apiBaseUrl}/rpc`;
	let failed = 0;

	await p.tasks(
		sessions.map((session, i) => ({
			title: `[${i + 1}/${sessions.length}] ${session.sessionId}`,
			task: async (message) => {
				message("Reading transcript...");
				try {
					const content = await readTranscript(session.transcriptPath);
					const agentIds = extractAgentIds(content);
					const sessionDir = dirname(session.transcriptPath);
					const subagents =
						agentIds.length > 0
							? await readSubagentFiles(sessionDir, agentIds, session.sessionId)
							: [];

					message("Resolving git info...");
					const gitInfo = await getGitInfo(session.projectPath);

					const request: IngestRequest = {
						sessionId: session.sessionId,
						projectPath: session.projectPath,
						repository: gitInfo.repository,
						gitBranch: gitInfo.branch,
						gitSha: gitInfo.sha,
						content,
						subagents: subagents.length > 0 ? subagents : undefined,
						organizationId: selectedOrgId,
					};

					message("Uploading...");
					const result = await uploadSession(request, {
						endpoint,
						token: credentials.token,
					});

					if (result.success) {
						return "Uploaded";
					}
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
		p.log.error(`${failed} session(s) failed`);
	}

	p.outro("Done!");
}

export const enableCommand = buildCommand({
	loader: async () => ({ default: runEnable }),
	parameters: {},
	docs: {
		brief: "Enable automatic session upload via Claude Code hook",
	},
});
