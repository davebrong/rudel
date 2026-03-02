import { escapeString, getClickhouse } from "../clickhouse.js";

export async function getOrgSessionCount(orgId: string): Promise<number> {
	const ch = getClickhouse();
	const rows = await ch.query<{ count: string }>(
		`SELECT count() as count FROM rudel.claude_sessions WHERE organization_id = '${escapeString(orgId)}'`,
	);
	return Number(rows[0]?.count ?? 0);
}

export async function deleteOrgSessions(orgId: string): Promise<void> {
	const ch = getClickhouse();
	const escaped = escapeString(orgId);
	console.log(`[deleteOrgSessions] deleting claude_sessions for org=${orgId}`);
	await ch.execute(
		`DELETE FROM rudel.claude_sessions WHERE organization_id = '${escaped}'`,
	);
	console.log(
		`[deleteOrgSessions] deleting session_analytics for org=${orgId}`,
	);
	await ch.execute(
		`DELETE FROM rudel.session_analytics WHERE organization_id = '${escaped}'`,
	);
	console.log(`[deleteOrgSessions] done for org=${orgId}`);
}

export async function migrateOrgSessions(
	fromOrgId: string,
	toOrgId: string,
): Promise<void> {
	const ch = getClickhouse();
	const from = escapeString(fromOrgId);
	const to = escapeString(toOrgId);
	const tempTable = "rudel._migrate_sessions";

	try {
		// Create temp table with modified org_id in one shot
		console.log(
			`[migrateOrgSessions] creating temp table for org=${fromOrgId} -> ${toOrgId}`,
		);
		await ch.execute(`
			CREATE TABLE ${tempTable} ENGINE = MergeTree()
			ORDER BY (organization_id, session_date, session_id)
			AS SELECT
				session_date, last_interaction_date, session_id,
				'${to}' AS organization_id,
				project_path, repository, content, subagents,
				now64(3) AS ingested_at,
				user_id, git_branch, git_sha, tag
			FROM rudel.claude_sessions
			WHERE organization_id = '${from}'
		`);

		// Re-insert from temp table (triggers MV -> session_analytics)
		console.log(
			`[migrateOrgSessions] re-inserting from temp table into claude_sessions`,
		);
		await ch.execute(`
			INSERT INTO rudel.claude_sessions
				(session_date, last_interaction_date, session_id, organization_id,
				 project_path, repository, content, subagents, ingested_at,
				 user_id, git_branch, git_sha, tag)
			SELECT * FROM ${tempTable}
			SETTINGS async_insert=0
		`);
	} finally {
		await ch.execute(`DROP TABLE IF EXISTS ${tempTable}`);
	}

	// Delete old rows from both tables
	console.log(`[migrateOrgSessions] deleting old rows for org=${fromOrgId}`);
	await deleteOrgSessions(fromOrgId);
	console.log(`[migrateOrgSessions] done`);
}
