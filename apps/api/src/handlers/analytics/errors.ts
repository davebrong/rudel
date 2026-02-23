import { authMiddleware, os } from "../../middleware.js";
import {
	getErrorTrends,
	getTopRecurringErrors,
} from "../../services/error.service.js";

const topRecurring = os.analytics.errors.topRecurring
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getTopRecurringErrors(context.user.id, {
			days: input.days,
			min_occurrences: input.minOccurrences,
			limit: input.limit,
		});
	});

const trends = os.analytics.errors.trends
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getErrorTrends(context.user.id, {
			start_date: input.startDate,
			end_date: input.endDate,
			split_by: input.splitBy,
		});
	});

export const errorsRouter = os.analytics.errors.router({
	topRecurring,
	trends,
});
