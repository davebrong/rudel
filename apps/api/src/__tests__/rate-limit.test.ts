import { describe, expect, test } from "bun:test";
import { IngestSessionInputSchema } from "@rudel/api-routes";

describe("IngestSessionInputSchema metadata field limits", () => {
	const validBase = {
		source: "claude_code" as const,
		sessionId: "abc-123",
		projectPath: "/home/user/project",
		content: '{"type":"user","timestamp":"2026-01-01T00:00:00Z"}',
	};

	test("accepts metadata fields within 200 char limit", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			sessionId: "a".repeat(200),
			projectPath: "b".repeat(200),
			gitRemote: "c".repeat(200),
			gitBranch: "d".repeat(200),
			gitSha: "e".repeat(200),
			packageName: "f".repeat(200),
			packageType: "g".repeat(200),
			organizationId: "h".repeat(200),
		});
		expect(result.success).toBe(true);
	});

	test("rejects sessionId over 200 chars", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			sessionId: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	test("rejects projectPath over 200 chars", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			projectPath: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	test("rejects gitRemote over 200 chars", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			gitRemote: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	test("rejects gitBranch over 200 chars", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			gitBranch: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	test("rejects organizationId over 200 chars", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			organizationId: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	test("does not limit content field length", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			content: "x".repeat(10_000_000),
		});
		expect(result.success).toBe(true);
	});

	test("does not limit subagent content field length", () => {
		const result = IngestSessionInputSchema.safeParse({
			...validBase,
			subagents: [{ agentId: "agent-1", content: "y".repeat(1_000_000) }],
		});
		expect(result.success).toBe(true);
	});
});
