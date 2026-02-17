import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { IngestRequest } from "../lib/types.js";
import { uploadSession } from "../lib/uploader.js";

const API_PORT = 4099;
const API_BASE = `http://localhost:${API_PORT}`;
const RPC_ENDPOINT = `${API_BASE}/rpc`;

const MONOREPO_ROOT = resolve(import.meta.dir, "..", "..", "..", "..");
const API_DIR = join(MONOREPO_ROOT, "apps", "api");

let apiProcess: ReturnType<typeof Bun.spawn> | undefined;
let bearerToken: string | undefined;
let tempDir: string;

beforeAll(async () => {
	tempDir = await mkdtemp(join(homedir(), ".rudel-api-test-"));
	const testDbPath = join(tempDir, "auth.sqlite");

	// Run better-auth migration to initialize the test SQLite DB
	const migrateProc = Bun.spawn(
		[
			"bun",
			"-e",
			`
			import Database from "bun:sqlite";
			import { betterAuth } from "better-auth";
			import { bearer } from "better-auth/plugins";
			import { getMigrations } from "better-auth/db";
			const config = {
				baseURL: "http://localhost:${API_PORT}",
				database: new Database("${testDbPath}"),
				emailAndPassword: { enabled: true },
				plugins: [bearer()],
			};
			const { runMigrations } = await getMigrations(config);
			await runMigrations();
			console.log("OK");
		`,
		],
		{ cwd: API_DIR, stdout: "pipe", stderr: "pipe" },
	);
	const migrateOut = await new Response(migrateProc.stdout).text();
	await migrateProc.exited;
	if (!migrateOut.includes("OK")) {
		const stderr = await new Response(migrateProc.stderr).text();
		throw new Error(`Migration failed: ${stderr}`);
	}

	// Start the API server using the test database
	apiProcess = Bun.spawn(["bun", join(API_DIR, "src", "index.ts")], {
		cwd: API_DIR,
		env: {
			...process.env,
			PORT: String(API_PORT),
			DATABASE_PATH: testDbPath,
		},
		stdout: "pipe",
		stderr: "pipe",
	});

	// Wait for API to be ready
	const maxWait = 10000;
	const start = Date.now();
	let ready = false;
	while (Date.now() - start < maxWait) {
		try {
			const res = await fetch(`${API_BASE}/rpc/health`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			});
			if (res.ok) {
				ready = true;
				break;
			}
		} catch {
			// Server not ready yet
		}
		await new Promise((r) => setTimeout(r, 200));
	}

	if (!ready) {
		const stderr =
			apiProcess.stderr instanceof ReadableStream
				? await new Response(apiProcess.stderr).text()
				: "";
		throw new Error(`API server failed to start: ${stderr}`);
	}

	// Sign up a test user via better-auth
	const signupRes = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: `test-${Date.now()}@example.com`,
			password: "test-password-123",
			name: "Test User",
		}),
	});

	if (!signupRes.ok) {
		const body = await signupRes.text();
		throw new Error(`Signup failed (${signupRes.status}): ${body}`);
	}

	const signupData = (await signupRes.json()) as {
		token?: string;
	};
	bearerToken = signupData.token;

	// If no token in signup response, extract session token from cookies
	if (!bearerToken) {
		const cookies = signupRes.headers.getSetCookie();
		const sessionCookie = cookies
			.find((c) => c.startsWith("better-auth.session_token="))
			?.split("=")[1]
			?.split(";")[0];
		if (sessionCookie) {
			bearerToken = sessionCookie;
		}
	}
}, 20000);

afterAll(async () => {
	if (apiProcess) {
		apiProcess.kill();
		await apiProcess.exited;
	}
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
			endpoint: RPC_ENDPOINT,
			// biome-ignore lint/style/noNonNullAssertion: validated above
			token: bearerToken!,
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
			JSON.stringify({ token: bearerToken, apiBaseUrl: RPC_ENDPOINT }),
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
			["bun", cliPath, "upload", sessionFile, "--endpoint", RPC_ENDPOINT],
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
			endpoint: RPC_ENDPOINT,
			token: "invalid-token",
		});

		expect(result.success).toBe(false);
	});
});
