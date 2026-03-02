import { escapeString, getClickhouse } from "../clickhouse.js";

export async function getOrgSessionCount(orgId: string): Promise<number> {
	const ch = getClickhouse();
	const escaped = escapeString(orgId);
	const [claudeRows, codexRows] = await Promise.all([
		ch.query<{ count: string }>(
			`SELECT count() as count FROM rudel.claude_sessions WHERE organization_id = '${escaped}'`,
		),
		ch.query<{ count: string }>(
			`SELECT count() as count FROM rudel.codex_sessions WHERE organization_id = '${escaped}'`,
		),
	]);
	return Number(claudeRows[0]?.count ?? 0) + Number(codexRows[0]?.count ?? 0);
}

export async function deleteOrgSessions(orgId: string): Promise<void> {
	const ch = getClickhouse();
	const escaped = escapeString(orgId);
	console.log(`[deleteOrgSessions] deleting claude_sessions for org=${orgId}`);
	await ch.execute(
		`DELETE FROM rudel.claude_sessions WHERE organization_id = '${escaped}'`,
	);
	console.log(`[deleteOrgSessions] deleting codex_sessions for org=${orgId}`);
	await ch.execute(
		`DELETE FROM rudel.codex_sessions WHERE organization_id = '${escaped}'`,
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
	const claudeTempTable = "rudel._migrate_claude_sessions";
	const codexTempTable = "rudel._migrate_codex_sessions";

	try {
		// Migrate claude_sessions via temp table (triggers MV -> session_analytics)
		console.log(
			`[migrateOrgSessions] creating temp table for claude_sessions org=${fromOrgId} -> ${toOrgId}`,
		);
		await ch.execute(`
			CREATE TABLE ${claudeTempTable} ENGINE = MergeTree()
			ORDER BY (organization_id, session_date, session_id)
			AS SELECT
				session_date, last_interaction_date, session_id,
				'${to}' AS organization_id,
				project_path, repository, git_remote, package_name,
				content, subagents,
				now64(3) AS ingested_at,
				user_id, git_branch, git_sha, tag
			FROM rudel.claude_sessions
			WHERE organization_id = '${from}'
		`);

		console.log(
			`[migrateOrgSessions] re-inserting from temp table into claude_sessions`,
		);
		await ch.execute(`
			INSERT INTO rudel.claude_sessions
				(session_date, last_interaction_date, session_id, organization_id,
				 project_path, repository, git_remote, package_name,
				 content, subagents, ingested_at,
				 user_id, git_branch, git_sha, tag)
			SELECT * FROM ${claudeTempTable}
			SETTINGS async_insert=0
		`);

		// Migrate codex_sessions via temp table (triggers MV -> session_analytics)
		console.log(
			`[migrateOrgSessions] creating temp table for codex_sessions org=${fromOrgId} -> ${toOrgId}`,
		);
		await ch.execute(`
			CREATE TABLE ${codexTempTable} ENGINE = MergeTree()
			ORDER BY (organization_id, session_date, session_id)
			AS SELECT
				session_date, last_interaction_date, session_id,
				'${to}' AS organization_id,
				project_path, repository, content,
				now64(3) AS ingested_at,
				user_id, git_branch, git_sha, tag,
				cli_version, model_provider, codex_source
			FROM rudel.codex_sessions
			WHERE organization_id = '${from}'
		`);

		console.log(
			`[migrateOrgSessions] re-inserting from temp table into codex_sessions`,
		);
		await ch.execute(`
			INSERT INTO rudel.codex_sessions
				(session_date, last_interaction_date, session_id, organization_id,
				 project_path, repository, content, ingested_at,
				 user_id, git_branch, git_sha, tag,
				 cli_version, model_provider, codex_source)
			SELECT * FROM ${codexTempTable}
			SETTINGS async_insert=0
		`);
	} finally {
		await ch.execute(`DROP TABLE IF EXISTS ${claudeTempTable}`);
		await ch.execute(`DROP TABLE IF EXISTS ${codexTempTable}`);
	}

	// Delete old rows from all tables
	console.log(`[migrateOrgSessions] deleting old rows for org=${fromOrgId}`);
	await deleteOrgSessions(fromOrgId);
	console.log(`[migrateOrgSessions] done`);
}
