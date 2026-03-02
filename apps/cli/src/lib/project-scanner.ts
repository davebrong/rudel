import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { getGitRemoteUrl } from "./git-info.js";
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

export interface ProjectGroup {
	displayName: string;
	gitRemote: string | null;
	projects: ScannedProject[];
	totalSessions: number;
	containsCwd: boolean;
}

function normalizeRemoteUrl(url: string): string {
	return url
		.replace(/^(https?:\/\/|git@|ssh:\/\/)/, "")
		.replace(/:/, "/")
		.replace(/\.git$/, "");
}

function extractDisplayName(normalized: string): string {
	// "github.com/owner/repo" → "owner/repo"
	const parts = normalized.split("/");
	if (parts.length >= 3) {
		return parts.slice(1).join("/");
	}
	return normalized;
}

export async function groupProjectsByRemote(
	projects: ScannedProject[],
	cwd: string,
): Promise<ProjectGroup[]> {
	const remotes = await Promise.all(
		projects.map((p) => getGitRemoteUrl(p.decodedPath)),
	);

	const grouped = new Map<
		string,
		{ remote: string; projects: ScannedProject[] }
	>();
	const ungrouped: ScannedProject[] = [];

	for (let i = 0; i < projects.length; i++) {
		const project = projects[i] as ScannedProject;
		const remote = remotes[i];

		if (!remote) {
			ungrouped.push(project);
			continue;
		}

		const normalized = normalizeRemoteUrl(remote);
		const existing = grouped.get(normalized);
		if (existing) {
			existing.projects.push(project);
		} else {
			grouped.set(normalized, { remote: normalized, projects: [project] });
		}
	}

	const groups: ProjectGroup[] = [];

	for (const [, entry] of grouped) {
		const containsCwd = entry.projects.some(
			(p) => cwd === p.decodedPath || cwd.startsWith(`${p.decodedPath}/`),
		);
		groups.push({
			displayName: extractDisplayName(entry.remote),
			gitRemote: entry.remote,
			projects: entry.projects,
			totalSessions: entry.projects.reduce((s, p) => s + p.sessionCount, 0),
			containsCwd,
		});
	}

	// Second pass: match ungrouped projects to existing groups by path similarity.
	// Deleted Conductor workspaces have no git remote, but share a path prefix
	// (e.g. ~/conductor/workspaces/rudel/) with existing workspaces that do.
	const homeSegments = homedir().split("/").length;
	const remainingUngrouped: ScannedProject[] = [];

	for (const project of ungrouped) {
		const match = findBestGroupByPath(project, groups, homeSegments);
		if (match) {
			match.projects.push(project);
			match.totalSessions += project.sessionCount;
			if (
				cwd === project.decodedPath ||
				cwd.startsWith(`${project.decodedPath}/`)
			) {
				match.containsCwd = true;
			}
		} else {
			remainingUngrouped.push(project);
		}
	}

	for (const project of remainingUngrouped) {
		const containsCwd =
			cwd === project.decodedPath || cwd.startsWith(`${project.decodedPath}/`);
		groups.push({
			displayName: project.displayPath,
			gitRemote: null,
			projects: [project],
			totalSessions: project.sessionCount,
			containsCwd,
		});
	}

	groups.sort((a, b) => {
		if (a.containsCwd !== b.containsCwd) return a.containsCwd ? -1 : 1;
		const aHasRemote = a.gitRemote !== null;
		const bHasRemote = b.gitRemote !== null;
		if (aHasRemote !== bHasRemote) return aHasRemote ? -1 : 1;
		return a.displayName.localeCompare(b.displayName);
	});

	return groups;
}

function commonPrefixLength(a: string, b: string): number {
	const partsA = a.split("/");
	const partsB = b.split("/");
	let count = 0;
	for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
		if (partsA[i] === partsB[i]) count++;
		else break;
	}
	return count;
}

function findBestGroupByPath(
	project: ScannedProject,
	groups: ProjectGroup[],
	homeSegments: number,
): ProjectGroup | null {
	let bestGroup: ProjectGroup | null = null;
	let bestLen = 0;
	let secondBestLen = 0;

	for (const group of groups) {
		if (!group.gitRemote) continue;

		let groupBest = 0;
		for (const p of group.projects) {
			groupBest = Math.max(
				groupBest,
				commonPrefixLength(project.decodedPath, p.decodedPath),
			);
		}

		if (groupBest > bestLen) {
			secondBestLen = bestLen;
			bestLen = groupBest;
			bestGroup = group;
		} else if (groupBest > secondBestLen) {
			secondBestLen = groupBest;
		}
	}

	// Must extend beyond home dir AND be strictly better than second-best
	if (bestGroup && bestLen > homeSegments && bestLen > secondBestLen) {
		return bestGroup;
	}
	return null;
}
