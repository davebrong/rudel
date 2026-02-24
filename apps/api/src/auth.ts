import * as schema from "@rudel/sql-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, organization } from "better-auth/plugins";

export interface AuthConfig {
	appURL: string;
	secret?: string;
	socialProviders?: Record<string, { clientId: string; clientSecret: string }>;
	trustedOrigins?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzleAdapter accepts { [key: string]: any }
export function createAuth(db: object, config: AuthConfig) {
	const trustedOrigins = config.trustedOrigins ?? [];
	if (!trustedOrigins.includes(config.appURL)) {
		trustedOrigins.push(config.appURL);
	}

	return betterAuth({
		baseURL: config.appURL,
		secret: config.secret,
		database: drizzleAdapter(db as Parameters<typeof drizzleAdapter>[0], {
			provider: "pg",
			schema,
		}),
		emailAndPassword: {
			enabled: true,
		},
		socialProviders: config.socialProviders,
		plugins: [
			bearer(),
			organization({
				allowUserToCreateOrganization: true,
				creatorRole: "owner",
			}),
		],
		session: {
			expiresIn: 60 * 60 * 24 * 365,
		},
		trustedOrigins,
		databaseHooks: {
			user: {
				create: {
					after: async (user, ctx) => {
						const adapter = ctx?.context?.adapter;
						if (!adapter) return;

						const slug = `${user.email.split("@")[0]}-${user.id.slice(0, 8)}`;
						const org = await adapter.create({
							model: "organization",
							data: {
								id: user.id,
								name: `${user.name}'s Workspace`,
								slug,
								createdAt: new Date(),
							},
						});

						if (org) {
							await adapter.create({
								model: "member",
								data: {
									organizationId: org.id,
									userId: user.id,
									role: "owner",
									createdAt: new Date(),
								},
							});
						}
					},
				},
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
