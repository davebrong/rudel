import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { getAllAgents } from "../lib/agents/index.js";
import type { CodingAgent } from "../lib/agents/types.js";
import { createApiClient } from "../lib/api-client.js";
import { verifyAuth } from "../lib/auth.js";
import {
	type IngestCodexRequest,
	uploadCodexSession,
} from "../lib/codex-uploader.js";
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

	// Detect available agents and install hooks
	const agents = getAllAgents();
	let agentsToEnable: CodingAgent[];

	if (agents.length > 1) {
		const agentOptions: Array<{
			value: CodingAgent;
			label: string;
			hint?: string;
		}> = agents.map((a) => ({
			value: a as CodingAgent,
			label: a.name,
			hint: a.isHookInstalled() ? "already enabled" : undefined,
		}));
		const selectedAgents = await p.multiselect({
			message: "Select agents to enable auto-upload for",
			options: agentOptions,
			initialValues: agents as CodingAgent[],
			required: true,
		});

		if (p.isCancel(selectedAgents)) {
			p.cancel("Setup cancelled.");
			return;
		}
		agentsToEnable = selectedAgents;
	} else {
		agentsToEnable = agents;
	}

	for (const agent of agentsToEnable) {
		if (agent.isHookInstalled()) {
			p.log.info(
				`${agent.name}: Auto-upload hook is already enabled. Organization updated.`,
			);
		} else {
			agent.installHook();
			p.log.success(
				`${agent.name}: Auto-upload hook enabled in ${agent.getHookSettingsPath()}`,
			);
		}
	}

	// Check for existing sessions to upload from all enabled agents
	const endpoint = `${credentials.apiBaseUrl}/rpc`;
	let totalFailed = 0;

	for (const agent of agentsToEnable) {
		const sessions = await agent.findProjectSessions(cwd);
		if (sessions.length === 0) continue;

		const shouldUpload = await p.confirm({
			message: `Found ${sessions.length} previous ${agent.name} session(s). Upload them now?`,
			initialValue: false,
		});

		if (p.isCancel(shouldUpload) || !shouldUpload) continue;

		const isCodex = agent.name === "OpenAI Codex";
		let failed = 0;

		await p.tasks(
			sessions.map((session, i) => ({
				title: `[${i + 1}/${sessions.length}] ${session.sessionId}`,
				task: async (message) => {
					message("Reading transcript...");
					try {
						if (isCodex) {
							const content = await readFile(session.transcriptPath, "utf-8");
							message("Resolving git info...");
							const gitInfo = await getGitInfo(session.projectPath);

							const request: IngestCodexRequest = {
								sessionId: session.sessionId,
								projectPath: session.projectPath,
								repository: gitInfo.repository,
								gitBranch: gitInfo.branch,
								gitSha: gitInfo.sha,
								content,
								organizationId: selectedOrgId,
							};

							message("Uploading...");
							const result = await uploadCodexSession(request, {
								endpoint,
								token: credentials.token,
							});

							if (result.success) return "Uploaded";
							failed++;
							return `Failed: ${result.error}`;
						}

						const content = await readTranscript(session.transcriptPath);
						const agentIds = extractAgentIds(content);
						const sessionDir = dirname(session.transcriptPath);
						const subagents =
							agentIds.length > 0
								? await readSubagentFiles(
										sessionDir,
										agentIds,
										session.sessionId,
									)
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
			p.log.error(`${failed} ${agent.name} session(s) failed`);
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
