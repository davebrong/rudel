import { createInterface } from "node:readline";
import { buildCommand } from "@stricli/core";
import { createApiClient } from "../lib/api-client.js";
import { loadCredentials } from "../lib/credentials.js";
import { getProjectOrgId, setProjectOrgId } from "../lib/project-config.js";

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

async function runSetOrg(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	const credentials = loadCredentials();
	if (!credentials) {
		writeError("Error: Not authenticated. Run `rudel login` first.");
		process.exitCode = 1;
		return;
	}

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

	const cwd = process.cwd();
	const currentOrgId = await getProjectOrgId(cwd);
	const currentOrg = currentOrgId
		? orgs.find((o) => o.id === currentOrgId)
		: undefined;

	if (currentOrg) {
		write(`Current organization: ${currentOrg.name} (${currentOrg.slug})`);
	}

	write("Select an organization for this repository:");
	for (const [i, org] of orgs.entries()) {
		const marker = org.id === currentOrgId ? " (current)" : "";
		write(`  ${i + 1}. ${org.name} (${org.slug})${marker}`);
	}

	const choice = await promptChoice(`Choice [1-${orgs.length}]: `, orgs.length);
	const selected = orgs[choice - 1] ?? orgs[0];
	if (!selected) return;
	await setProjectOrgId(cwd, selected.id);
	write(`Organization set to: ${selected.name}`);
}

export const setOrgCommand = buildCommand({
	loader: async () => ({ default: runSetOrg }),
	parameters: {},
	docs: {
		brief: "Set the organization for the current repository",
	},
});
