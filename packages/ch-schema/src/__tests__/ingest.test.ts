import { afterAll, describe, expect, it, test } from "bun:test";
import { createClickHouseExecutor } from "@chkit/clickhouse";
import { ingestFlickClaudeSessions } from "../generated/chkit-ingest.js";
import type { FlickClaudeSessionsRow } from "../generated/chkit-types.js";

const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const baseExecutor = createClickHouseExecutor({
	url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
	username:
		process.env.CLICKHOUSE_USERNAME || process.env.CLICKHOUSE_USER || "default",
	password: process.env.CLICKHOUSE_PASSWORD || "",
	database: "default",
});

// ClickHouse Cloud's @clickhouse/client insert() silently drops data.
// Wrap the executor to use execute() with FORMAT JSONEachRow instead.
// async_insert=0 forces synchronous insert so data is immediately queryable.
const executor: typeof baseExecutor = {
	...baseExecutor,
	async insert(params) {
		const rows = params.values
			.map((r: Record<string, unknown>) => JSON.stringify(r))
			.join("\n");
		await baseExecutor.execute(
			`INSERT INTO ${params.table} SETTINGS async_insert=0 FORMAT JSONEachRow ${rows}`,
		);
	},
};

async function waitForQuery<T>(
	query: string,
	timeoutMs = 30000,
	intervalMs = 2000,
): Promise<T[]> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const results = await executor.query<T>(query);
			if (results.length > 0) return results;
		} catch {
			// Transient ClickHouse errors (e.g. S3 storage) - retry
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return [];
}

async function insertWithRetry(
	fn: () => Promise<void>,
	queryFn: () => Promise<unknown[]>,
	maxAttempts = 3,
): Promise<unknown[]> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		await fn();
		const results = await queryFn();
		if (results.length > 0) return results;
	}
	return [];
}

afterAll(() => {
	executor
		.execute(`DELETE FROM flick.claude_sessions WHERE session_id = '${testId}'`)
		.catch(() => {});
});

describe("ingestFlickClaudeSessions", () => {
	const now = new Date().toISOString().replace("Z", "");
	const row: FlickClaudeSessionsRow = {
		session_date: now,
		last_interaction_date: now,
		session_id: testId,
		organization_id: "org_test",
		project_path: "/test/project",
		repository: null,
		content: "test session content",
		subagents: {},
		skills: ["code:testing"],
		slash_commands: [],
		subagent_types: [],
		ingested_at: now,
		user_id: "user_test",
		git_branch: "main",
		git_sha: null,
		input_tokens: "100",
		output_tokens: "200",
		cache_read_input_tokens: "0",
		cache_creation_input_tokens: "0",
		total_tokens: "300",
		tag: "integration-test",
	};

	test("inserts a row and reads it back", async () => {
		const results = (await insertWithRetry(
			() => ingestFlickClaudeSessions(executor, [row]),
			() =>
				waitForQuery<{ session_id: string; tag: string }>(
					`SELECT session_id, tag FROM flick.claude_sessions WHERE session_id = '${testId}' LIMIT 1`,
				),
		)) as Array<{ session_id: string; tag: string }>;

		expect(results).toHaveLength(1);
		expect(results[0]?.session_id).toBe(testId);
		expect(results[0]?.tag).toBe("integration-test");
	}, 120000);

	it("rejects invalid data with validate option", async () => {
		const badRow = {
			...row,
			input_tokens: 999,
		} as unknown as FlickClaudeSessionsRow;
		expect(
			ingestFlickClaudeSessions(executor, [badRow], { validate: true }),
		).rejects.toThrow();
	});
});
