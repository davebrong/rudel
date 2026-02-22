import { ORPCError } from "@orpc/server";
import { authMiddleware, os } from "../../middleware.js";
import {
	getDeveloperDetails,
	getDeveloperErrors,
	getDeveloperFeatureUsage,
	getDeveloperList,
	getDeveloperProjects,
	getDeveloperSessions,
	getDeveloperTimeline,
	getDeveloperTrends,
} from "../../services/developer.service.js";

const list = os.analytics.developers.list
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperList(context.user.id, input.days);
	});

const details = os.analytics.developers.details
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const result = await getDeveloperDetails(
			context.user.id,
			input.userId,
			input.days,
		);
		if (!result) {
			throw new ORPCError("NOT_FOUND");
		}
		return result;
	});

const sessions = os.analytics.developers.sessions
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperSessions(context.user.id, input.userId, {
			days: input.days,
			project_path: input.projectPath,
			outcome: input.outcome,
			limit: input.limit,
			offset: input.offset,
			sort_by: input.sortBy,
			sort_order: input.sortOrder,
		});
	});

const projects = os.analytics.developers.projects
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperProjects(context.user.id, input.userId, input.days);
	});

const timeline = os.analytics.developers.timeline
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperTimeline(context.user.id, input.userId, input.days);
	});

const features = os.analytics.developers.features
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperFeatureUsage(context.user.id, input.userId, input.days);
	});

const errors = os.analytics.developers.errors
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperErrors(context.user.id, input.userId, input.days);
	});

const trends = os.analytics.developers.trends
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getDeveloperTrends(context.user.id, input.days);
	});

export const developersRouter = os.analytics.developers.router({
	list,
	details,
	sessions,
	projects,
	timeline,
	features,
	errors,
	trends,
});
