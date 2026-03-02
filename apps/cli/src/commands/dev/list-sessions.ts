import { buildCommand } from "@stricli/core";
import {
	groupProjectsForCwd,
	scanProjects,
} from "../../lib/project-scanner.js";

async function runListSessions(): Promise<void> {
	const projects = await scanProjects();

	if (projects.length === 0) {
		console.log("No projects with sessions found in ~/.claude/projects/");
		return;
	}

	const cwd = process.cwd();
	const grouped = groupProjectsForCwd(projects, cwd);

	const lines: string[] = [];

	if (grouped.current) {
		lines.push(
			`${grouped.current.displayPath} (${grouped.current.sessionCount} sessions) [current]`,
		);
		for (const sub of grouped.subfolders) {
			const relative = sub.decodedPath.slice(
				grouped.current.decodedPath.length + 1,
			);
			lines.push(`  ${relative} (${sub.sessionCount} sessions)`);
		}
	}

	for (const other of grouped.others) {
		lines.push(`${other.displayPath} (${other.sessionCount} sessions)`);
	}

	const totalSessions = projects.reduce((s, p) => s + p.sessionCount, 0);
	console.log(`${projects.length} projects, ${totalSessions} sessions\n`);
	for (const line of lines) {
		console.log(line);
	}
}

export const listSessionsCommand = buildCommand({
	loader: async () => ({ default: runListSessions }),
	parameters: {},
	docs: {
		brief: "List session files that would appear in the upload picker",
	},
});
