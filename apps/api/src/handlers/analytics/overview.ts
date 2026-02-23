import { authMiddleware, os } from "../../middleware.js";
import {
	getModelTokensTrend,
	getOverviewInsights,
	getOverviewKPIs,
	getSuccessRateMetrics,
	getTeamSummaryWithComparison,
	getUsageTrendDetailed,
} from "../../services/overview.service.js";

const kpis = os.analytics.overview.kpis
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getOverviewKPIs(context.user.id, input.days);
	});

const usageTrend = os.analytics.overview.usageTrend
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getUsageTrendDetailed(context.user.id, input.days);
	});

const modelTokensTrend = os.analytics.overview.modelTokensTrend
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getModelTokensTrend(context.user.id, input.days);
	});

const insights = os.analytics.overview.insights
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getOverviewInsights(context.user.id, input.days);
	});

const teamSummaryComparison = os.analytics.overview.teamSummaryComparison
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getTeamSummaryWithComparison(context.user.id, input.days);
	});

const successRate = os.analytics.overview.successRate
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getSuccessRateMetrics(context.user.id, input.days);
	});

export const overviewRouter = os.analytics.overview.router({
	kpis,
	usageTrend,
	modelTokensTrend,
	insights,
	teamSummaryComparison,
	successRate,
});
