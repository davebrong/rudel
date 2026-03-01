import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	addHook,
	getClaudeSettingsPath,
	isHookEnabled,
	removeHook,
} from "../claude-settings.js";
import { decodeProjectPath } from "../session-resolver.js";
import type { CodingAgent, SessionFile } from "./types.js";

const SESSIONS_BASE_DIR = join(homedir(), ".claude", "projects");

function encodeProjectPath(projectPath: string): string {
	return projectPath.replace(/\//g, "-");
}

export class ClaudeCodeAgent implements CodingAgent {
	name = "Claude Code";

	installHook(): void {
		addHook();
	}

	removeHook(): void {
		removeHook();
	}

	isHookInstalled(): boolean {
		return isHookEnabled();
	}

	getHookSettingsPath(): string {
		return getClaudeSettingsPath();
	}

	getSessionsBaseDir(): string {
		return SESSIONS_BASE_DIR;
	}

	async findProjectSessions(projectPath: string): Promise<SessionFile[]> {
		const encoded = encodeProjectPath(projectPath);
		const sessionDir = join(SESSIONS_BASE_DIR, encoded);

		const files = await this.listSessionFiles(sessionDir, projectPath);
		if (files.length > 0) return files;

		// Fallback: iterate all project dirs and decode to find matches
		return this.findByDecoding(projectPath);
	}

	private async listSessionFiles(
		sessionDir: string,
		projectPath: string,
	): Promise<SessionFile[]> {
		try {
			const entries = await readdir(sessionDir);
			return entries
				.filter((f) => f.endsWith(".jsonl") && !f.startsWith("agent-"))
				.map((f) => ({
					sessionId: f.replace(/\.jsonl$/, ""),
					transcriptPath: join(sessionDir, f),
					projectPath,
				}));
		} catch {
			return [];
		}
	}

	private async findByDecoding(projectPath: string): Promise<SessionFile[]> {
		let projectDirs: string[];
		try {
			projectDirs = await readdir(SESSIONS_BASE_DIR);
		} catch {
			return [];
		}

		for (const dir of projectDirs) {
			try {
				const decoded = await decodeProjectPath(dir);
				if (decoded === projectPath) {
					const sessionDir = join(SESSIONS_BASE_DIR, dir);
					return this.listSessionFiles(sessionDir, projectPath);
				}
			} catch {
				// skip undecodable dirs
			}
		}

		return [];
	}
}
