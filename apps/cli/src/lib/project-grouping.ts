import { homedir } from "node:os";
import {
	getAvailableAdapters,
	type ScannedProject,
} from "@rudel/agent-adapters";
import { getGitRemoteUrl, normalizeRemoteUrl } from "./git-info.js";
import {
	cacheRemote,
	cacheRemotes,
	getCachedRemote,
	getRemoteCache,
} from "./remote-cache.js";

export interface ScanResult {
	projects: ScannedProject[];
	groups: ProjectGroup[];
}

export async function scanAndGroupProjects(
	cwd: string = process.cwd(),
): Promise<ScanResult> {
	const adapters = getAvailableAdapters();
	const projects: ScannedProject[] = [];
	for (const adapter of adapters) {
		const scanned = await adapter.scanAllSessions();
		projects.push(...scanned);
	}
	const groups = await groupProjectsByRemote(projects, cwd);
	return { projects, groups };
}

export interface ProjectGroup {
	displayName: string;
	gitRemote: string | null;
	projects: ScannedProject[];
	totalSessions: number;
	containsCwd: boolean;
}

function extractDisplayName(normalized: string): string {
	// "github.com/owner/repo" → "owner/repo"
	const parts = normalized.split("/");
	if (parts.length >= 3) {
		return parts.slice(1).join("/");
	}
	return normalized;
}

function encodeProjectPath(projectPath: string): string {
	return projectPath.replace(/\//g, "-");
}

/**
 * Extract the conductor project root from a workspace path.
 * e.g. "/Users/marc/conductor/workspaces/chkit/karachi" → "chkit"
 * Returns null for non-conductor paths.
 */
function getConductorProjectName(projectPath: string): string | null {
	const marker = "/conductor/workspaces/";
	const idx = projectPath.indexOf(marker);
	if (idx === -1) return null;
	const afterWorkspaces = projectPath.slice(idx + marker.length);
	const firstSegment = afterWorkspaces.split("/")[0];
	return firstSegment || null;
}

export async function groupProjectsByRemote(
	projects: ScannedProject[],
	cwd: string,
): Promise<ProjectGroup[]> {
	const cache = await getRemoteCache();
	let cacheUpdated = false;

	const remotes: (string | null | undefined)[] = await Promise.all(
		projects.map((p) => getGitRemoteUrl(p.projectPath)),
	);

	// Share resolved remotes across conductor workspaces with the same project name.
	// If ~/conductor/workspaces/chkit/karachi resolved a remote but
	// ~/conductor/workspaces/chkit/houston didn't (deleted), reuse it.
	const conductorRemotes = new Map<string, string>();
	for (let i = 0; i < projects.length; i++) {
		const remote = remotes[i];
		if (!remote) continue;
		const name = getConductorProjectName(
			(projects[i] as ScannedProject).projectPath,
		);
		if (name && !conductorRemotes.has(name)) {
			conductorRemotes.set(name, normalizeRemoteUrl(remote));
		}
	}
	for (let i = 0; i < projects.length; i++) {
		if (remotes[i]) continue;
		const name = getConductorProjectName(
			(projects[i] as ScannedProject).projectPath,
		);
		if (name) {
			remotes[i] = conductorRemotes.get(name);
		}
	}

	const grouped = new Map<
		string,
		{ remote: string; projects: ScannedProject[] }
	>();
	const ungrouped: ScannedProject[] = [];

	for (let i = 0; i < projects.length; i++) {
		const project = projects[i] as ScannedProject;
		const remote = remotes[i];

		if (remote) {
			const normalized = normalizeRemoteUrl(remote);
			const encodedDir = encodeProjectPath(project.projectPath);
			// Cache newly resolved remotes
			if (getCachedRemote(cache, encodedDir) !== normalized) {
				cacheRemote(cache, encodedDir, normalized);
				cacheUpdated = true;
			}
			const existing = grouped.get(normalized);
			if (existing) {
				existing.projects.push(project);
			} else {
				grouped.set(normalized, { remote: normalized, projects: [project] });
			}
		} else {
			// Try cache for ungrouped projects
			const encodedDir = encodeProjectPath(project.projectPath);
			const cached = getCachedRemote(cache, encodedDir);
			if (cached) {
				const existing = grouped.get(cached);
				if (existing) {
					existing.projects.push(project);
				} else {
					grouped.set(cached, { remote: cached, projects: [project] });
				}
			} else {
				ungrouped.push(project);
			}
		}
	}

	const groups: ProjectGroup[] = [];

	for (const [, entry] of grouped) {
		const containsCwd = entry.projects.some(
			(p) => cwd === p.projectPath || cwd.startsWith(`${p.projectPath}/`),
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
	const homeSegments = homedir().split("/").length;
	const remainingUngrouped: ScannedProject[] = [];

	for (const project of ungrouped) {
		const match =
			findGroupByConductorName(project, groups) ??
			findBestGroupByPath(project, groups, homeSegments);
		if (match) {
			addProjectToGroup(match, project, cwd);
		} else {
			remainingUngrouped.push(project);
		}
	}

	// Third pass: group remaining conductor workspaces that share a project name,
	// and merge non-conductor projects whose last path segment matches.
	const conductorNames = new Set<string>();
	for (const project of remainingUngrouped) {
		const name = getConductorProjectName(project.projectPath);
		if (name) conductorNames.add(name);
	}

	const finalUngrouped: ScannedProject[] = [];
	for (const project of remainingUngrouped) {
		const conductorName = getConductorProjectName(project.projectPath);
		const lastSegment = project.projectPath.split("/").pop();
		const matchName = conductorName ?? lastSegment;

		// Find an existing ungrouped-conductor group or a matching last-segment group
		const existing = matchName
			? groups.find(
					(g) =>
						!g.gitRemote &&
						g.projects.some((p) => {
							const pName = getConductorProjectName(p.projectPath);
							const pLast = p.projectPath.split("/").pop();
							return pName === matchName || pLast === matchName;
						}),
				)
			: null;

		if (existing) {
			addProjectToGroup(existing, project, cwd);
		} else if (
			conductorName ||
			(lastSegment && conductorNames.has(lastSegment))
		) {
			// Create a new group — more conductor siblings or non-conductor matches will join it
			const containsCwd =
				cwd === project.projectPath ||
				cwd.startsWith(`${project.projectPath}/`);
			groups.push({
				displayName: project.displayPath,
				gitRemote: null,
				projects: [project],
				totalSessions: project.sessionCount,
				containsCwd,
			});
		} else {
			finalUngrouped.push(project);
		}
	}

	for (const project of finalUngrouped) {
		const containsCwd =
			cwd === project.projectPath || cwd.startsWith(`${project.projectPath}/`);
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

	// Fire-and-forget cache write
	if (cacheUpdated) {
		cacheRemotes(cache);
	}

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
				commonPrefixLength(project.projectPath, p.projectPath),
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

/**
 * Match a conductor workspace to an existing group by its project name.
 * e.g. ~/conductor/workspaces/chx/jackson matches a group containing ~/Workspace/chx.
 */
function findGroupByConductorName(
	project: ScannedProject,
	groups: ProjectGroup[],
): ProjectGroup | null {
	const name = getConductorProjectName(project.projectPath);
	if (!name) return null;

	for (const group of groups) {
		for (const p of group.projects) {
			// Match if a grouped project's last path segment equals the conductor name
			const lastSegment = p.projectPath.split("/").pop();
			if (lastSegment === name) return group;
			// Also match if it's another conductor workspace with the same name
			if (getConductorProjectName(p.projectPath) === name) return group;
		}
	}
	return null;
}

function addProjectToGroup(
	group: ProjectGroup,
	project: ScannedProject,
	cwd: string,
): void {
	group.projects.push(project);
	group.totalSessions += project.sessionCount;
	if (
		cwd === project.projectPath ||
		cwd.startsWith(`${project.projectPath}/`)
	) {
		group.containsCwd = true;
	}
}
