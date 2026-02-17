import { buildCommand } from "@stricli/core";
import { loadCredentials } from "../lib/credentials.js";

async function runWhoami(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	const credentials = loadCredentials();
	if (!credentials) {
		write("Not logged in. Run `rudel login` to authenticate.");
		return;
	}

	const response = await fetch(`${credentials.apiBaseUrl}/rpc/me`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${credentials.token}`,
		},
		body: JSON.stringify({}),
	});

	if (!response.ok) {
		writeError(
			"Session expired or invalid. Run `rudel login` to re-authenticate.",
		);
		process.exitCode = 1;
		return;
	}

	const body = (await response.json()) as {
		json: { id: string; email: string; name: string };
	};
	write(`Logged in as ${body.json.name} (${body.json.email})`);
}

export const whoamiCommand = buildCommand({
	loader: async () => ({ default: runWhoami }),
	parameters: {},
	docs: {
		brief: "Show the currently authenticated user",
	},
});
