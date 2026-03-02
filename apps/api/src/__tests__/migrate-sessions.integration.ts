import { afterAll, describe, expect, test } from "bun:test";
import { getAdapter } from "@rudel/agent-adapters";
import type { IngestSessionInput } from "@rudel/api-routes";
import {
	type ClickHouseExecutor,
	createClickHouseExecutor,
} from "../clickhouse.js";
import { migrateOrgSessions } from "../services/org-session.service.js";

const testId = `migrate_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const orgA = `test_org_A_${testId}`;
const orgB = `test_org_B_${testId}`;

const baseExecutor = createClickHouseExecutor({
	url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
	username:
		process.env.CLICKHOUSE_USERNAME || process.env.CLICKHOUSE_USER || "default",
	password: process.env.CLICKHOUSE_PASSWORD || "",
	database: "default",
});

const executor: ClickHouseExecutor = {
	...baseExecutor,
	async insert(params) {
		const rows = params.values.map((r) => JSON.stringify(r)).join("\n");
		// Retry on race condition (code 236) — same as getClickhouse() wrapper
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await baseExecutor.execute(
					`INSERT INTO ${params.table} SETTINGS async_insert=0 FORMAT JSONEachRow ${rows}`,
				);
				return;
			} catch (error) {
				if (attempt === 2) throw error;
				await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
			}
		}
	},
};

afterAll(async () => {
	// Fire-and-forget: ClickHouse Cloud DELETE mutations are slow
	for (const org of [orgA, orgB]) {
		executor
			.execute(
				`DELETE FROM rudel.claude_sessions WHERE organization_id = '${org}'`,
			)
			.catch(() => {});
		executor
			.execute(
				`DELETE FROM rudel.session_analytics WHERE organization_id = '${org}'`,
			)
			.catch(() => {});
	}
});

async function waitForRow(
	table: string,
	orgId: string,
	sessionId: string,
	timeoutMs = 30_000,
	intervalMs = 2_000,
): Promise<Array<{ session_id: string; organization_id: string }>> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const results = await executor.query<{
			session_id: string;
			organization_id: string;
		}>(
			`SELECT session_id, organization_id FROM ${table} WHERE session_id = '${sessionId}' AND organization_id = '${orgId}' LIMIT 1`,
		);
		if (results.length > 0) return results;
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return [];
}

describe("migrateOrgSessions", () => {
	const sessionId = `sess_${testId}`;

	test("migrates sessions from one org to another via temp table", async () => {
		const input: IngestSessionInput = {
			source: "claude_code",
			sessionId,
			projectPath: "/test/migrate",
			repository: "test-repo",
			gitBranch: "main",
			gitSha: "abc123",
			tag: "tests",
			content: "migrate integration test content",
		};

		// Ingest a row under orgA
		const adapter = getAdapter(input.source);
		let ingested = false;
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await adapter.ingest(executor, input, {
					userId: "test_user",
					organizationId: orgA,
				});
				ingested = true;
				break;
			} catch {
				await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
			}
		}
		expect(ingested).toBe(true);

		const before = await waitForRow("rudel.claude_sessions", orgA, sessionId);
		expect(before).toHaveLength(1);

		// Migrate from orgA → orgB (DELETEs may 504 on ClickHouse Cloud but
		// the mutations still run server-side — migrateOrgSessions handles this)
		await migrateOrgSessions(orgA, orgB, executor);

		// New org should have the migrated row
		const newRows = await waitForRow("rudel.claude_sessions", orgB, sessionId);
		expect(newRows).toHaveLength(1);
		expect(newRows[0]?.organization_id).toBe(orgB);
	}, 180_000);
});
