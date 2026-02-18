import { ORPCError } from "@orpc/server";
import { authMiddleware, os } from "../../middleware.js";
import {
	getSessionAnalytics,
	getSessionAnalyticsSummary,
	getSessionAnalyticsSummaryComparison,
	getSessionDimensionAnalysis,
	getTaskTypeDistribution,
	getSessionDetail,
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
		return getSessionAnalytics(context.user.id, {
			days: input.days,
			user_id: input.userId,
			project_path: input.projectPath,
			repository: input.repository,
			limit: input.limit,
			offset: input.offset,
			sort_by: sortByMap[input.sortBy] ?? "date",
			sort_order: input.sortOrder,
		});
	});

const summary = os.analytics.sessions.summary
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getSessionAnalyticsSummary(context.user.id, {
			days: input.days,
		});
	});

const summaryComparison = os.analytics.sessions.summaryComparison
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getSessionAnalyticsSummaryComparison(context.user.id, {
			days: input.days,
		});
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

const taskClassification = os.analytics.sessions.taskClassification
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getTaskTypeDistribution(context.user.id, {
			days: input.days,
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
	taskClassification,
	detail,
});
