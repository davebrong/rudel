import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CODEX_SESSIONS_DIR = join(homedir(), ".codex", "sessions");

export interface CodexSessionMeta {
	id: string;
	cwd: string;
	cliVersion: string;
	modelProvider: string;
	gitBranch?: string;
	gitSha?: string;
}

export interface ScannedCodexSession {
	filePath: string;
	fileName: string;
	meta: CodexSessionMeta;
}

export interface ScannedCodexProject {
	projectPath: string;
	displayPath: string;
	sessions: ScannedCodexSession[];
	sessionCount: number;
}

export async function readCodexSessionMeta(
	filePath: string,
): Promise<CodexSessionMeta | null> {
	try {
		const content = await readFile(filePath, "utf-8");
		const firstLine = content.split("\n")[0];
		if (!firstLine) return null;

		const parsed = JSON.parse(firstLine) as {
			type?: string;
			payload?: {
				id?: string;
				cwd?: string;
				cli_version?: string;
				model_provider?: string;
				git?: { branch?: string; sha?: string };
			};
		};

		if (parsed.type !== "session_meta" || !parsed.payload) return null;

		return {
			id:
				parsed.payload.id ??
				filePath
					.split("/")
					.pop()
					?.replace(/\.jsonl$/, "") ??
				"",
			cwd: parsed.payload.cwd ?? "",
			cliVersion: parsed.payload.cli_version ?? "",
			modelProvider: parsed.payload.model_provider ?? "",
			gitBranch: parsed.payload.git?.branch,
			gitSha: parsed.payload.git?.sha,
		};
	} catch {
		return null;
	}
}

async function walkJsonlFiles(dir: string): Promise<string[]> {
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
			const nested = await walkJsonlFiles(fullPath);
			results.push(...nested);
		}
	}

	return results;
}

export async function scanCodexSessions(): Promise<ScannedCodexProject[]> {
	const files = await walkJsonlFiles(CODEX_SESSIONS_DIR);
	const home = homedir();
	const projectMap = new Map<string, ScannedCodexSession[]>();

	for (const filePath of files) {
		const meta = await readCodexSessionMeta(filePath);
		if (!meta || !meta.cwd) continue;

		const sessions = projectMap.get(meta.cwd) ?? [];
		sessions.push({
			filePath,
			fileName: filePath.split("/").pop() ?? "",
			meta,
		});
		projectMap.set(meta.cwd, sessions);
	}

	const projects: ScannedCodexProject[] = [];
	for (const [projectPath, sessions] of projectMap) {
		const displayPath = projectPath.startsWith(home)
			? `~${projectPath.slice(home.length)}`
			: projectPath;

		projects.push({
			projectPath,
			displayPath,
			sessions,
			sessionCount: sessions.length,
		});
	}

	return projects.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
}
