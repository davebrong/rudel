import { afterAll, describe, expect, test } from "bun:test";
import type { IngestSessionInput } from "@rudel/api-routes";
import { createClickHouseExecutor } from "../clickhouse.js";
import {
	buildSessionRow,
	extractTimestampRange,
	ingestSession,
} from "../ingest.js";

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
	test("maps all fields from input to RudelClaudeSessionsRow", () => {
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

	test("falls back to now when content has no timestamps", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.session_date).toBeTruthy();
		expect(row.last_interaction_date).toBeTruthy();
		expect(row.ingested_at).toBeTruthy();
		// With no JSONL timestamps, session_date should equal ingested_at (both are "now")
		expect(row.session_date).toBe(row.ingested_at);
		expect(row.last_interaction_date).toBe(row.ingested_at);
	});

	test("extracts session_date and last_interaction_date from JSONL timestamps", () => {
		const jsonlContent = [
			'{"type":"user","timestamp":"2025-01-15T10:00:00.000Z","message":{"role":"user","content":"hello"}}',
			'{"type":"assistant","timestamp":"2025-01-15T10:00:05.000Z","message":{"role":"assistant","content":"hi"}}',
			'{"type":"user","timestamp":"2025-01-15T10:05:00.000Z","message":{"role":"user","content":"bye"}}',
			'{"type":"assistant","timestamp":"2025-01-15T10:05:03.000Z","message":{"role":"assistant","content":"goodbye"}}',
		].join("\n");

		const input: IngestSessionInput = {
			...sampleInput,
			content: jsonlContent,
		};

		const row = buildSessionRow(input, sampleContext);

		expect(row.session_date).toBe("2025-01-15T10:00:00.000");
		expect(row.last_interaction_date).toBe("2025-01-15T10:05:03.000");
		// ingested_at should still be "now", not a content timestamp
		expect(row.ingested_at).not.toBe(row.session_date);
	});
});

describe("extractTimestampRange", () => {
	const fallback = "2026-01-01T00:00:00.000";

	test("returns earliest and latest timestamps from JSONL lines", () => {
		const content = [
			'{"type":"user","timestamp":"2025-03-10T08:00:00.000Z"}',
			'{"type":"assistant","timestamp":"2025-03-10T08:00:05.000Z"}',
			'{"type":"user","timestamp":"2025-03-10T09:30:00.000Z"}',
		].join("\n");

		const [earliest, latest] = extractTimestampRange(content, fallback);
		expect(earliest).toBe("2025-03-10T08:00:00.000");
		expect(latest).toBe("2025-03-10T09:30:00.000");
	});

	test("returns fallback when content has no timestamps", () => {
		const [earliest, latest] = extractTimestampRange(
			"plain text content",
			fallback,
		);
		expect(earliest).toBe(fallback);
		expect(latest).toBe(fallback);
	});

	test("returns fallback for empty content", () => {
		const [earliest, latest] = extractTimestampRange("", fallback);
		expect(earliest).toBe(fallback);
		expect(latest).toBe(fallback);
	});

	test("ignores lines without top-level timestamp fields", () => {
		const content = [
			'{"type":"summary","summary":"some text"}',
			'{"type":"user","timestamp":"2025-06-01T12:00:00.000Z"}',
			'{"type":"file-history-snapshot","snapshot":{"timestamp":"2025-06-01T11:00:00.000Z"}}',
		].join("\n");

		const [earliest, latest] = extractTimestampRange(content, fallback);
		// Only the top-level timestamp is extracted; nested snapshot.timestamp is ignored
		expect(earliest).toBe("2025-06-01T12:00:00.000");
		expect(latest).toBe("2025-06-01T12:00:00.000");
	});

	test("handles single timestamp", () => {
		const content = '{"type":"user","timestamp":"2025-04-20T15:30:00.000Z"}';

		const [earliest, latest] = extractTimestampRange(content, fallback);
		expect(earliest).toBe("2025-04-20T15:30:00.000");
		expect(latest).toBe("2025-04-20T15:30:00.000");
	});

	test("ignores invalid timestamp values", () => {
		const content = [
			'{"type":"user","timestamp":"not-a-date"}',
			'{"type":"assistant","timestamp":"2025-07-04T10:00:00.000Z"}',
		].join("\n");

		const [earliest, latest] = extractTimestampRange(content, fallback);
		expect(earliest).toBe("2025-07-04T10:00:00.000");
		expect(latest).toBe("2025-07-04T10:00:00.000");
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
		const rows = params.values.map((r) => JSON.stringify(r)).join("\n");
		await baseExecutor.execute(
			`INSERT INTO ${params.table} SETTINGS async_insert=0 FORMAT JSONEachRow ${rows}`,
		);
	},
};

afterAll(() => {
	// Fire-and-forget: ClickHouse Cloud DELETE mutations are slow
	executor
		.execute(`DELETE FROM rudel.claude_sessions WHERE session_id = '${testId}'`)
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
				`SELECT session_id, project_path, repository, tag, user_id, organization_id FROM rudel.claude_sessions WHERE session_id = '${sessionId}' LIMIT 1`,
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
