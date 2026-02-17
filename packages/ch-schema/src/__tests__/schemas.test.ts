import { describe, expect, it } from "bun:test";
import {
	FlickClaudeSessionsRowSchema,
	FlickUptimeCheckResultsRowSchema,
} from "../generated/chkit-types.js";

describe("FlickClaudeSessionsRowSchema", () => {
	const validRow = {
		session_date: "2026-02-13T09:24:27.180Z",
		last_interaction_date: "2026-02-13T09:24:27.180Z",
		session_id: "sess_abc123",
		organization_id: "org_xyz",
		project_path: "/Users/dev/project",
		repository: "github.com/org/repo",
		content: "session transcript content",
		subagents: { agent1: "result1" },
		skills: ["code:testing"],
		slash_commands: ["/commit"],
		subagent_types: ["Explore"],
		ingested_at: "2026-02-13T09:24:27.180Z",
		user_id: "user_123",
		git_branch: "main",
		git_sha: "abc123def456",
		input_tokens: "1000",
		output_tokens: "2000",
		cache_read_input_tokens: "500",
		cache_creation_input_tokens: "100",
		total_tokens: "3600",
		tag: "production",
	};

	it("parses a valid row", () => {
		const result = FlickClaudeSessionsRowSchema.parse(validRow);
		expect(result.session_id).toBe("sess_abc123");
		expect(result.organization_id).toBe("org_xyz");
		expect(result.skills).toEqual(["code:testing"]);
		expect(result.subagents).toEqual({ agent1: "result1" });
	});

	it("accepts null for nullable fields", () => {
		const row = {
			...validRow,
			repository: null,
			git_branch: null,
			git_sha: null,
			tag: null,
		};
		const result = FlickClaudeSessionsRowSchema.parse(row);
		expect(result.repository).toBeNull();
		expect(result.git_branch).toBeNull();
		expect(result.git_sha).toBeNull();
		expect(result.tag).toBeNull();
	});

	it("rejects missing required fields", () => {
		const { session_id: _, ...incomplete } = validRow;
		expect(() => FlickClaudeSessionsRowSchema.parse(incomplete)).toThrow();
	});

	it("rejects wrong types", () => {
		expect(() =>
			FlickClaudeSessionsRowSchema.parse({ ...validRow, input_tokens: 1000 }),
		).toThrow();
	});
});

describe("FlickUptimeCheckResultsRowSchema", () => {
	const validRow = {
		check_date: "2026-02-13",
		check_timestamp: "2026-02-13T09:24:27.180Z",
		monitor_id: "mon_abc",
		organization_id: "org_xyz",
		success: 1,
		status_code: 200,
		response_time_ms: 150,
		status_valid: 1,
		body_valid: 1,
		timeout_occurred: 0,
		error_type: null,
		error_message: null,
		response_body: null,
		response_size_bytes: 1024,
		content_type: "application/json",
		worker_colo: "SJC",
		check_attempt: 1,
		monitor_url: "https://example.com/health",
		monitor_method: "GET",
		expected_status_codes: "200,201",
		check_interval_seconds: 60,
		response_headers: null,
		retries_needed: 0,
	};

	it("parses a valid row", () => {
		const result = FlickUptimeCheckResultsRowSchema.parse(validRow);
		expect(result.monitor_id).toBe("mon_abc");
		expect(result.success).toBe(1);
		expect(result.response_time_ms).toBe(150);
	});

	it("accepts null for nullable fields", () => {
		const row = {
			...validRow,
			status_code: null,
			response_time_ms: null,
			status_valid: null,
			body_valid: null,
			error_type: null,
			error_message: null,
			response_body: null,
			response_size_bytes: null,
			content_type: null,
			worker_colo: null,
			expected_status_codes: null,
			response_headers: null,
		};
		const result = FlickUptimeCheckResultsRowSchema.parse(row);
		expect(result.status_code).toBeNull();
		expect(result.response_time_ms).toBeNull();
	});

	it("rejects missing required fields", () => {
		const { monitor_id: _, ...incomplete } = validRow;
		expect(() => FlickUptimeCheckResultsRowSchema.parse(incomplete)).toThrow();
	});

	it("rejects wrong types", () => {
		expect(() =>
			FlickUptimeCheckResultsRowSchema.parse({
				...validRow,
				success: "yes",
			}),
		).toThrow();
	});
});
