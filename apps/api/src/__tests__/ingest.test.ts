import { describe, expect, test } from "bun:test";
import type { IngestSessionInput } from "@rudel/api-routes";
import { buildSessionRow, extractTimestampRange } from "../ingest.js";

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

	test("extracts session_date and last_interaction_date from JSONL content", () => {
		const content = [
			'{"type":"user","timestamp":"2026-02-15T10:00:00Z","message":"hello"}',
			'{"type":"assistant","timestamp":"2026-02-15T10:05:00Z","message":"hi"}',
			'{"type":"user","timestamp":"2026-02-15T10:10:00Z","message":"bye"}',
		].join("\n");

		const input: IngestSessionInput = {
			...sampleInput,
			content,
		};

		const row = buildSessionRow(input, sampleContext);

		expect(row.session_date).toBe("2026-02-15 10:00:00");
		expect(row.last_interaction_date).toBe("2026-02-15 10:10:00");
		expect(row.session_date).not.toBe(row.ingested_at);
	});

	test("falls back to now when content has no timestamps", () => {
		const row = buildSessionRow(sampleInput, sampleContext);

		expect(row.session_date).toBe(row.ingested_at);
		expect(row.last_interaction_date).toBe(row.ingested_at);
	});
});

describe("extractTimestampRange", () => {
	test("returns min/max timestamps from user and assistant lines", () => {
		const content = [
			'{"type":"user","timestamp":"2026-02-15T10:00:00Z","message":"hello"}',
			'{"type":"assistant","timestamp":"2026-02-15T10:05:00Z","message":"hi"}',
			'{"type":"user","timestamp":"2026-02-15T10:10:00Z","message":"bye"}',
		].join("\n");

		const result = extractTimestampRange(content);

		expect(result).toEqual({
			sessionDate: "2026-02-15T10:00:00Z",
			lastInteractionDate: "2026-02-15T10:10:00Z",
		});
	});

	test("ignores non-user/assistant lines", () => {
		const content = [
			'{"type":"system","timestamp":"2026-02-15T09:00:00Z"}',
			'{"type":"user","timestamp":"2026-02-15T10:00:00Z","message":"hello"}',
			'{"type":"progress","timestamp":"2026-02-15T10:30:00Z"}',
		].join("\n");

		const result = extractTimestampRange(content);

		expect(result).toEqual({
			sessionDate: "2026-02-15T10:00:00Z",
			lastInteractionDate: "2026-02-15T10:00:00Z",
		});
	});

	test("returns null when no timestamps found", () => {
		expect(extractTimestampRange("not json")).toBeNull();
		expect(extractTimestampRange("")).toBeNull();
		expect(extractTimestampRange('{"type":"user"}')).toBeNull();
	});

	test("skips lines without timestamp field", () => {
		const content = [
			'{"type":"user","message":"no timestamp"}',
			'{"type":"assistant","timestamp":"2026-02-15T10:05:00Z","message":"hi"}',
		].join("\n");

		const result = extractTimestampRange(content);

		expect(result).toEqual({
			sessionDate: "2026-02-15T10:05:00Z",
			lastInteractionDate: "2026-02-15T10:05:00Z",
		});
	});
});
