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

	// Can't use ALTER TABLE UPDATE: organization_id is an ORDER BY key column
	// and ingested_at is the ReplacingMergeTree version column.
	// Can't use INSERT INTO ... SELECT FROM same table (ClickHouse Cloud writes 0 rows).
	// So: fetch rows, update org_id in memory, re-insert, then delete originals.

	console.log(
		`[migrateOrgSessions] fetching claude_sessions for org=${fromOrgId}`,
	);
	const sessions = await ch.query<Record<string, unknown>>(
		`SELECT * FROM rudel.claude_sessions FINAL WHERE organization_id = '${from}'`,
	);
	if (sessions.length > 0) {
		console.log(
			`[migrateOrgSessions] inserting ${sessions.length} claude_sessions into org=${toOrgId}`,
		);
		await ch.insert({
			table: "rudel.claude_sessions",
			values: sessions.map((row) => ({
				...row,
				organization_id: toOrgId,
			})),
		});
	}

	console.log(
		`[migrateOrgSessions] fetching session_analytics for org=${fromOrgId}`,
	);
	const analytics = await ch.query<Record<string, unknown>>(
		`SELECT * FROM rudel.session_analytics FINAL WHERE organization_id = '${from}'`,
	);
	if (analytics.length > 0) {
		console.log(
			`[migrateOrgSessions] inserting ${analytics.length} session_analytics into org=${toOrgId}`,
		);
		await ch.insert({
			table: "rudel.session_analytics",
			values: analytics.map((row) => ({
				...row,
				organization_id: toOrgId,
			})),
		});
	}

	console.log(`[migrateOrgSessions] deleting old rows for org=${fromOrgId}`);
	await ch.execute(
		`DELETE FROM rudel.claude_sessions WHERE organization_id = '${from}'`,
	);
	await ch.execute(
		`DELETE FROM rudel.session_analytics WHERE organization_id = '${from}'`,
	);

	console.log(
		`[migrateOrgSessions] done: migrated ${sessions.length} sessions, ${analytics.length} analytics rows`,
	);
}
