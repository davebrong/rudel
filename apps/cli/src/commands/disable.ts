import { buildCommand } from "@stricli/core";
import { getDefaultAgent } from "../lib/agents/index.js";

async function runDisable(): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const agent = getDefaultAgent();

	if (!agent.isHookInstalled()) {
		write("Auto-upload hook is not enabled.");
		return;
	}

	agent.removeHook();
	write(`Auto-upload hook removed from ${agent.getHookSettingsPath()}`);
}

export const disableCommand = buildCommand({
	loader: async () => ({ default: runDisable }),
	parameters: {},
	docs: {
		brief: "Disable automatic session upload",
	},
});
