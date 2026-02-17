import Database from "bun:sqlite";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";

const socialProviders: Record<
	string,
	{ clientId: string; clientSecret: string }
> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	socialProviders.google = {
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	};
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
	socialProviders.github = {
		clientId: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
	};
}

const appURL = process.env.APP_URL ?? "http://localhost:4010";
const trustedOrigins = process.env.TRUSTED_ORIGINS
	? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
	: ["http://localhost:4011"];
if (!trustedOrigins.includes(appURL)) {
	trustedOrigins.push(appURL);
}

export const authOptions = {
	baseURL: appURL,
	database: new Database(process.env.DATABASE_PATH ?? "data/auth.sqlite"),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders,
	plugins: [bearer()],
	session: {
		expiresIn: 60 * 60 * 24 * 365,
	},
	trustedOrigins,
} satisfies Parameters<typeof betterAuth>[0];

export const auth = betterAuth(authOptions);

export type Session = typeof auth.$Infer.Session;
