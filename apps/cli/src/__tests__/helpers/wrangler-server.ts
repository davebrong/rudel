import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Subprocess } from "bun";

const MONOREPO_ROOT = resolve(import.meta.dir, "..", "..", "..", "..", "..");

export interface TestWorker {
	port: number;
	baseUrl: string;
	rpcUrl: string;
	stop: () => Promise<void>;
}

/**
 * Spawn `wrangler dev` against the real worker entrypoint + D1,
 * writing a temp `.dev.vars` with env vars needed for tests.
 */
export async function startTestWorker(): Promise<TestWorker> {
	const persistDir = await mkdtemp(join(tmpdir(), "rudel-wrangler-test-"));

	// Build .dev.vars content
	const devVarsLines: string[] = [
		'APP_URL = "http://localhost"',
		'BETTER_AUTH_SECRET = "test-secret-for-integration-tests"',
		'ALLOWED_ORIGIN = "http://localhost"',
	];

	// Forward ClickHouse vars from the environment (Doppler injects these in CI)
	for (const key of [
		"CLICKHOUSE_URL",
		"CLICKHOUSE_USERNAME",
		"CLICKHOUSE_PASSWORD",
	]) {
		const value =
			process.env[key] ||
			(key === "CLICKHOUSE_USERNAME" ? process.env.CLICKHOUSE_USER : undefined);
		if (value) {
			devVarsLines.push(`${key} = "${value}"`);
		}
	}

	const devVarsPath = join(persistDir, ".dev.vars");
	await writeFile(devVarsPath, devVarsLines.join("\n"));

	// Ensure the assets directory exists (wrangler.json references apps/web/dist)
	await mkdir(join(MONOREPO_ROOT, "apps", "web", "dist"), { recursive: true });

	// Apply D1 migrations so the database schema exists
	const migrateProc = Bun.spawn(
		[
			"npx",
			"wrangler",
			"d1",
			"migrations",
			"apply",
			"rudel",
			"--local",
			`--persist-to=${persistDir}`,
		],
		{
			cwd: MONOREPO_ROOT,
			stdout: "pipe",
			stderr: "pipe",
		},
	);
	await migrateProc.exited;
	if (migrateProc.exitCode !== 0) {
		const stderr = await new Response(migrateProc.stderr).text();
		throw new Error(`D1 migration failed: ${stderr}`);
	}

	const proc = Bun.spawn(
		[
			"npx",
			"wrangler",
			"dev",
			"--port=0",
			`--persist-to=${persistDir}`,
			`--env-file=${devVarsPath}`,
		],
		{
			cwd: MONOREPO_ROOT,
			stdout: "pipe",
			stderr: "pipe",
			env: {
				...process.env,
			},
		},
	);

	const port = await parseReadyPort(proc);

	const baseUrl = `http://localhost:${port}`;
	const rpcUrl = `${baseUrl}/rpc`;

	return {
		port,
		baseUrl,
		rpcUrl,
		async stop() {
			proc.kill();
			await proc.exited;
			await rm(persistDir, { recursive: true, force: true }).catch(() => {});
		},
	};
}

/**
 * Read stdout line-by-line until wrangler prints its "Ready on" URL,
 * then extract the port from it.
 */
async function parseReadyPort(proc: Subprocess): Promise<number> {
	const stdout = proc.stdout;
	if (!stdout || !(stdout instanceof ReadableStream)) {
		throw new Error("wrangler process has no readable stdout");
	}

	const reader = stdout.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	const deadline = Date.now() + 30_000;

	try {
		while (Date.now() < deadline) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			// wrangler prints: "Ready on http://localhost:<port>"
			const match = buffer.match(/Ready on https?:\/\/localhost:(\d+)/i);
			if (match?.[1]) {
				reader.releaseLock();
				return Number.parseInt(match[1], 10);
			}
		}
	} catch {
		// reader error — fall through to throw
	}

	// If we get here we failed — grab stderr for diagnostics
	let stderrText = "";
	if (proc.stderr instanceof ReadableStream) {
		stderrText = await new Response(proc.stderr).text();
	}

	proc.kill();
	throw new Error(
		`wrangler dev did not become ready within 30 s.\nstdout buffer: ${buffer}\nstderr: ${stderrText}`,
	);
}

/**
 * Create a test user via better-auth sign-up and return a bearer token.
 */
export async function signUpTestUser(baseUrl: string): Promise<string> {
	const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: `test-${Date.now()}@example.com`,
			password: "test-password-123",
			name: "Test User",
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Sign-up failed (${res.status}): ${body}`);
	}

	const data = (await res.json()) as { token?: string };

	if (data.token) return data.token;

	// Fallback: extract session token from set-cookie header
	const cookies = res.headers.getSetCookie();
	const sessionCookie = cookies
		.find((c) => c.startsWith("better-auth.session_token="))
		?.split("=")[1]
		?.split(";")[0];

	if (sessionCookie) return sessionCookie;

	throw new Error("Could not extract token from sign-up response");
}
