import { buildCommand } from "@stricli/core";
import {
	addHook,
	getClaudeSettingsPath,
	isHookEnabled,
} from "../lib/claude-settings.js";
import { loadCredentials } from "../lib/credentials.js";

async function runEnable(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	const credentials = loadCredentials();
	if (!credentials) {
		writeError("Error: Not authenticated. Run `rudel login` first.");
		process.exitCode = 1;
		return;
	}

	if (isHookEnabled()) {
		write("Auto-upload hook is already enabled.");
		return;
	}

	addHook();
	write(`Auto-upload hook enabled in ${getClaudeSettingsPath()}`);
}

export const enableCommand = buildCommand({
	loader: async () => ({ default: runEnable }),
	parameters: {},
	docs: {
		brief: "Enable automatic session upload via Claude Code hook",
	},
});
