import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@rudel/sql-schema";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export interface AuthConfig {
	appURL: string;
	secret?: string;
	socialProviders?: Record<string, { clientId: string; clientSecret: string }>;
	trustedOrigins?: string[];
}

export function createAuth(
	db: BaseSQLiteDatabase<any, any, typeof schema>,
	config: AuthConfig,
) {
	const trustedOrigins = config.trustedOrigins ?? [];
	if (!trustedOrigins.includes(config.appURL)) {
		trustedOrigins.push(config.appURL);
	}

	return betterAuth({
		baseURL: config.appURL,
		secret: config.secret,
		database: drizzleAdapter(db, { provider: "sqlite", schema }),
		emailAndPassword: {
			enabled: true,
		},
		socialProviders: config.socialProviders,
		plugins: [bearer()],
		session: {
			expiresIn: 60 * 60 * 24 * 365,
		},
		trustedOrigins,
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
