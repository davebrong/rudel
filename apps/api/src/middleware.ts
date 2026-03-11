import { implement, ORPCError } from "@orpc/server";
import { contract } from "@rudel/api-routes";
import type { Session } from "./auth.js";

export interface AppContext {
	user: Session["user"] | null;
	session: Session["session"] | null;
	apiKeyId: string | null;
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
			apiKeyId: context.apiKeyId,
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
			apiKeyId: context.apiKeyId,
			organizationId,
		},
	});
});

export const ingestAuthMiddleware = os.middleware(async ({ context, next }) => {
	if (!context.user) {
		throw new ORPCError("UNAUTHORIZED");
	}

	if (!context.session && !context.apiKeyId) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return next({
		context: {
			user: context.user,
			session: context.session,
			apiKeyId: context.apiKeyId,
		},
	});
});
