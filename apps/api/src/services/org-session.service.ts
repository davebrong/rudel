import { getAllAdapters } from "@rudel/agent-adapters";
import { escapeString, getClickhouse } from "../clickhouse.js";

export async function getOrgSessionCount(orgId: string): Promise<number> {
	const ch = getClickhouse();
	const escaped = escapeString(orgId);
	const tables = getAllAdapters().map((a) => a.rawTableName);
	const results = await Promise.all(
		tables.map((table) =>
			ch.query<{ count: string }>(
				`SELECT count() as count FROM ${table} WHERE organization_id = '${escaped}'`,
			),
		),
	);
	return results.reduce((sum, rows) => sum + Number(rows[0]?.count ?? 0), 0);
}

export async function deleteOrgSessions(orgId: string): Promise<void> {
	const ch = getClickhouse();
	const escaped = escapeString(orgId);
	const tables = getAllAdapters().map((a) => a.rawTableName);
	await Promise.all([
		...tables.map((table) =>
			ch.execute(`DELETE FROM ${table} WHERE organization_id = '${escaped}'`),
		),
		ch.execute(
			`DELETE FROM rudel.session_analytics WHERE organization_id = '${escaped}'`,
		),
	]);
}
