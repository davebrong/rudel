import { existsSync } from "node:fs";
import { ClaudeCodeAgent } from "./claude-code.js";
import { CodexAgent } from "./codex.js";

export { ClaudeCodeAgent } from "./claude-code.js";
export { CodexAgent } from "./codex.js";
export type { CodingAgent, SessionFile } from "./types.js";

export function getDefaultAgent(): ClaudeCodeAgent {
	return new ClaudeCodeAgent();
}

export function getAllAgents(): Array<ClaudeCodeAgent | CodexAgent> {
	const agents: Array<ClaudeCodeAgent | CodexAgent> = [new ClaudeCodeAgent()];
	const codex = new CodexAgent();
	if (existsSync(codex.getSessionsBaseDir())) {
		agents.push(codex);
	}
	return agents;
}
