import { buildCommand } from "@stricli/core";
import { verifyAuth } from "../lib/auth.js";

async function runWhoami(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	const result = await verifyAuth();
	if (!result.authenticated) {
		if (result.reason === "no_credentials") {
			write("Not logged in. Run `rudel login` to authenticate.");
		} else {
			writeError(`Error: ${result.message}`);
			process.exitCode = 1;
		}
		return;
	}

	write(`Logged in as ${result.user.name} (${result.user.email})`);
}

export const whoamiCommand = buildCommand({
	loader: async () => ({ default: runWhoami }),
	parameters: {},
	docs: {
		brief: "Show the currently authenticated user",
	},
});
