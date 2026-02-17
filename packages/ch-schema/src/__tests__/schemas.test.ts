import { describe, expect, it } from "bun:test";
import { FlickClaudeSessionsRowSchema } from "../generated/chkit-types.js";

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
