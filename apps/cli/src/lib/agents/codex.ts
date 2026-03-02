import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseTOML, stringify as stringifyTOML } from "smol-toml";
import type { CodingAgent, SessionFile } from "./types.js";

const SESSIONS_BASE_DIR = join(homedir(), ".codex", "sessions");
const CONFIG_PATH = join(homedir(), ".codex", "config.toml");
const HOOK_COMMAND = "rudel hooks codex turn-complete";

interface CodexConfig {
	notify?: string[];
	[key: string]: unknown;
}

function readConfig(): CodexConfig {
	if (!existsSync(CONFIG_PATH)) return {};
	const content = readFileSync(CONFIG_PATH, "utf-8");
	return parseTOML(content) as CodexConfig;
}

function writeConfig(config: CodexConfig): void {
	writeFileSync(CONFIG_PATH, stringifyTOML(config));
}

export class CodexAgent implements CodingAgent {
	name = "OpenAI Codex";

	installHook(): void {
		const config = readConfig();
		if (!Array.isArray(config.notify)) {
			config.notify = [];
		}
		if (!config.notify.includes(HOOK_COMMAND)) {
			config.notify.push(HOOK_COMMAND);
		}
		writeConfig(config);
	}

	removeHook(): void {
		const config = readConfig();
		if (!Array.isArray(config.notify)) return;
		config.notify = config.notify.filter((cmd) => cmd !== HOOK_COMMAND);
		if (config.notify.length === 0) {
			delete config.notify;
		}
		writeConfig(config);
	}

	isHookInstalled(): boolean {
		const config = readConfig();
		if (!Array.isArray(config.notify)) return false;
		return config.notify.includes(HOOK_COMMAND);
	}

	getHookSettingsPath(): string {
		return CONFIG_PATH;
	}

	getSessionsBaseDir(): string {
		return SESSIONS_BASE_DIR;
	}

	async findProjectSessions(projectPath: string): Promise<SessionFile[]> {
		const sessions: SessionFile[] = [];

		try {
			const files = await this.walkSessionFiles(SESSIONS_BASE_DIR);
			for (const filePath of files) {
				const meta = await this.readSessionMetaCwd(filePath);
				if (meta === projectPath) {
					const sessionId = this.extractSessionId(filePath);
					sessions.push({
						sessionId,
						transcriptPath: filePath,
						projectPath,
					});
				}
			}
		} catch {
			// sessions dir doesn't exist
		}

		return sessions;
	}

	private async walkSessionFiles(dir: string): Promise<string[]> {
		const results: string[] = [];

		let entries: string[];
		try {
			entries = await readdir(dir);
		} catch {
			return results;
		}

		for (const entry of entries) {
			const fullPath = join(dir, entry);
			if (entry.endsWith(".jsonl")) {
				results.push(fullPath);
			} else if (!entry.includes(".")) {
				const nested = await this.walkSessionFiles(fullPath);
				results.push(...nested);
			}
		}

		return results;
	}

	private async readSessionMetaCwd(filePath: string): Promise<string | null> {
		try {
			const { createReadStream } = await import("node:fs");
			const { createInterface } = await import("node:readline");
			const rl = createInterface({
				input: createReadStream(filePath),
				crlfDelay: Number.POSITIVE_INFINITY,
			});

			for await (const line of rl) {
				try {
					const parsed = JSON.parse(line) as {
						type?: string;
						payload?: { cwd?: string };
					};
					if (parsed.type === "session_meta" && parsed.payload?.cwd) {
						rl.close();
						return parsed.payload.cwd;
					}
				} catch {
					// skip malformed line
				}
				rl.close();
				break;
			}
		} catch {
			// file read error
		}
		return null;
	}

	private extractSessionId(filePath: string): string {
		const fileName = filePath.split("/").pop() ?? "";
		return fileName.replace(/\.jsonl$/, "");
	}
}
