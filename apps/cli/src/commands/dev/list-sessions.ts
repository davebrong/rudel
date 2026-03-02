import {
	getAdapter,
	getAvailableAdapters,
	groupProjectsForCwd,
	type ScannedProject,
} from "@rudel/agent-adapters";
import { buildCommand } from "@stricli/core";

async function runListSessions(): Promise<void> {
	const adapters = getAvailableAdapters();
	const allProjects: ScannedProject[] = [];
	for (const adapter of adapters) {
		const projects = await adapter.scanAllSessions();
		allProjects.push(...projects);
	}

	if (allProjects.length === 0) {
		console.log("No projects with sessions found.");
		return;
	}

	const cwd = process.cwd();
	const grouped = groupProjectsForCwd(allProjects, cwd);

	const lines: string[] = [];

	for (const proj of grouped.current) {
		const name = getAdapter(proj.source).name;
		lines.push(
			`[${name}] ${proj.displayPath} (${proj.sessionCount} sessions) [current]`,
		);
	}

	for (const sub of grouped.subfolders) {
		const name = getAdapter(sub.source).name;
		const relative = sub.projectPath.slice(cwd.length + 1);
		lines.push(`  [${name}] ${relative} (${sub.sessionCount} sessions)`);
	}

	for (const other of grouped.others) {
		const name = getAdapter(other.source).name;
		lines.push(
			`[${name}] ${other.displayPath} (${other.sessionCount} sessions)`,
		);
	}

	const totalSessions = allProjects.reduce((s, p) => s + p.sessionCount, 0);
	console.log(`${allProjects.length} projects, ${totalSessions} sessions\n`);
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
