import { buildCommand } from "@stricli/core";
import { clearCredentials, loadCredentials } from "../lib/credentials.js";

async function runLogout(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);

	const credentials = loadCredentials();
	if (!credentials) {
		write("Not logged in.");
		return;
	}

	clearCredentials();
	write("Logged out successfully.");
}

export const logoutCommand = buildCommand({
	loader: async () => ({ default: runLogout }),
	parameters: {},
	docs: {
		brief: "Log out and remove stored credentials",
	},
});
