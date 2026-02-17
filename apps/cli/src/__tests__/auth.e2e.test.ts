import {
	afterAll,
	beforeAll,
	describe,
	expect,
	setDefaultTimeout,
	test,
} from "bun:test";

setDefaultTimeout(30_000);

import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Subprocess } from "bun";

let apiProcess: Subprocess;
let apiPort: number;
let apiBaseUrl: string;
let tempDir: string;
let configDir: string;
let sessionToken: string;

async function waitForServer(url: string, timeoutMs = 10_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			});
			if (res.ok) return;
		} catch {
			// not ready yet
		}
		await Bun.sleep(100);
	}
	throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

beforeAll(async () => {
	// Create temp directories
	tempDir = mkdtempSync(join(tmpdir(), "rudel-auth-test-"));
	configDir = join(tempDir, "config");
	mkdirSync(configDir, { recursive: true });

	// Create data dir for SQLite DB
	const dataDir = join(tempDir, "data");
	mkdirSync(dataDir, { recursive: true });

	// Find a free port by briefly binding
	const tempServer = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch: () => new Response(""),
	});
	apiPort = tempServer.port as number;
	tempServer.stop(true);

	apiBaseUrl = `http://localhost:${apiPort}`;

	// Start real API server with test PORT and working directory
	const apiEntrypoint = join(
		import.meta.dir,
		"..",
		"..",
		"..",
		"api",
		"src",
		"index.ts",
	);
	apiProcess = Bun.spawn(["bun", apiEntrypoint], {
		env: {
			...process.env,
			PORT: String(apiPort),
		},
		cwd: tempDir,
		stdout: "ignore",
		stderr: "ignore",
	});

	// Wait for server to be ready
	await waitForServer(`${apiBaseUrl}/rpc/health`, 15_000);

	// Create a test user via sign-up and extract session token
	const signupResponse = await fetch(`${apiBaseUrl}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Test User",
			email: "test@example.com",
			password: "testpassword123",
		}),
	});

	expect(signupResponse.ok).toBe(true);

	// Extract session token from response body
	const signupData = (await signupResponse.json()) as { token: string };
	sessionToken = signupData.token;
});

afterAll(async () => {
	if (apiProcess) {
		apiProcess.kill();
		await apiProcess.exited;
	}
	rmSync(tempDir, { recursive: true, force: true });
});

describe("auth e2e", () => {
	test("login: callback server receives token and stores credentials", async () => {
		// Clear any existing credentials first
		clearCredentialsFromDir(configDir);

		const cliPath = join(import.meta.dir, "..", "bin", "cli.ts");
		const stdoutLogPath = join(tempDir, "login-stdout.log");

		// Start login via shell, tee stdout to a file so we can poll it
		const loginProcess = Bun.spawn(
			[
				"bash",
				"-c",
				`bun "${cliPath}" login --api-base="${apiBaseUrl}" --web-url=http://localhost:9999 2>&1 | tee "${stdoutLogPath}"`,
			],
			{
				env: {
					...process.env,
					RUDEL_CONFIG_DIR: configDir,
				},
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		// Poll the log file for the "Opening browser" message
		const { readFileSync, existsSync } = require("node:fs");
		let output = "";
		const deadline = Date.now() + 10_000;

		while (Date.now() < deadline) {
			if (existsSync(stdoutLogPath)) {
				output = readFileSync(stdoutLogPath, "utf-8");
				if (output.includes("Opening browser")) break;
			}
			await Bun.sleep(100);
		}

		// Extract the callback URL from the output
		const callbackMatch = output.match(/cli_callback=([^&]+)/);
		expect(callbackMatch).not.toBeNull();
		const callbackUrl = decodeURIComponent(callbackMatch?.[1] ?? "");

		// Extract the state
		const stateMatch = output.match(/state=([a-f0-9]+)/);
		expect(stateMatch).not.toBeNull();
		const state = stateMatch?.[1] ?? "";

		// Simulate what the web app does: hit the callback with token + state
		const callbackResponse = await fetch(
			`${callbackUrl}?token=${sessionToken}&state=${state}`,
		);
		expect(callbackResponse.ok).toBe(true);
		const callbackBody = await callbackResponse.text();
		expect(callbackBody).toContain("Login successful");

		// Wait for the process to finish
		const exitCode = await loginProcess.exited;
		expect(exitCode).toBe(0);

		// Verify credentials were stored
		const savedCredentials = loadCredentialsFromDir(configDir);
		expect(savedCredentials).not.toBeNull();
		expect(savedCredentials?.token).toBe(sessionToken);
		expect(savedCredentials?.apiBaseUrl).toBe(apiBaseUrl);
	});

	test("whoami: shows user info with valid credentials", async () => {
		// Ensure credentials are stored
		saveCredentialsToDir(configDir, sessionToken, apiBaseUrl);

		const cliPath = join(import.meta.dir, "..", "bin", "cli.ts");
		const proc = Bun.spawn(["bun", cliPath, "whoami"], {
			env: {
				...process.env,
				RUDEL_CONFIG_DIR: configDir,
			},
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		expect(exitCode).toBe(0);
		expect(stdout).toContain("Test User");
		expect(stdout).toContain("test@example.com");
		expect(stderr).toBe("");
	});

	test("logout: clears credentials", async () => {
		// Ensure credentials exist
		saveCredentialsToDir(configDir, sessionToken, apiBaseUrl);

		const cliPath = join(import.meta.dir, "..", "bin", "cli.ts");
		const proc = Bun.spawn(["bun", cliPath, "logout"], {
			env: {
				...process.env,
				RUDEL_CONFIG_DIR: configDir,
			},
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();

		expect(exitCode).toBe(0);
		expect(stdout).toContain("Logged out successfully");

		// Verify credentials are gone
		const credentials = loadCredentialsFromDir(configDir);
		expect(credentials).toBeNull();
	});

	test("whoami: shows not logged in after logout", async () => {
		// Ensure no credentials
		clearCredentialsFromDir(configDir);

		const cliPath = join(import.meta.dir, "..", "bin", "cli.ts");
		const proc = Bun.spawn(["bun", cliPath, "whoami"], {
			env: {
				...process.env,
				RUDEL_CONFIG_DIR: configDir,
			},
			stdout: "pipe",
			stderr: "pipe",
		});

		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();

		expect(exitCode).toBe(0);
		expect(stdout).toContain("Not logged in");
	});
});

// Helpers that operate on a specific config dir (matching the RUDEL_CONFIG_DIR env var)
function saveCredentialsToDir(
	dir: string,
	token: string,
	apiBaseUrl: string,
): void {
	const { writeFileSync } = require("node:fs");
	writeFileSync(
		join(dir, "credentials.json"),
		JSON.stringify({ token, apiBaseUrl }, null, 2),
		{ mode: 0o600 },
	);
}

function loadCredentialsFromDir(
	dir: string,
): { token: string; apiBaseUrl: string } | null {
	const path = join(dir, "credentials.json");
	try {
		const { readFileSync } = require("node:fs");
		const content = readFileSync(path, "utf-8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

function clearCredentialsFromDir(dir: string): void {
	const path = join(dir, "credentials.json");
	try {
		const { rmSync } = require("node:fs");
		rmSync(path);
	} catch {
		// already gone
	}
}
