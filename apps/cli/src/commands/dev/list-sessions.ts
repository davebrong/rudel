import { buildCommand } from "@stricli/core";
import {
	groupProjectsByRemote,
	scanProjects,
} from "../../lib/project-scanner.js";

async function runListSessions(): Promise<void> {
	const projects = await scanProjects();

	if (projects.length === 0) {
		console.log("No projects with sessions found in ~/.claude/projects/");
		return;
	}

	const cwd = process.cwd();
	const groups = await groupProjectsByRemote(projects, cwd);

	const totalSessions = projects.reduce((s, p) => s + p.sessionCount, 0);
	console.log(`${groups.length} groups, ${totalSessions} sessions\n`);

	for (const group of groups) {
		const current = group.containsCwd ? " [current]" : "";
		if (group.projects.length === 1 && group.projects[0]) {
			console.log(
				`${group.projects[0].displayPath} (${group.totalSessions} sessions)${current}`,
			);
		} else {
			console.log(
				`${group.displayName} (${group.totalSessions} sessions, ${group.projects.length} locations)${current}`,
			);
		}
	}
}

export const listSessionsCommand = buildCommand({
	loader: async () => ({ default: runListSessions }),
	parameters: {},
	docs: {
		brief: "List session files that would appear in the upload picker",
	},
});
