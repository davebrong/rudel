import { implement, ORPCError } from "@orpc/server";
import { contract } from "@rudel/api-routes";
import { member } from "@rudel/sql-schema";
import { and, eq } from "drizzle-orm";
import type { Session } from "./auth.js";
import { db } from "./db.js";

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

	// When the active org is not the user's personal workspace, verify membership
	if (organizationId !== context.user.id) {
		const membership = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(
					eq(member.organizationId, organizationId),
					eq(member.userId, context.user.id),
				),
			)
			.limit(1);

		if (membership.length === 0) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not a member of the active organization",
			});
		}
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
