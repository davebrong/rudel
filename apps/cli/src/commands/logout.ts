import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { clearCredentials, loadCredentials } from "../lib/credentials.js";

async function runLogout(): Promise<void> {
	const credentials = loadCredentials();
	if (!credentials) {
		p.log.info("Not logged in.");
		return;
	}

	clearCredentials();
	p.log.success("Logged out successfully.");
}

export const logoutCommand = buildCommand({
	loader: async () => ({ default: runLogout }),
	parameters: {},
	docs: {
		brief: "Log out and remove stored credentials",
	},
});
