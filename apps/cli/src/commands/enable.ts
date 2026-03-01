import { dirname } from "node:path";
import { createInterface } from "node:readline";
import { buildCommand } from "@stricli/core";
import { getDefaultAgent } from "../lib/agents/index.js";
import { createApiClient } from "../lib/api-client.js";
import { verifyAuth } from "../lib/auth.js";
import { getGitInfo } from "../lib/git-info.js";
import { getProjectOrgId, setProjectOrgId } from "../lib/project-config.js";
import { readSubagentFiles } from "../lib/subagent-reader.js";
import { extractAgentIds, readTranscript } from "../lib/transcript-reader.js";
import type { IngestRequest } from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";

async function promptChoice(question: string, max: number): Promise<number> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			const num = Number.parseInt(answer.trim(), 10);
			if (Number.isNaN(num) || num < 1 || num > max) {
				resolve(1);
			} else {
				resolve(num);
			}
		});
	});
}

async function promptYesNo(question: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === "y");
		});
	});
}

async function runEnable(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	// Verify auth (loads credentials + pings API)
	const auth = await verifyAuth();
	if (!auth.authenticated) {
		writeError(`Error: ${auth.message}`);
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
		writeError("Error: Failed to fetch organizations. Check your connection.");
		process.exitCode = 1;
		return;
	}

	if (orgs.length === 0) {
		writeError(
			"Error: No organizations found. Create one at app.rudel.ai first.",
		);
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
		write(`Using organization: ${firstOrg.name}`);
	} else if (existingOrg) {
		write(`Currently configured for: ${existingOrg.name}`);
		selectedOrgId = existingOrg.id;
	} else {
		write("Select an organization for this repository:");
		for (const [i, org] of orgs.entries()) {
			write(`  ${i + 1}. ${org.name} (${org.slug})`);
		}
		const choice = await promptChoice(
			`Choice [1-${orgs.length}]: `,
			orgs.length,
		);
		const selected = orgs[choice - 1] ?? orgs[0];
		if (!selected) return;
		selectedOrgId = selected.id;
		write(`Selected: ${selected.name}`);
	}

	await setProjectOrgId(cwd, selectedOrgId);

	// Install hook via agent abstraction
	const agent = getDefaultAgent();

	if (agent.isHookInstalled()) {
		write("Auto-upload hook is already enabled. Organization updated.");
	} else {
		agent.installHook();
		write(`Auto-upload hook enabled in ${agent.getHookSettingsPath()}`);
	}

	// Check for existing sessions to upload
	const sessions = await agent.findProjectSessions(cwd);
	if (sessions.length === 0) return;

	const shouldUpload = await promptYesNo(
		`Found ${sessions.length} previous session(s). Upload them now? [y/N] `,
	);
	if (!shouldUpload) return;

	const endpoint = `${credentials.apiBaseUrl}/rpc`;

	for (const [i, session] of sessions.entries()) {
		const label = `[${i + 1}/${sessions.length}]`;
		try {
			const content = await readTranscript(session.transcriptPath);
			const agentIds = extractAgentIds(content);
			const sessionDir = dirname(session.transcriptPath);
			const subagents =
				agentIds.length > 0
					? await readSubagentFiles(sessionDir, agentIds, session.sessionId)
					: [];
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

			const result = await uploadSession(request, {
				endpoint,
				token: credentials.token,
			});

			if (result.success) {
				write(`${label} Uploaded ${session.sessionId}`);
			} else {
				writeError(`${label} Failed ${session.sessionId}: ${result.error}`);
			}
		} catch (error) {
			writeError(
				`${label} Error ${session.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

export const enableCommand = buildCommand({
	loader: async () => ({ default: runEnable }),
	parameters: {},
	docs: {
		brief: "Enable automatic session upload via Claude Code hook",
	},
});
