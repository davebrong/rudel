export {
	claudeCodeAdapter,
	decodeProjectPath,
	extractAgentIds,
	readSubagentFiles,
} from "./adapters/claude-code/index.js";
export {
	codexAdapter,
	findActiveRolloutFile,
	readCodexSessionMeta,
} from "./adapters/codex/index.js";
export {
	getAdapter,
	getAllAdapters,
	getAvailableAdapters,
	registerAdapter,
} from "./registry.js";
export type {
	AgentAdapter,
	GitInfo,
	GroupedProjects,
	IngestContext,
	ScannedProject,
	SessionFile,
	UploadContext,
} from "./types.js";
export {
	groupProjectsForCwd,
	readFileWithRetry,
	toClickHouseDateTime,
	toDisplayPath,
	walkJsonlFiles,
} from "./utils.js";

// Auto-register adapters
import { claudeCodeAdapter } from "./adapters/claude-code/index.js";
import { codexAdapter } from "./adapters/codex/index.js";
import { registerAdapter } from "./registry.js";

registerAdapter(claudeCodeAdapter);
registerAdapter(codexAdapter);
