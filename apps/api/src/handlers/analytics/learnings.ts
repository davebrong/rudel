import { authMiddleware, os } from "../../middleware.js";
import {
	getLearningProjects,
	getLearningsFeed,
	getLearningsFeedStats,
	getLearningsTrend,
	getLearningUsers,
} from "../../services/learnings.service.js";

const list = os.analytics.learnings.list
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getLearningsFeed(context.user.id, {
			days: input.days,
			limit: input.limit,
			offset: input.offset,
		});
	});

const stats = os.analytics.learnings.stats
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getLearningsFeedStats(context.user.id, {
			days: input.days,
		});
	});

const users = os.analytics.learnings.users
	.use(authMiddleware)
	.handler(async ({ context }) => {
		return getLearningUsers(context.user.id);
	});

const projects = os.analytics.learnings.projects
	.use(authMiddleware)
	.handler(async ({ context }) => {
		return getLearningProjects(context.user.id);
	});

const trend = os.analytics.learnings.trend
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getLearningsTrend(context.user.id, {
			days: input.days,
			split_by: input.splitBy,
		});
	});

export const learningsRouter = os.analytics.learnings.router({
	list,
	stats,
	users,
	projects,
	trend,
});
