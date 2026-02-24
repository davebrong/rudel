import { resolve } from "node:path";

const MONOREPO_ROOT = resolve(import.meta.dir, "..", "..", "..", "..", "..");

export interface TestServer {
	port: number;
	baseUrl: string;
	rpcUrl: string;
	stop: () => Promise<void>;
}

/**
 * Spawn the Bun API server with PORT=0 so the OS picks a free port.
 * Migrations run automatically at startup.
 */
export async function startTestServer(): Promise<TestServer> {
	const proc = Bun.spawn(["bun", "apps/api/src/index.ts"], {
		cwd: MONOREPO_ROOT,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			PORT: "0",
			APP_URL: "http://localhost",
			BETTER_AUTH_SECRET: "test-secret-for-integration-tests",
			ALLOWED_ORIGIN: "http://localhost",
		},
	});

	// Prevent Bun's test runner from tracking and killing this process between tests
	proc.unref();

	const port = await parseReadyPort(proc);

	// Drain stdout/stderr in the background to prevent pipe buffer deadlock.
	// Without this, the server blocks if it writes more than the OS pipe buffer (~64KB).
	if (proc.stdout instanceof ReadableStream) {
		proc.stdout.pipeTo(new WritableStream()).catch(() => {});
	}
	if (proc.stderr instanceof ReadableStream) {
		proc.stderr.pipeTo(new WritableStream()).catch(() => {});
	}

	const baseUrl = `http://localhost:${port}`;
	const rpcUrl = `${baseUrl}/rpc`;

	// Wait until the server actually responds to HTTP requests.
	// The "listening on" log can appear before the server is fully ready.
	await waitForReady(baseUrl);

	return {
		port,
		baseUrl,
		rpcUrl,
		async stop() {
			proc.kill();
			await proc.exited;
		},
	};
}

/**
 * Read stdout line-by-line until the server prints its "listening on" URL,
 * then extract the port from it.
 */
async function parseReadyPort(
	proc: ReturnType<typeof Bun.spawn>,
): Promise<number> {
	const stdout = proc.stdout;
	if (!stdout || !(stdout instanceof ReadableStream)) {
		throw new Error("Server process has no readable stdout");
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

			// index.ts prints: "API server listening on http://localhost:<port>"
			const match = buffer.match(/listening on https?:\/\/localhost:(\d+)/i);
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
		`Server did not become ready within 30 s.\nstdout buffer: ${buffer}\nstderr: ${stderrText}`,
	);
}

/**
 * Poll the server until it responds to a GET request.
 * Retries every 200ms for up to 10s.
 */
async function waitForReady(baseUrl: string): Promise<void> {
	const deadline = Date.now() + 10_000;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(`${baseUrl}/health`, {
				signal: AbortSignal.timeout(2000),
			});
			if (res.ok) return;
		} catch {
			// Connection refused or timeout — retry
		}
		await Bun.sleep(200);
	}
	throw new Error(
		`Server at ${baseUrl} did not respond within 10s after port was detected`,
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
