import { orgMiddleware, os } from "../../middleware.js";
import { getUserMappings } from "../../services/user.service.js";

const mappings = os.analytics.users.mappings
	.use(orgMiddleware)
	.handler(async ({ input, context }) => {
		return getUserMappings(context.organizationId, input.days);
	});

export const usersRouter = os.analytics.users.router({
	mappings,
});
