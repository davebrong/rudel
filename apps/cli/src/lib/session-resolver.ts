import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

const SESSIONS_BASE_DIR = join(homedir(), ".claude", "projects");

export interface SessionInfo {
	transcriptPath: string;
	projectPath: string;
	sessionDir: string;
	sessionId: string;
}

/**
 * Resolve a session from either a session ID or a full file path.
 * Validates that the file is a main session (not a subagent file).
 */
export async function resolveSession(input: string): Promise<SessionInfo> {
	const isPath = input.includes("/") || input.endsWith(".jsonl");

	if (isPath) {
		return resolveFromPath(input);
	}
	return resolveFromId(input);
}

async function resolveFromPath(filePath: string): Promise<SessionInfo> {
	const filename = basename(filePath);
	validateNotSubagent(filename);

	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		throw new Error(`Session file not found: ${filePath}`);
	}

	const sessionId = filename.replace(/\.jsonl$/, "");
	const sessionDir = dirname(filePath);

	// Walk up from sessionDir to find the project directory name
	// Sessions live at: ~/.claude/projects/<encoded-project-dir>/<sessionId>.jsonl
	const parentDir = basename(sessionDir);
	const projectPath = await decodeProjectPath(parentDir);

	return { transcriptPath: filePath, projectPath, sessionDir, sessionId };
}

async function resolveFromId(sessionId: string): Promise<SessionInfo> {
	validateNotSubagent(`${sessionId}.jsonl`);
	const sessionFileName = `${sessionId}.jsonl`;

	let projectDirs: string[];
	try {
		projectDirs = await readdir(SESSIONS_BASE_DIR);
	} catch {
		throw new Error(`Session not found: ${sessionId}`);
	}

	for (const projectDir of projectDirs) {
		const sessionDir = join(SESSIONS_BASE_DIR, projectDir);
		try {
			const files = await readdir(sessionDir);
			if (files.includes(sessionFileName)) {
				const transcriptPath = join(sessionDir, sessionFileName);
				const projectPath = await decodeProjectPath(projectDir);
				return {
					transcriptPath,
					projectPath,
					sessionDir,
					sessionId,
				};
			}
		} catch {}
	}

	throw new Error(`Session not found: ${sessionId}`);
}

function validateNotSubagent(filename: string): void {
	if (filename.startsWith("agent-") && filename.endsWith(".jsonl")) {
		throw new Error(
			"This is a subagent file, not a main session. Please provide the main session ID or path.",
		);
	}
}

/**
 * Decode an encoded project directory name back to the actual filesystem path.
 * Handles directory names that contain dashes by checking if paths exist.
 *
 * Example: "-Users-marc-Workspace-claude-marketplace" -> "/Users/marc/Workspace/claude-marketplace"
 */
export async function decodeProjectPath(encodedDir: string): Promise<string> {
	const parts = encodedDir.replace(/^-/, "").split("-");

	async function findPath(
		partIndex: number,
		currentPath: string,
	): Promise<string | null> {
		if (partIndex >= parts.length) {
			try {
				await stat(currentPath);
				return currentPath;
			} catch {
				return null;
			}
		}

		for (let endIndex = parts.length; endIndex > partIndex; endIndex--) {
			const segment = parts.slice(partIndex, endIndex).join("-");
			const testPath = currentPath
				? `${currentPath}/${segment}`
				: `/${segment}`;

			try {
				await stat(testPath);
				if (endIndex === parts.length) {
					return testPath;
				}
				const result = await findPath(endIndex, testPath);
				if (result) {
					return result;
				}
			} catch {
				// Path doesn't exist, try shorter segment
			}
		}

		return null;
	}

	const result = await findPath(0, "");
	if (result) {
		return result;
	}

	// Fallback: simple dash-to-slash replacement
	return `/${parts.join("/")}`;
}
