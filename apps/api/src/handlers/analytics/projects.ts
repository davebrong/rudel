import { ORPCError } from "@orpc/server";
import { authMiddleware, os } from "../../middleware.js";
import {
	getProjectContributors,
	getProjectDetails,
	getProjectErrors,
	getProjectFeatureUsage,
	getProjectInvestment,
	getProjectTrends,
} from "../../services/project.service.js";

const investment = os.analytics.projects.investment
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectInvestment(context.user.id, { days: input.days });
	});

const trends = os.analytics.projects.trends
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectTrends(context.user.id, input.days);
	});

const details = os.analytics.projects.details
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const result = await getProjectDetails(
			context.user.id,
			input.projectPath,
			input.days,
		);
		if (!result) {
			throw new ORPCError("NOT_FOUND");
		}
		return result;
	});

const contributors = os.analytics.projects.contributors
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectContributors(
			context.user.id,
			input.projectPath,
			input.days,
		);
	});

const features = os.analytics.projects.features
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectFeatureUsage(
			context.user.id,
			input.projectPath,
			input.days,
		);
	});

const errors = os.analytics.projects.errors
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getProjectErrors(context.user.id, input.projectPath, input.days);
	});

export const projectsRouter = os.analytics.projects.router({
	investment,
	trends,
	details,
	contributors,
	features,
	errors,
});
