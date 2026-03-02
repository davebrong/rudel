import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { decodeProjectPath, SESSIONS_BASE_DIR } from "./session-resolver.js";

export interface ScannedProject {
	encodedDir: string;
	decodedPath: string;
	displayPath: string;
	sessionDir: string;
	sessionCount: number;
	sessionIds: string[];
}

export interface GroupedProjects {
	current?: ScannedProject;
	subfolders: ScannedProject[];
	others: ScannedProject[];
}

export async function scanProjects(): Promise<ScannedProject[]> {
	let projectDirs: string[];
	try {
		projectDirs = await readdir(SESSIONS_BASE_DIR);
	} catch {
		return [];
	}

	const home = homedir();
	const projects: ScannedProject[] = [];

	for (const dir of projectDirs) {
		const sessionDir = `${SESSIONS_BASE_DIR}/${dir}`;
		let files: string[];
		try {
			files = await readdir(sessionDir);
		} catch {
			continue;
		}

		const sessionIds = files
			.filter((f) => f.endsWith(".jsonl") && !f.startsWith("agent-"))
			.map((f) => f.replace(/\.jsonl$/, ""));

		if (sessionIds.length === 0) continue;

		const decodedPath = await decodeProjectPath(dir);
		const displayPath = decodedPath.startsWith(home)
			? `~${decodedPath.slice(home.length)}`
			: decodedPath;

		projects.push({
			encodedDir: dir,
			decodedPath,
			displayPath,
			sessionDir,
			sessionCount: sessionIds.length,
			sessionIds,
		});
	}

	return projects;
}

export function groupProjectsForCwd(
	projects: ScannedProject[],
	cwd: string,
): GroupedProjects {
	const current = projects.find((p) => p.decodedPath === cwd);
	const subfolders = projects.filter(
		(p) =>
			p !== current &&
			current !== undefined &&
			p.decodedPath.startsWith(`${current.decodedPath}/`),
	);
	const others = projects.filter(
		(p) => p !== current && !subfolders.includes(p),
	);

	subfolders.sort((a, b) => a.decodedPath.localeCompare(b.decodedPath));
	others.sort((a, b) => a.displayPath.localeCompare(b.displayPath));

	return { current, subfolders, others };
}
