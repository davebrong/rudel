/// <reference types="@cloudflare/workers-types" />

import { RPCHandler } from "@orpc/server/fetch";
import * as schema from "@rudel/sql-schema";
import { drizzle } from "drizzle-orm/d1";
import { createAuth } from "./auth.js";
import { getClickhouse } from "./clickhouse.js";
import { ingestSession } from "./ingest.js";
import { authMiddleware, os } from "./middleware.js";

interface Env {
	DB: D1Database;
	APP_URL: string;
	BETTER_AUTH_SECRET: string;
	ALLOWED_ORIGIN: string;
	TRUSTED_ORIGINS?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	CLICKHOUSE_URL: string;
	CLICKHOUSE_USERNAME?: string;
	CLICKHOUSE_PASSWORD?: string;
}

function buildRouter() {
	const health = os.health.handler(() => ({
		status: "ok" as const,
		timestamp: Date.now(),
	}));

	const me = os.me.use(authMiddleware).handler(({ context }) => ({
		id: context.user.id,
		email: context.user.email,
		name: context.user.name,
	}));

	const ingestSessionHandler = os.ingestSession
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			await ingestSession(getClickhouse(), input, {
				userId: context.user.id,
				organizationId: context.user.id,
			});
			return { success: true as const, sessionId: input.sessionId };
		});

	return os.router({ health, me, ingestSession: ingestSessionHandler });
}

function corsHeaders(
	origin: string | null,
	allowedOrigin: string,
): Record<string, string> {
	if (origin !== allowedOrigin) return {};
	return {
		"Access-Control-Allow-Origin": allowedOrigin,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Bridge env bindings to process.env for libraries that read it
		process.env.CLICKHOUSE_URL = env.CLICKHOUSE_URL;
		process.env.CLICKHOUSE_USERNAME = env.CLICKHOUSE_USERNAME;
		process.env.CLICKHOUSE_PASSWORD = env.CLICKHOUSE_PASSWORD;

		const db = drizzle(env.DB, { schema });

		const socialProviders: Record<
			string,
			{ clientId: string; clientSecret: string }
		> = {};
		if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
			socialProviders.google = {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			};
		}
		if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
			socialProviders.github = {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			};
		}

		const trustedOrigins = env.TRUSTED_ORIGINS
			? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
			: [];

		const auth = createAuth(db, {
			appURL: env.APP_URL,
			secret: env.BETTER_AUTH_SECRET,
			socialProviders,
			trustedOrigins,
		});

		const router = buildRouter();
		const rpcHandler = new RPCHandler(router);

		const origin = request.headers.get("Origin");
		const allowedOrigin = env.ALLOWED_ORIGIN ?? env.APP_URL;
		const cors = corsHeaders(origin, allowedOrigin);

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

		const context = await (async () => {
			const session = await auth.api.getSession({
				headers: request.headers,
			});
			return {
				user: session?.user ?? null,
				session: session?.session ?? null,
			};
		})();

		const { matched, response } = await rpcHandler.handle(request, {
			prefix: "/rpc",
			context,
		});

		if (matched) {
			for (const [key, value] of Object.entries(cors)) {
				response.headers.set(key, value);
			}
			return response;
		}

		return new Response("Not found", { status: 404, headers: cors });
	},
};
