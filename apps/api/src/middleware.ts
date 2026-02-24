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

export const orgMiddleware = os.middleware(async ({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError("UNAUTHORIZED");
	}
	const organizationId =
		(context.session as Record<string, unknown>).activeOrganizationId ??
		context.user.id;
	if (!organizationId || typeof organizationId !== "string") {
		throw new ORPCError("BAD_REQUEST", {
			message: "No active organization",
		});
	}
	return next({
		context: {
			user: context.user,
			session: context.session,
			organizationId,
		},
	});
});
