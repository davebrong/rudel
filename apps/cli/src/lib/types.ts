export type SessionTag =
	| "research"
	| "new_feature"
	| "bug_fix"
	| "refactoring"
	| "documentation"
	| "tests"
	| "other";

export const SESSION_TAGS: readonly SessionTag[] = [
	"research",
	"new_feature",
	"bug_fix",
	"refactoring",
	"documentation",
	"tests",
	"other",
] as const;

export interface SubagentFile {
	agentId: string;
	content: string;
}

export interface IngestRequest {
	sessionId: string;
	projectPath: string;
	repository?: string;
	gitBranch?: string;
	gitSha?: string;
	tag?: SessionTag;
	content: string;
	subagents?: SubagentFile[];
}

export interface UploadResult {
	success: boolean;
	status?: number;
	error?: string;
}

export const DEFAULT_ENDPOINT = "https://app.rudel.ai/rpc";
