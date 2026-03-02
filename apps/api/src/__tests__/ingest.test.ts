import { describe, expect, test } from "bun:test";
import { claudeCodeAdapter } from "@rudel/agent-adapters";

describe("extractTimestamps", () => {
	test("returns min/max timestamps from user and assistant lines", () => {
		const content = [
			'{"type":"user","timestamp":"2026-02-15T10:00:00Z","message":"hello"}',
			'{"type":"assistant","timestamp":"2026-02-15T10:05:00Z","message":"hi"}',
			'{"type":"user","timestamp":"2026-02-15T10:10:00Z","message":"bye"}',
		].join("\n");

		const result = claudeCodeAdapter.extractTimestamps(content);

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

		const result = claudeCodeAdapter.extractTimestamps(content);

		expect(result).toEqual({
			sessionDate: "2026-02-15T10:00:00Z",
			lastInteractionDate: "2026-02-15T10:00:00Z",
		});
	});

	test("returns null when no timestamps found", () => {
		expect(claudeCodeAdapter.extractTimestamps("not json")).toBeNull();
		expect(claudeCodeAdapter.extractTimestamps("")).toBeNull();
		expect(claudeCodeAdapter.extractTimestamps('{"type":"user"}')).toBeNull();
	});

	test("skips lines without timestamp field", () => {
		const content = [
			'{"type":"user","message":"no timestamp"}',
			'{"type":"assistant","timestamp":"2026-02-15T10:05:00Z","message":"hi"}',
		].join("\n");

		const result = claudeCodeAdapter.extractTimestamps(content);

		expect(result).toEqual({
			sessionDate: "2026-02-15T10:05:00Z",
			lastInteractionDate: "2026-02-15T10:05:00Z",
		});
	});
});
