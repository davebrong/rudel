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

export const auth = betterAuth({
	baseURL: "http://localhost:4010",
	database: new Database("data/auth.sqlite"),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders,
	plugins: [bearer()],
	session: {
		expiresIn: 60 * 60 * 24 * 365,
	},
	trustedOrigins: ["http://localhost:4011"],
});

export type Session = typeof auth.$Infer.Session;
