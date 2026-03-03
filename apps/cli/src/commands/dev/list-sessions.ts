import { getAdapter } from "@rudel/agent-adapters";
import { buildCommand } from "@stricli/core";
import { scanAndGroupProjects } from "../../lib/project-grouping.js";

async function runListSessions(): Promise<void> {
	const { groups } = await scanAndGroupProjects();

	if (groups.length === 0) {
		console.log("No projects with sessions found.");
		return;
	}

	const totalSessions = groups.reduce((s, g) => s + g.totalSessions, 0);
	console.log(`${groups.length} groups, ${totalSessions} sessions\n`);

	for (const group of groups) {
		const sources = [
			...new Set(group.projects.map((p) => getAdapter(p.source).name)),
		];
		const current = group.containsCwd ? " [current]" : "";
		console.log(
			`[${sources.join(", ")}] ${group.displayName} (${group.totalSessions} sessions)${current}`,
		);
	}
}

export const listSessionsCommand = buildCommand({
	loader: async () => ({ default: runListSessions }),
	parameters: {},
	docs: {
		brief: "List session files that would appear in the upload picker",
	},
});
