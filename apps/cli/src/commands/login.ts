import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import * as p from "@clack/prompts";
import { buildCommand } from "@stricli/core";
import { loadCredentials, saveCredentials } from "../lib/credentials.js";

const DEFAULT_API_BASE = "https://app.rudel.ai";
const DEFAULT_WEB_URL = "https://app.rudel.ai";
const CALLBACK_TIMEOUT_MS = 120_000;

async function runLogin(flags: {
	apiBase: string;
	webUrl: string;
	noBrowser: boolean;
}): Promise<void> {
	p.intro("rudel login");

	const existing = loadCredentials();
	if (existing) {
		p.log.warn("Already logged in.");
		p.outro("Run `rudel logout` first to switch accounts.");
		return;
	}

	const state = randomBytes(16).toString("hex");

	let resolveCallback: (token: string) => void;
	let rejectCallback: (error: Error) => void;
	const tokenPromise = new Promise<string>((resolve, reject) => {
		resolveCallback = resolve;
		rejectCallback = reject;
	});

	const server = createServer((req: IncomingMessage, res: ServerResponse) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
		if (url.pathname !== "/callback") {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not found");
			return;
		}

		const receivedToken = url.searchParams.get("token");
		const receivedState = url.searchParams.get("state");

		if (receivedState !== state) {
			rejectCallback(new Error("State mismatch — possible CSRF attack"));
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(
				"<html><body><h1>Login failed</h1><p>State mismatch. Please try again.</p></body></html>",
			);
			return;
		}

		if (!receivedToken) {
			rejectCallback(new Error("No token received"));
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(
				"<html><body><h1>Login failed</h1><p>No token received.</p></body></html>",
			);
			return;
		}

		resolveCallback(receivedToken);
		res.writeHead(200, { "Content-Type": "text/html" });
		res.end(
			"<html><body><h1>Login successful!</h1><p>You can close this tab and return to the terminal.</p></body></html>",
		);
	});

	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", resolve);
	});

	const port = (server.address() as AddressInfo).port;
	const callbackUrl = `http://127.0.0.1:${port}/callback`;
	const loginUrl = `${flags.webUrl}?cli_callback=${encodeURIComponent(callbackUrl)}&state=${state}`;

	p.log.info(`If the browser doesn't open, visit:\n${loginUrl}`);

	// Open browser
	if (!flags.noBrowser) {
		if (process.platform === "win32") {
			const child = spawn("cmd", ["/c", "start", "", loginUrl], {
				detached: true,
				stdio: "ignore",
			});
			child.unref();
		} else {
			const opener = process.platform === "darwin" ? "open" : "xdg-open";
			const child = spawn(opener, [loginUrl], {
				detached: true,
				stdio: "ignore",
			});
			child.unref();
		}
	}

	// Wait for callback with timeout
	const timeout = setTimeout(() => {
		rejectCallback(new Error("Login timed out after 120 seconds"));
	}, CALLBACK_TIMEOUT_MS);

	const spin = p.spinner();
	spin.start("Waiting for browser authentication...");

	let token: string;
	try {
		token = await tokenPromise;
	} catch (error) {
		clearTimeout(timeout);
		server.close();
		spin.stop("Authentication failed");
		p.log.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
		return;
	}
	clearTimeout(timeout);
	server.close();

	spin.message("Validating token...");

	// Validate token via /rpc/me
	const meResponse = await fetch(`${flags.apiBase}/rpc/me`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({}),
	});

	if (!meResponse.ok) {
		spin.stop("Token validation failed");
		p.log.error("Login failed: token validation failed");
		process.exitCode = 1;
		return;
	}

	const body = (await meResponse.json()) as {
		json: { id: string; email: string; name: string };
	};

	saveCredentials(token, flags.apiBase);
	spin.stop("Authenticated");
	p.log.success(`Logged in as ${body.json.name} (${body.json.email})`);
	p.outro("Done!");
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
			noBrowser: {
				kind: "boolean",
				brief: "Skip opening the browser automatically",
				default: false,
			},
		},
	},
	docs: {
		brief: "Authenticate with the Rudel API via browser login",
	},
});
