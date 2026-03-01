import { ClaudeCodeAgent } from "./claude-code.js";

export { ClaudeCodeAgent } from "./claude-code.js";
export type { CodingAgent, SessionFile } from "./types.js";

export function getDefaultAgent(): ClaudeCodeAgent {
	return new ClaudeCodeAgent();
}
