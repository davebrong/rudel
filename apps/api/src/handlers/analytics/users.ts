import { authMiddleware, os } from "../../middleware.js";
import { getUserMappings } from "../../services/user.service.js";

const mappings = os.analytics.users.mappings
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		return getUserMappings(context.user.id, input.days);
	});

export const usersRouter = os.analytics.users.router({
	mappings,
});
