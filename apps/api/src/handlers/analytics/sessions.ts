import { ORPCError } from "@orpc/server";
import { authMiddleware, os } from "../../middleware.js";
import {
	getSessionAnalytics,
	getSessionAnalyticsSummary,
	getSessionAnalyticsSummaryComparison,
	getSessionDetail,
	getSessionDimensionAnalysis,
} from "../../services/session-analytics.service.js";

const sortByMap: Record<string, "date" | "duration" | "interactions"> = {
	session_date: "date",
	duration_min: "duration",
	total_tokens: "date",
	success_score: "date",
};

const list = os.analytics.sessions.list
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		console.log("[list] orgId:", context.user.id, "days:", input.days);
		try {
			const result = await getSessionAnalytics(context.user.id, {
				days: input.days,
				user_id: input.userId,
				project_path: input.projectPath,
				repository: input.repository,
				limit: input.limit,
				offset: input.offset,
				sort_by: sortByMap[input.sortBy] ?? "date",
				sort_order: input.sortOrder,
			});
			console.log("[list] OK, rows:", result.length);
			return result;
		} catch (e) {
			console.error("[list] ERROR:", e);
			throw e;
		}
	});

const summary = os.analytics.sessions.summary
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		try {
			const result = await getSessionAnalyticsSummary(context.user.id, {
				days: input.days,
			});
			console.log("[summary] OK:", JSON.stringify(result));
			return result;
		} catch (e) {
			console.error("[summary] ERROR:", e);
			throw e;
		}
	});

const summaryComparison = os.analytics.sessions.summaryComparison
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		try {
			const result = await getSessionAnalyticsSummaryComparison(
				context.user.id,
				{
					days: input.days,
				},
			);
			console.log(
				"[summaryComparison] OK:",
				JSON.stringify(result).slice(0, 300),
			);
			return result;
		} catch (e) {
			console.error("[summaryComparison] ERROR:", e);
			throw e;
		}
	});

const dimensionAnalysis = os.analytics.sessions.dimensionAnalysis
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getSessionDimensionAnalysis(context.user.id, {
			days: input.days,
			dimension: input.dimension,
			metric: input.metric,
			split_by: input.splitBy,
			limit: input.limit,
			user_id: input.userId,
			project_path: input.projectPath,
		});
	});

const detail = os.analytics.sessions.detail
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const result = await getSessionDetail(context.user.id, input.sessionId);
		if (!result) {
			throw new ORPCError("NOT_FOUND");
		}
		return result;
	});

export const sessionsRouter = os.analytics.sessions.router({
	list,
	summary,
	summaryComparison,
	dimensionAnalysis,
	detail,
});
