import { afterAll, describe, expect, it, test } from "bun:test";
import { createClickHouseExecutor } from "@chkit/clickhouse";
import {
	ingestFlickClaudeSessions,
	ingestFlickUptimeCheckResults,
} from "../generated/chkit-ingest.js";
import type {
	FlickClaudeSessionsRow,
	FlickUptimeCheckResultsRow,
} from "../generated/chkit-types.js";

const hasClickHouse = process.env.TEST_CLICKHOUSE === "1";
const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const executor = createClickHouseExecutor({
	url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
	username: process.env.CLICKHOUSE_USER || "default",
	password: process.env.CLICKHOUSE_PASSWORD || "",
	database: process.env.CLICKHOUSE_DB || "default",
});

afterAll(async () => {
	if (!hasClickHouse) return;
	await executor.execute(
		`DELETE FROM flick.claude_sessions WHERE session_id = '${testId}'`,
	);
	await executor.execute(
		`DELETE FROM flick.uptime_check_results WHERE monitor_id = '${testId}'`,
	);
});

describe("ingestFlickClaudeSessions", () => {
	const row: FlickClaudeSessionsRow = {
		session_date: "2026-02-17T00:00:00.000",
		last_interaction_date: "2026-02-17T01:00:00.000",
		session_id: testId,
		organization_id: "org_test",
		project_path: "/test/project",
		repository: null,
		content: "test session content",
		subagents: {},
		skills: ["code:testing"],
		slash_commands: [],
		subagent_types: [],
		ingested_at: "2026-02-17T00:00:00.000",
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

	test.skipIf(!hasClickHouse)("inserts a row and reads it back", async () => {
		await ingestFlickClaudeSessions(executor, [row]);

		const results = await executor.query<{
			session_id: string;
			tag: string;
		}>(
			`SELECT session_id, tag FROM flick.claude_sessions WHERE session_id = '${testId}' LIMIT 1`,
		);

		expect(results).toHaveLength(1);
		expect(results[0]).toBeDefined();
		expect(results[0].session_id).toBe(testId);
		expect(results[0].tag).toBe("integration-test");
	});

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

describe("ingestFlickUptimeCheckResults", () => {
	const row: FlickUptimeCheckResultsRow = {
		check_date: "2026-02-17",
		check_timestamp: "2026-02-17T00:00:00.000",
		monitor_id: testId,
		organization_id: "org_test",
		success: 1,
		status_code: 200,
		response_time_ms: 42,
		status_valid: 1,
		body_valid: 1,
		timeout_occurred: 0,
		error_type: null,
		error_message: null,
		response_body: null,
		response_size_bytes: 512,
		content_type: "application/json",
		worker_colo: "SJC",
		check_attempt: 1,
		monitor_url: "https://example.com/health",
		monitor_method: "GET",
		expected_status_codes: "200",
		check_interval_seconds: 60,
		response_headers: null,
		retries_needed: 0,
	};

	test.skipIf(!hasClickHouse)("inserts a row and reads it back", async () => {
		await ingestFlickUptimeCheckResults(executor, [row]);

		const results = await executor.query<{
			monitor_id: string;
			success: number;
		}>(
			`SELECT monitor_id, success FROM flick.uptime_check_results WHERE monitor_id = '${testId}' LIMIT 1`,
		);

		expect(results).toHaveLength(1);
		expect(results[0]).toBeDefined();
		expect(results[0].monitor_id).toBe(testId);
		expect(results[0].success).toBe(1);
	});

	it("rejects invalid data with validate option", async () => {
		const badRow = {
			...row,
			success: "yes",
		} as unknown as FlickUptimeCheckResultsRow;
		expect(
			ingestFlickUptimeCheckResults(executor, [badRow], { validate: true }),
		).rejects.toThrow();
	});
});
