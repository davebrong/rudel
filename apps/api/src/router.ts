import { ORPCError } from "@orpc/server";
import { member, organization } from "@rudel/sql-schema";
import { eq } from "drizzle-orm";
import { getClickhouse } from "./clickhouse.js";
import { db } from "./db.js";
import { analyticsRouter } from "./handlers/analytics/index.js";
import { ingestSession } from "./ingest.js";
import { authMiddleware, os } from "./middleware.js";

const health = os.health.handler(() => {
	return {
		status: "ok" as const,
		timestamp: Date.now(),
	};
});

const me = os.me.use(authMiddleware).handler(({ context }) => {
	return {
		id: context.user.id,
		email: context.user.email,
		name: context.user.name,
		image: context.user.image ?? null,
		activeOrganizationId:
			((context.session as Record<string, unknown>).activeOrganizationId as
				| string
				| null) ?? null,
	};
});

const listMyOrganizations = os.listMyOrganizations
	.use(authMiddleware)
	.handler(async ({ context }) => {
		const memberships = await db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				logo: organization.logo,
			})
			.from(member)
			.innerJoin(organization, eq(member.organizationId, organization.id))
			.where(eq(member.userId, context.user.id));

		return memberships.map((m) => ({
			id: m.id,
			name: m.name,
			slug: m.slug,
			logo: m.logo ?? null,
		}));
	});

const ingestSessionHandler = os.ingestSession
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const orgId =
			input.organizationId ??
			((context.session as Record<string, unknown>).activeOrganizationId as
				| string
				| null) ??
			context.user.id;

		if (input.organizationId) {
			const membership = await db
				.select({ id: member.id })
				.from(member)
				.where(eq(member.organizationId, input.organizationId))
				.limit(1);

			if (membership.length === 0) {
				throw new ORPCError("FORBIDDEN", {
					message: "Not a member of the specified organization",
				});
			}
		}

		await ingestSession(getClickhouse(), input, {
			userId: context.user.id,
			organizationId: orgId,
		});

		return {
			success: true as const,
			sessionId: input.sessionId,
		};
	});

export const router = os.router({
	health,
	me,
	listMyOrganizations,
	ingestSession: ingestSessionHandler,
	analytics: analyticsRouter,
});
