import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import type { ClickHouseStatement } from "./clickhouse.js";
import { queryClickhouse } from "./clickhouse.js";

const logger = getLogger(["rudel", "api", "rate-limit"]);

export interface RateLimitConfig {
	maxRequests: number;
	windowSeconds: number;
	countQuery: (userId: string, windowSeconds: number) => ClickHouseStatement;
}

const ingestCountQuery = (
	userId: string,
	windowSeconds: number,
): ClickHouseStatement => ({
	query:
		`SELECT sum(c) AS count FROM (` +
		`SELECT count() AS c FROM rudel.claude_sessions WHERE user_id = {userId:String} AND ingested_at >= now64(3) - INTERVAL {window:UInt32} SECOND ` +
		`UNION ALL ` +
		`SELECT count() AS c FROM rudel.codex_sessions WHERE user_id = {userId:String} AND ingested_at >= now64(3) - INTERVAL {window:UInt32} SECOND` +
		`)`,
	query_params: { userId, window: windowSeconds },
});

export const INGEST_RATE_LIMIT: RateLimitConfig = {
	maxRequests: Number(process.env.RATE_LIMIT_INGEST_MAX ?? 120),
	windowSeconds: Number(process.env.RATE_LIMIT_INGEST_WINDOW ?? 3600),
	countQuery: ingestCountQuery,
};

/**
 * Checks if a user has exceeded their rate limit.
 * Returns the current count, or null if the check failed (ClickHouse down).
 */
export async function checkIngestRateLimit(
	userId: string,
	config: RateLimitConfig = INGEST_RATE_LIMIT,
): Promise<void> {
	const { maxRequests, windowSeconds, countQuery } = config;

	try {
		const rows = await queryClickhouse<{ count: number }>(
			countQuery(userId, windowSeconds),
		);
		const count = rows[0]?.count ?? 0;

		if (count >= maxRequests) {
			logger.warn(
				"Rate limit exceeded for user {userId}: {count}/{maxRequests} in {windowSeconds}s",
				{ userId, count, maxRequests, windowSeconds },
			);
			throw new ORPCError("TOO_MANY_REQUESTS", {
				message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.round(windowSeconds / 60)} minutes.`,
			});
		}
	} catch (error) {
		if (error instanceof ORPCError) throw error;
		// If ClickHouse is down, log and allow the request through.
		// Availability > rate limiting.
		logger.error("Rate limit check failed, allowing request: {error}", {
			error,
		});
	}
}
