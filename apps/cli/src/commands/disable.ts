import { buildCommand } from "@stricli/core";
import {
	getClaudeSettingsPath,
	isHookEnabled,
	removeHook,
} from "../lib/claude-settings.js";

async function runDisable(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);

	if (!isHookEnabled()) {
		write("Auto-upload hook is not enabled.");
		return;
	}

	removeHook();
	write(`Auto-upload hook removed from ${getClaudeSettingsPath()}`);
}

export const disableCommand = buildCommand({
	loader: async () => ({ default: runDisable }),
	parameters: {},
	docs: {
		brief: "Disable automatic session upload",
	},
});
