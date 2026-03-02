import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IngestRequest } from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";
import {
	signUpTestUser,
	startTestServer,
	type TestServer,
} from "./helpers/bun-server.js";

let server: TestServer;
let bearerToken: string;
let tempDir: string;

beforeAll(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "rudel-api-test-"));
	server = await startTestServer();
	bearerToken = await signUpTestUser(server.baseUrl);
}, 60_000);

afterAll(async () => {
	await server?.stop();
	if (tempDir) {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});

describe("CLI upload to local API", () => {
	// Bun's test runner may kill the server as a "dangling process" between
	// beforeAll and the first test, or between tests. Restart it if needed.
	beforeEach(async () => {
		await server.ensureAlive();
	});

	test("uploads a session via uploadSession to the local API", async () => {
		expect(bearerToken).toBeTruthy();

		const testId = `cli_api_test_${Date.now()}`;
		const request: IngestRequest = {
			sessionId: testId,
			projectPath: "/test/cli-api-upload",
			repository: "test-repo",
			gitBranch: "main",
			gitSha: "abc123",
			tag: "tests",
			content: "cli api integration test content",
			subagents: [{ agentId: "sub-1", content: "subagent content" }],
		};

		// Retry up to 3 times — ClickHouse can be slow to accept
		// the first request after startup.
		let result = { success: false, error: "not attempted" } as Awaited<
			ReturnType<typeof uploadSession>
		>;
		for (let attempt = 0; attempt < 3; attempt++) {
			result = await uploadSession(request, {
				endpoint: server.rpcUrl,
				token: bearerToken,
			});
			if (result.success) break;
			await Bun.sleep(1000);
		}

		if (!result.success) {
			throw new Error(`uploadSession failed after 3 attempts: ${result.error}`);
		}
		expect(result.status).toBe(200);
	}, 30_000);

	test("full CLI upload via subprocess to local API", async () => {
		expect(bearerToken).toBeTruthy();

		const projectDir = join(tempDir, "cli-e2e-test");
		await mkdir(projectDir, { recursive: true });

		// Write credentials file using the current server URL (port may have changed)
		const credDir = join(tempDir, "cli-creds");
		await mkdir(credDir, { recursive: true });
		await writeFile(
			join(credDir, "credentials.json"),
			JSON.stringify({ token: bearerToken, apiBaseUrl: server.baseUrl }),
		);

		const sessionFile = join(projectDir, "e2e-test-session.jsonl");
		await writeFile(
			sessionFile,
			[
				JSON.stringify({
					type: "summary",
					sessionId: "e2e-test-session",
				}),
				JSON.stringify({
					type: "message",
					role: "human",
					content: "test",
				}),
			].join("\n"),
		);

		const cliPath = join(import.meta.dir, "..", "bin", "cli.ts");

		// Retry up to 3 times — the server may need a moment after restart
		// before ClickHouse accepts inserts (same pattern as the direct-call test).
		let lastStdout = "";
		let lastStderr = "";
		let lastExitCode = -1;
		for (let attempt = 0; attempt < 3; attempt++) {
			const proc = Bun.spawn(
				["bun", cliPath, "upload", sessionFile, "--endpoint", server.rpcUrl],
				{
					stdin: "ignore",
					stdout: "pipe",
					stderr: "pipe",
					env: {
						...process.env,
						RUDEL_CONFIG_DIR: credDir,
					},
				},
			);

			const [exitCode, stdout, stderr] = await Promise.all([
				proc.exited,
				new Response(proc.stdout).text(),
				new Response(proc.stderr).text(),
			]);

			lastStdout = stdout;
			lastStderr = stderr;
			lastExitCode = exitCode;

			if (stdout.includes("Upload successful!")) break;
			await Bun.sleep(1000);
		}

		if (!lastStdout.includes("Upload successful!")) {
			throw new Error(
				`Expected "Upload successful!" in stdout after 3 attempts.\n` +
					`Exit code: ${lastExitCode}\n` +
					`stdout: ${lastStdout}\n` +
					`stderr: ${lastStderr}`,
			);
		}
		expect(lastExitCode).toBe(0);
	}, 60_000);

	test("rejects unauthenticated requests", async () => {
		const request: IngestRequest = {
			sessionId: "unauth-test",
			projectPath: "/test/unauth",
			content: "should fail",
		};

		const result = await uploadSession(request, {
			endpoint: server.rpcUrl,
			token: "invalid-token",
		});

		expect(result.success).toBe(false);
	});
});
