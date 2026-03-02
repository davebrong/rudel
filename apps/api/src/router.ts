import { ORPCError } from "@orpc/server";
import { member, organization, session } from "@rudel/sql-schema";
import { and, eq } from "drizzle-orm";
import { getClickhouse } from "./clickhouse.js";
import { db } from "./db.js";
import { analyticsRouter } from "./handlers/analytics/index.js";
import { ingestSession } from "./ingest.js";
import { authMiddleware, os } from "./middleware.js";
import {
	deleteOrgSessions,
	getOrgSessionCount,
	migrateOrgSessions,
} from "./services/org-session.service.js";

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
				.where(
					and(
						eq(member.organizationId, input.organizationId),
						eq(member.userId, context.user.id),
					),
				)
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

const getOrganizationSessionCount = os.getOrganizationSessionCount
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const membership = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(
					eq(member.organizationId, input.organizationId),
					eq(member.userId, context.user.id),
				),
			)
			.limit(1);

		if (membership.length === 0) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not a member of this organization",
			});
		}

		const count = await getOrgSessionCount(input.organizationId);
		return { count };
	});

const deleteOrganization = os.deleteOrganization
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		// Check user has more than one org
		const memberships = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, context.user.id));

		if (memberships.length <= 1) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Cannot delete your only organization",
			});
		}

		// Verify user is owner of the target org
		const ownership = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(
					eq(member.organizationId, input.organizationId),
					eq(member.userId, context.user.id),
					eq(member.role, "owner"),
				),
			)
			.limit(1);

		if (ownership.length === 0) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only the organization owner can delete it",
			});
		}

		if (input.migrateSessionsTo) {
			if (input.migrateSessionsTo === input.organizationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cannot migrate sessions to the same organization",
				});
			}

			// Verify user is a member of the target org
			const targetMembership = await db
				.select({ id: member.id })
				.from(member)
				.where(
					and(
						eq(member.organizationId, input.migrateSessionsTo),
						eq(member.userId, context.user.id),
					),
				)
				.limit(1);

			if (targetMembership.length === 0) {
				throw new ORPCError("FORBIDDEN", {
					message: "Not a member of the target organization",
				});
			}

			await migrateOrgSessions(input.organizationId, input.migrateSessionsTo);
		} else {
			await deleteOrgSessions(input.organizationId);
		}

		// Delete the organization from Postgres (cascade handles member + invitation)
		await db
			.delete(organization)
			.where(eq(organization.id, input.organizationId));

		// Clear activeOrganizationId on user sessions that reference the deleted org
		await db
			.update(session)
			.set({ activeOrganizationId: null })
			.where(eq(session.activeOrganizationId, input.organizationId));

		return { success: true as const };
	});

export const router = os.router({
	health,
	me,
	listMyOrganizations,
	ingestSession: ingestSessionHandler,
	getOrganizationSessionCount,
	deleteOrganization,
	analytics: analyticsRouter,
});
