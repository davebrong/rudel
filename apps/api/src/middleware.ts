import { implement, ORPCError } from "@orpc/server";
import { contract } from "@rudel/api-routes";
import type { Session } from "./auth.js";

export interface AppContext {
	user: Session["user"] | null;
	session: Session["session"] | null;
}

export const os = implement(contract).$context<AppContext>();

export const authMiddleware = os.middleware(async ({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			user: context.user,
			session: context.session,
		},
	});
});
