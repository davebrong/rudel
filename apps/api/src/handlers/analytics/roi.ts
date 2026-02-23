import { authMiddleware, os } from "../../middleware.js";
import {
	getDeveloperCostBreakdown,
	getProjectCostBreakdown,
	getROIMetrics,
	getROITrends,
} from "../../services/roi.service.js";

const metrics = os.analytics.roi.metrics
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getROIMetrics(context.user.id, input.days);
	});

const trends = os.analytics.roi.trends
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getROITrends(context.user.id, input.days);
	});

const breakdownDevelopers = os.analytics.roi.breakdownDevelopers
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperCostBreakdown(context.user.id, input.days);
	});

const breakdownProjects = os.analytics.roi.breakdownProjects
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectCostBreakdown(context.user.id, input.days);
	});

export const roiRouter = os.analytics.roi.router({
	metrics,
	trends,
	breakdownDevelopers,
	breakdownProjects,
});
