import { randomBytes } from "node:crypto";
import { buildCommand } from "@stricli/core";
import { loadCredentials, saveCredentials } from "../lib/credentials.js";

const DEFAULT_API_BASE = "http://localhost:4010";
const DEFAULT_WEB_URL = "http://localhost:4011";
const CALLBACK_TIMEOUT_MS = 120_000;

async function runLogin(flags: {
	apiBase: string;
	webUrl: string;
}): Promise<void> {
	const write = (msg: string) => process.stdout.write(`${msg}\n`);
	const writeError = (msg: string) => process.stderr.write(`${msg}\n`);

	const existing = loadCredentials();
	if (existing) {
		write("Already logged in. Run `rudel logout` first to switch accounts.");
		return;
	}

	const state = randomBytes(16).toString("hex");

	let resolveCallback: (token: string) => void;
	let rejectCallback: (error: Error) => void;
	const tokenPromise = new Promise<string>((resolve, reject) => {
		resolveCallback = resolve;
		rejectCallback = reject;
	});

	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(request) {
			const url = new URL(request.url);
			if (url.pathname !== "/callback") {
				return new Response("Not found", { status: 404 });
			}

			const receivedToken = url.searchParams.get("token");
			const receivedState = url.searchParams.get("state");

			if (receivedState !== state) {
				rejectCallback(new Error("State mismatch — possible CSRF attack"));
				return new Response(
					"<html><body><h1>Login failed</h1><p>State mismatch. Please try again.</p></body></html>",
					{ headers: { "Content-Type": "text/html" } },
				);
			}

			if (!receivedToken) {
				rejectCallback(new Error("No token received"));
				return new Response(
					"<html><body><h1>Login failed</h1><p>No token received.</p></body></html>",
					{ headers: { "Content-Type": "text/html" } },
				);
			}

			resolveCallback(receivedToken);
			return new Response(
				"<html><body><h1>Login successful!</h1><p>You can close this tab and return to the terminal.</p></body></html>",
				{ headers: { "Content-Type": "text/html" } },
			);
		},
	});

	const callbackUrl = `http://127.0.0.1:${server.port}/callback`;
	const loginUrl = `${flags.webUrl}?cli_callback=${encodeURIComponent(callbackUrl)}&state=${state}`;

	write("Opening browser for authentication...");
	write(`If the browser doesn't open, visit: ${loginUrl}`);

	// Open browser
	const opener =
		process.platform === "darwin"
			? "open"
			: process.platform === "win32"
				? "start"
				: "xdg-open";
	Bun.spawn([opener, loginUrl], { stdout: "ignore", stderr: "ignore" });

	// Wait for callback with timeout
	const timeout = setTimeout(() => {
		rejectCallback(new Error("Login timed out after 120 seconds"));
	}, CALLBACK_TIMEOUT_MS);

	let token: string;
	try {
		token = await tokenPromise;
	} catch (error) {
		clearTimeout(timeout);
		server.stop();
		writeError(
			`Login failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
		return;
	}
	clearTimeout(timeout);
	server.stop();

	// Validate token via /rpc/me
	write("Validating token...");
	const meResponse = await fetch(`${flags.apiBase}/rpc/me`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({}),
	});

	if (!meResponse.ok) {
		writeError("Login failed: token validation failed");
		process.exitCode = 1;
		return;
	}

	const body = (await meResponse.json()) as {
		json: { id: string; email: string; name: string };
	};

	saveCredentials(token, flags.apiBase);
	write(`Logged in as ${body.json.name} (${body.json.email})`);
}

export const loginCommand = buildCommand({
	loader: async () => ({ default: runLogin }),
	parameters: {
		flags: {
			apiBase: {
				kind: "parsed",
				parse: String,
				brief: "API server base URL",
				default: DEFAULT_API_BASE,
			},
			webUrl: {
				kind: "parsed",
				parse: String,
				brief: "Web app URL for authentication",
				default: DEFAULT_WEB_URL,
			},
		},
	},
	docs: {
		brief: "Authenticate with the Rudel API via browser login",
	},
});
