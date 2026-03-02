import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { getAllAgents } from "../lib/agents/index.js";

async function runDisable(): Promise<void> {
	const agents = getAllAgents();
	let anyDisabled = false;

	for (const agent of agents) {
		if (agent.isHookInstalled()) {
			agent.removeHook();
			p.log.success(
				`${agent.name}: Auto-upload hook removed from ${agent.getHookSettingsPath()}`,
			);
			anyDisabled = true;
		}
	}

	if (!anyDisabled) {
		p.log.info("No auto-upload hooks are enabled.");
	}
}

export const disableCommand = buildCommand({
	loader: async () => ({ default: runDisable }),
	parameters: {},
	docs: {
		brief: "Disable automatic session upload",
	},
});
