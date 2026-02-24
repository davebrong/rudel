import { orgMiddleware, os } from "../../middleware.js";
import {
	getModelTokensTrend,
	getOverviewInsights,
	getOverviewKPIs,
	getSuccessRateMetrics,
	getTeamSummaryWithComparison,
	getUsageTrendDetailed,
} from "../../services/overview.service.js";

const kpis = os.analytics.overview.kpis
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getOverviewKPIs(context.organizationId, input.days);
	});

const usageTrend = os.analytics.overview.usageTrend
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getUsageTrendDetailed(context.organizationId, input.days);
	});

const modelTokensTrend = os.analytics.overview.modelTokensTrend
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getModelTokensTrend(context.organizationId, input.days);
	});

const insights = os.analytics.overview.insights
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getOverviewInsights(context.organizationId, input.days);
	});

const teamSummaryComparison = os.analytics.overview.teamSummaryComparison
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getTeamSummaryWithComparison(context.organizationId, input.days);
	});

const successRate = os.analytics.overview.successRate
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getSuccessRateMetrics(context.organizationId, input.days);
	});

export const overviewRouter = os.analytics.overview.router({
	kpis,
	usageTrend,
	modelTokensTrend,
	insights,
	teamSummaryComparison,
	successRate,
});
