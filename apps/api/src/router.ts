import { clickhouse } from "./clickhouse.js";
import { ingestSession } from "./ingest.js";
import { authMiddleware, os } from "./middleware.js";

const health = os.health.handler(() => {
	return {
		status: "ok" as const,
		timestamp: Date.now(),
	};
});

const me = os.me.use(authMiddleware).handler(({ context }) => {
	return {
		id: context.user.id,
		email: context.user.email,
		name: context.user.name,
	};
});

const ingestSessionHandler = os.ingestSession
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		await ingestSession(clickhouse, input, {
			userId: context.user.id,
			organizationId: context.user.id,
		});

		return {
			success: true as const,
			sessionId: input.sessionId,
		};
	});

export const router = os.router({
	health,
	me,
	ingestSession: ingestSessionHandler,
});
