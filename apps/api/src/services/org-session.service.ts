import { getAllAdapters } from "@rudel/agent-adapters";
import {
	type ClickHouseExecutor,
	escapeString,
	getClickhouse,
} from "../clickhouse.js";

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

export async function migrateOrgSessions(
	fromOrgId: string,
	toOrgId: string,
	ch: ClickHouseExecutor = getClickhouse(),
): Promise<void> {
	const from = escapeString(fromOrgId);
	const tables = getAllAdapters().map((a) => a.rawTableName);

	// Can't use ALTER TABLE UPDATE — organization_id is an ORDER BY key and
	// ingested_at is the ReplacingMergeTree version column.
	// Can't use CREATE TABLE ... AS SELECT — ClickHouse Cloud has eventual
	// consistency across replicas, so the SELECT may read stale data.
	// Instead, read rows into the app, swap the org_id, and re-insert.
	await Promise.all(
		tables.map(async (table) => {
			const rows = await ch.query<Record<string, unknown>>(
				`SELECT * FROM ${table} WHERE organization_id = '${from}'`,
			);
			if (rows.length === 0) return;
			const migrated = rows.map((row) => ({
				...row,
				organization_id: toOrgId,
			}));
			await ch.insert({ table, values: migrated });
		}),
	);

	// Delete old rows. On ClickHouse Cloud, DELETE mutations may outlast the
	// HTTP gateway timeout (504) but still run to completion server-side.
	// Fire all deletes in parallel and don't let a gateway timeout abort the
	// migration — the INSERT above already succeeded.
	const deletions = [
		...tables.map((table) =>
			ch.execute(`DELETE FROM ${table} WHERE organization_id = '${from}'`),
		),
		ch.execute(
			`DELETE FROM rudel.session_analytics WHERE organization_id = '${from}'`,
		),
	];
	const results = await Promise.allSettled(deletions);
	for (const r of results) {
		if (r.status === "rejected") {
			console.warn(
				`[migrateOrgSessions] DELETE mutation may still be running: ${r.reason}`,
			);
		}
	}
}
