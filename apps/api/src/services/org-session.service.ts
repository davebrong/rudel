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
	await ch.execute(
		`DELETE FROM rudel.claude_sessions WHERE organization_id = '${escaped}'`,
	);
	await ch.execute(
		`DELETE FROM rudel.session_analytics WHERE organization_id = '${escaped}'`,
	);
}

export async function migrateOrgSessions(
	fromOrgId: string,
	toOrgId: string,
): Promise<void> {
	const ch = getClickhouse();
	const from = escapeString(fromOrgId);
	const to = escapeString(toOrgId);
	await ch.execute(
		`ALTER TABLE rudel.claude_sessions UPDATE organization_id = '${to}', ingested_at = now64(3) WHERE organization_id = '${from}'`,
	);
	await ch.execute(
		`ALTER TABLE rudel.session_analytics UPDATE organization_id = '${to}', ingested_at = now64(3) WHERE organization_id = '${from}'`,
	);
}
