import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/auth-schema.ts",
	out: "./db/migrations",
	dialect: "sqlite",
});
