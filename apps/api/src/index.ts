import { join } from "node:path";
import { RPCHandler } from "@orpc/server/fetch";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { createAuth } from "./auth.js";
import { db } from "./db.js";
import { router } from "./router.js";

const migrationsFolder = join(
	import.meta.dir,
	"..",
	"..",
	"..",
	"packages",
	"sql-schema",
	"db",
	"migrations",
);
migrate(db, { migrationsFolder });

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
});

const rpcHandler = new RPCHandler(router);

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

Bun.serve({
	port,
	async fetch(request) {
		const origin = request.headers.get("Origin");
		const cors = corsHeaders(origin);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: cors });
		}

		const url = new URL(request.url);

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

		return new Response("Not found", { status: 404, headers: cors });
	},
});

async function getContext(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return {
		user: session?.user ?? null,
		session: session?.session ?? null,
	};
}

console.log(`API server listening on http://localhost:${port}`);
