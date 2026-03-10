import { join } from "node:path";
import { getLogger, withContext } from "@logtape/logtape";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { createAuth } from "./auth.js";
import { db } from "./db.js";
import { setupLogging } from "./logging.js";
import { router } from "./router.js";

await setupLogging();

const logger = getLogger(["rudel", "api", "http"]);

const socialProviders: Record<
	string,
	{ clientId: string; clientSecret: string }
> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	socialProviders.google = {
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	};
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
	socialProviders.github = {
		clientId: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
	};
}

const appURL = process.env.APP_URL ?? "http://localhost:4010";
const trustedOrigins = process.env.TRUSTED_ORIGINS
	? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
	: ["http://localhost:4011"];

const auth = createAuth(db, {
	appURL,
	secret: process.env.BETTER_AUTH_SECRET,
	socialProviders,
	trustedOrigins,
	slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
});

const rpcHandler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			logger.error("RPC unhandled exception: {error} {stack}", {
				error: String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
		}),
	],
});

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:4011";
const STATIC_DIR = join(
	import.meta.dir,
	"..",
	process.env.STATIC_DIR ?? "public",
);

function corsHeaders(origin: string | null): Record<string, string> {
	if (origin !== ALLOWED_ORIGIN) return {};
	return {
		"Access-Control-Allow-Origin": ALLOWED_ORIGIN,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};
}

const port = process.env.PORT ?? 4010;

const server = Bun.serve({
	port,
	async fetch(request) {
		const origin = request.headers.get("Origin");
		const cors = corsHeaders(origin);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: cors });
		}

		const url = new URL(request.url);

		// Health check for Fly.io (must be GET-accessible)
		if (url.pathname === "/health") {
			return Response.json({ status: "ok", timestamp: Date.now() });
		}

		const requestId = crypto.randomUUID();
		const start = performance.now();

		return withContext(
			{ requestId, method: request.method, path: url.pathname },
			async () => {
				const response = await handleRequest(request, url, cors);
				const duration = Math.round(performance.now() - start);
				logger.info("{method} {path} {status} {duration}ms", {
					method: request.method,
					path: url.pathname,
					status: response.status,
					duration,
				});
				return response;
			},
		);
	},
});

async function handleRequest(
	request: Request,
	url: URL,
	cors: Record<string, string>,
): Promise<Response> {
	if (url.pathname === "/api/cli-token") {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session) {
			return new Response(JSON.stringify({ error: "Not authenticated" }), {
				status: 401,
				headers: { ...cors, "Content-Type": "application/json" },
			});
		}
		return new Response(JSON.stringify({ token: session.session.token }), {
			status: 200,
			headers: { ...cors, "Content-Type": "application/json" },
		});
	}

	if (url.pathname.startsWith("/api/auth")) {
		const response = await auth.handler(request);
		for (const [key, value] of Object.entries(cors)) {
			response.headers.set(key, value);
		}
		return response;
	}

	const { matched, response } = await rpcHandler.handle(request, {
		prefix: "/rpc",
		context: await getContext(request),
	});

	if (matched) {
		if (response.status >= 500) {
			const body = await response.clone().text();
			logger.error("RPC error on {path}: {status} {body}", {
				path: url.pathname,
				status: response.status,
				body,
			});
		}
		for (const [key, value] of Object.entries(cors)) {
			response.headers.set(key, value);
		}
		return response;
	}

	// Static file serving (production: frontend assets)
	const filePath = join(STATIC_DIR, url.pathname);
	const file = Bun.file(filePath);
	if (await file.exists()) {
		return new Response(file);
	}

	// SPA fallback: serve index.html for non-API routes
	const indexFile = Bun.file(join(STATIC_DIR, "index.html"));
	if (await indexFile.exists()) {
		return new Response(indexFile);
	}

	// Dev mode: redirect to frontend dev server for non-API routes
	// (e.g., after OAuth callback redirects to APP_URL which has no SPA)
	if (ALLOWED_ORIGIN !== appURL) {
		return Response.redirect(
			`${ALLOWED_ORIGIN}${url.pathname}${url.search}`,
			302,
		);
	}

	return new Response("Not found", { status: 404, headers: cors });
}

async function getContext(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return {
		user: session?.user ?? null,
		session: session?.session ?? null,
	};
}

logger.info("API server listening on http://localhost:{port}", {
	port: server.port,
});
