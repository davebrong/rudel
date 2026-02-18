import { afterAll, describe, expect, test } from "bun:test";
import type { IngestSessionInput } from "@rudel/api-routes";
import { createClickHouseExecutor } from "../clickhouse.js";
import { buildSessionRow, ingestSession } from "../ingest.js";

const sampleInput: IngestSessionInput = {
	sessionId: "test-session-abc",
	projectPath: "/test/project",
	repository: "my-repo",
	gitBranch: "main",
	gitSha: "abc123def456",
	tag: "bug_fix",
	content: "test session content",
	subagents: [
		{ agentId: "agent-1", content: "subagent 1 content" },
		{ agentId: "agent-2", content: "subagent 2 content" },
	],
};

const sampleContext = {
	userId: "user_123",
	organizationId: "org_456",
};

describe("buildSessionRow", () => {
	test("maps all fields from input to FlickClaudeSessionsRow", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.session_id).toBe("test-session-abc");
		expect(row.project_path).toBe("/test/project");
		expect(row.repository).toBe("my-repo");
		expect(row.git_branch).toBe("main");
		expect(row.git_sha).toBe("abc123def456");
		expect(row.tag).toBe("bug_fix");
		expect(row.content).toBe("test session content");
		expect(row.user_id).toBe("user_123");
		expect(row.organization_id).toBe("org_456");
	});

	test("converts subagents array to record", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.subagents).toEqual({
			"agent-1": "subagent 1 content",
			"agent-2": "subagent 2 content",
		});
	});

	test("handles missing optional fields", () => {
		const minimalInput: IngestSessionInput = {
			sessionId: "minimal-session",
			projectPath: "/minimal",
			content: "minimal content",
		};

		const row = buildSessionRow(minimalInput, sampleContext);

		expect(row.repository).toBeNull();
		expect(row.git_branch).toBeNull();
		expect(row.git_sha).toBeNull();
		expect(row.tag).toBeNull();
		expect(row.subagents).toEqual({});
	});

	test("sets timestamps and default token values", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.session_date).toBeTruthy();
		expect(row.last_interaction_date).toBeTruthy();
		expect(row.ingested_at).toBeTruthy();
		expect(row.input_tokens).toBe("0");
		expect(row.output_tokens).toBe("0");
		expect(row.cache_read_input_tokens).toBe("0");
		expect(row.cache_creation_input_tokens).toBe("0");
		expect(row.total_tokens).toBe("0");
	});

	test("sets empty arrays for metadata fields", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.skills).toEqual([]);
		expect(row.slash_commands).toEqual([]);
		expect(row.subagent_types).toEqual([]);
	});
});

const testId = `api_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

afterAll(() => {
	// Fire-and-forget: ClickHouse Cloud DELETE mutations are slow
	executor
		.execute(`DELETE FROM flick.claude_sessions WHERE session_id = '${testId}'`)
		.catch(() => {});
});

async function waitForRow(
	sessionId: string,
	timeoutMs = 30000,
	intervalMs = 2000,
): Promise<
	Array<{
		session_id: string;
		project_path: string;
		repository: string;
		tag: string;
		user_id: string;
		organization_id: string;
	}>
> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const results = await executor.query<{
				session_id: string;
				project_path: string;
				repository: string;
				tag: string;
				user_id: string;
				organization_id: string;
			}>(
				`SELECT session_id, project_path, repository, tag, user_id, organization_id FROM flick.claude_sessions WHERE session_id = '${sessionId}' LIMIT 1`,
			);
			if (results.length > 0) return results;
		} catch {
			// Transient ClickHouse errors (e.g. S3 storage) - retry
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return [];
}

describe("ingestSession", () => {
	test("ingests a session into ClickHouse and reads it back", async () => {
		const input: IngestSessionInput = {
			sessionId: testId,
			projectPath: "/test/api-ingest",
			repository: "test-repo",
			gitBranch: "feature-branch",
			gitSha: "deadbeef",
			tag: "tests",
			content: "integration test content",
			subagents: [{ agentId: "sub-1", content: "subagent content" }],
		};

		// ClickHouse Cloud can silently drop inserts or throw race condition
		// errors (code 236). Retry the insert+read cycle with exponential backoff.
		let results: Awaited<ReturnType<typeof waitForRow>> = [];
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await ingestSession(executor, input, {
					userId: "test_user",
					organizationId: "test_org",
				});
			} catch {
				await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
				continue;
			}
			results = await waitForRow(testId);
			if (results.length > 0) break;
		}

		expect(results).toHaveLength(1);
		expect(results[0]?.session_id).toBe(testId);
		expect(results[0]?.project_path).toBe("/test/api-ingest");
		expect(results[0]?.repository).toBe("test-repo");
		expect(results[0]?.tag).toBe("tests");
		expect(results[0]?.user_id).toBe("test_user");
		expect(results[0]?.organization_id).toBe("test_org");
	}, 120000);
});
