import { RPCHandler } from "@orpc/server/fetch";
import { auth } from "./auth.js";
import { router } from "./router.js";

const rpcHandler = new RPCHandler(router);

// Auto-create tables on startup (no-op if they already exist)
const ctx = await auth.$context;
await ctx.runMigrations();

const ALLOWED_ORIGIN = "http://localhost:4011";

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
