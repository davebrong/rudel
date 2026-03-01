import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { ClaudeCodeAgent } from "../lib/agents/claude-code.js";
import { getDefaultAgent } from "../lib/agents/index.js";

const SAMPLE_SESSION = [
	JSON.stringify({ type: "summary", sessionId: "test-1" }),
	JSON.stringify({ type: "message", role: "human", content: "hello" }),
].join("\n");

// Use a unique temp project path that we control
const TEST_PROJECT_PATH = join(
	homedir(),
	`.rudel-agent-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
);

// Claude Code encodes /path/to/project → -path-to-project
const ENCODED_PROJECT = TEST_PROJECT_PATH.replace(/\//g, "-");
const SESSIONS_BASE = join(homedir(), ".claude", "projects");
const SESSION_DIR = join(SESSIONS_BASE, ENCODED_PROJECT);

beforeAll(async () => {
	// Create the fake project directory (so decodeProjectPath can verify it exists)
	await mkdir(TEST_PROJECT_PATH, { recursive: true });

	// Create session directory in ~/.claude/projects/
	await mkdir(SESSION_DIR, { recursive: true });

	// Write test session files
	await writeFile(join(SESSION_DIR, "session-aaa.jsonl"), SAMPLE_SESSION);
	await writeFile(join(SESSION_DIR, "session-bbb.jsonl"), SAMPLE_SESSION);
	// Subagent file — should be excluded
	await writeFile(join(SESSION_DIR, "agent-sub-001.jsonl"), "{}");
	// Non-jsonl file — should be excluded
	await writeFile(join(SESSION_DIR, "notes.txt"), "not a session");
});

afterAll(async () => {
	await rm(SESSION_DIR, { recursive: true, force: true });
	await rm(TEST_PROJECT_PATH, { recursive: true, force: true });
});

describe("ClaudeCodeAgent", () => {
	const agent = new ClaudeCodeAgent();

	test("name is Claude Code", () => {
		expect(agent.name).toBe("Claude Code");
	});

	test("getSessionsBaseDir returns ~/.claude/projects", () => {
		expect(agent.getSessionsBaseDir()).toBe(SESSIONS_BASE);
	});

	test("findProjectSessions returns session files excluding subagents", async () => {
		const sessions = await agent.findProjectSessions(TEST_PROJECT_PATH);

		expect(sessions).toHaveLength(2);

		const ids = sessions.map((s) => s.sessionId).sort();
		expect(ids).toEqual(["session-aaa", "session-bbb"]);

		for (const session of sessions) {
			expect(session.projectPath).toBe(TEST_PROJECT_PATH);
			expect(session.transcriptPath).toEndWith(".jsonl");
			// Verify the filename (not full path) doesn't start with agent-
			const filename = session.transcriptPath.split("/").pop() ?? "";
			expect(filename.startsWith("agent-")).toBe(false);
		}
	});

	test("findProjectSessions returns empty array for nonexistent project", async () => {
		const sessions = await agent.findProjectSessions(
			"/nonexistent/project/path-that-does-not-exist",
		);
		expect(sessions).toEqual([]);
	});

	test("isHookInstalled reflects hook state", () => {
		// Just verify it returns a boolean without throwing
		const result = agent.isHookInstalled();
		expect(typeof result).toBe("boolean");
	});

	test("getHookSettingsPath returns a path ending in settings.json", () => {
		const path = agent.getHookSettingsPath();
		expect(path).toEndWith("settings.json");
		expect(path).toContain(".claude");
	});
});

describe("getDefaultAgent", () => {
	test("returns a ClaudeCodeAgent instance", () => {
		const agent = getDefaultAgent();
		expect(agent).toBeInstanceOf(ClaudeCodeAgent);
		expect(agent.name).toBe("Claude Code");
	});
});
