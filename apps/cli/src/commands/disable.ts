import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { getDefaultAgent } from "../lib/agents/index.js";

async function runDisable(): Promise<void> {
	const agent = getDefaultAgent();

	if (!agent.isHookInstalled()) {
		p.log.info("Auto-upload hook is not enabled.");
		return;
	}

	agent.removeHook();
	p.log.success(`Auto-upload hook removed from ${agent.getHookSettingsPath()}`);
}

export const disableCommand = buildCommand({
	loader: async () => ({ default: runDisable }),
	parameters: {},
	docs: {
		brief: "Disable automatic session upload",
	},
});
