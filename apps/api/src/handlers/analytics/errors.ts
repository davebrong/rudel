import { orgMiddleware, os } from "../../middleware.js";
import {
	getErrorTrends,
	getTopRecurringErrors,
} from "../../services/error.service.js";

const topRecurring = os.analytics.errors.topRecurring
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getTopRecurringErrors(context.organizationId, {
			days: input.days,
			min_occurrences: input.minOccurrences,
			limit: input.limit,
		});
	});

const trends = os.analytics.errors.trends
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getErrorTrends(context.organizationId, {
			start_date: input.startDate,
			end_date: input.endDate,
			split_by: input.splitBy,
		});
	});

export const errorsRouter = os.analytics.errors.router({
	topRecurring,
	trends,
});
