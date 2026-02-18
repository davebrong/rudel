import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IngestRequest } from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";
import {
	signUpTestUser,
	startTestWorker,
	type TestWorker,
} from "./helpers/wrangler-server.js";

let worker: TestWorker;
let bearerToken: string;
let tempDir: string;

beforeAll(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "rudel-api-test-"));
	worker = await startTestWorker();
	bearerToken = await signUpTestUser(worker.baseUrl);
}, 60_000);

afterAll(async () => {
	await worker?.stop();
	if (tempDir) {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
});

describe("CLI upload to local API", () => {
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

		const result = await uploadSession(request, {
			endpoint: worker.rpcUrl,
			token: bearerToken,
		});

		expect(result.success).toBe(true);
		expect(result.status).toBe(200);
	});

	test("full CLI upload via subprocess to local API", async () => {
		expect(bearerToken).toBeTruthy();

		const projectDir = join(tempDir, "cli-e2e-test");
		await mkdir(projectDir, { recursive: true });

		// Write credentials file so the CLI subprocess can authenticate
		const credDir = join(tempDir, "cli-creds");
		await mkdir(credDir, { recursive: true });
		await writeFile(
			join(credDir, "credentials.json"),
			JSON.stringify({ token: bearerToken, apiBaseUrl: worker.rpcUrl }),
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
		const proc = Bun.spawn(
			["bun", cliPath, "upload", sessionFile, "--endpoint", worker.rpcUrl],
			{
				stdout: "pipe",
				stderr: "pipe",
				env: {
					...process.env,
					RUDEL_CONFIG_DIR: credDir,
				},
			},
		);

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		expect(stdout).toContain("Upload successful!");
		expect(exitCode).toBe(0);
		if (stderr) {
			expect(stderr).toBe("");
		}
	});

	test("rejects unauthenticated requests", async () => {
		const request: IngestRequest = {
			sessionId: "unauth-test",
			projectPath: "/test/unauth",
			content: "should fail",
		};

		const result = await uploadSession(request, {
			endpoint: worker.rpcUrl,
			token: "invalid-token",
		});

		expect(result.success).toBe(false);
	});
});
