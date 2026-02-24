import { orgMiddleware, os } from "../../middleware.js";
import {
	getDeveloperCostBreakdown,
	getProjectCostBreakdown,
	getROIMetrics,
	getROITrends,
} from "../../services/roi.service.js";

const metrics = os.analytics.roi.metrics
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getROIMetrics(context.organizationId, input.days);
	});

const trends = os.analytics.roi.trends
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getROITrends(context.organizationId, input.days);
	});

const breakdownDevelopers = os.analytics.roi.breakdownDevelopers
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperCostBreakdown(context.organizationId, input.days);
	});

const breakdownProjects = os.analytics.roi.breakdownProjects
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectCostBreakdown(context.organizationId, input.days);
	});

export const roiRouter = os.analytics.roi.router({
	metrics,
	trends,
	breakdownDevelopers,
	breakdownProjects,
});
