#!/usr/bin/env bun
/**
 * One-time migration script: Cloudflare D1 (SQLite) → Postgres (Neon)
 *
 * Prerequisites:
 *   - `wrangler` CLI installed and authenticated
 *   - DATABASE_URL env var pointing to the target Postgres database
 *
 * Usage:
 *   DATABASE_URL=postgres://... bun run scripts/migrate-d1-to-pg.ts
 *
 * This script:
 *   1. Exports all rows from the 4 auth tables in D1 via `wrangler d1 execute`
 *   2. Transforms timestamps (integer ms → Date) and booleans (0/1 → true/false)
 *   3. Inserts into Postgres in FK-safe order: user → session + account + verification
 */

import { execSync } from "node:child_process";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("DATABASE_URL environment variable is required");
	process.exit(1);
}

const D1_DATABASE_NAME = process.env.D1_DATABASE_NAME ?? "rudel";

const sql = postgres(DATABASE_URL);

interface D1Result<T> {
	success: boolean;
	results: T[];
}

function queryD1<T>(query: string): T[] {
	const raw = execSync(
		`npx wrangler d1 execute ${D1_DATABASE_NAME} --remote --json --command="${query.replace(/"/g, '\\"')}"`,
		{ encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
	);
	const parsed = JSON.parse(raw) as D1Result<T>[];
	return parsed[0]?.results ?? [];
}

function msToDate(ms: number | null): Date | null {
	if (ms === null || ms === undefined) return null;
	return new Date(ms);
}

function intToBool(val: number | null): boolean {
	return val === 1;
}

// --- Export from D1 ---

console.log("Exporting users from D1...");
const d1Users = queryD1<Record<string, unknown>>("SELECT * FROM user");
console.log(`  Found ${d1Users.length} users`);

console.log("Exporting sessions from D1...");
const d1Sessions = queryD1<Record<string, unknown>>("SELECT * FROM session");
console.log(`  Found ${d1Sessions.length} sessions`);

console.log("Exporting accounts from D1...");
const d1Accounts = queryD1<Record<string, unknown>>("SELECT * FROM account");
console.log(`  Found ${d1Accounts.length} accounts`);

console.log("Exporting verifications from D1...");
const d1Verifications = queryD1<Record<string, unknown>>(
	"SELECT * FROM verification",
);
console.log(`  Found ${d1Verifications.length} verifications`);

// --- Insert into Postgres (FK-safe order) ---

console.log("\nInserting users into Postgres...");
for (const u of d1Users) {
	await sql`
		INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
		VALUES (
			${u.id as string},
			${u.name as string},
			${u.email as string},
			${intToBool(u.email_verified as number)},
			${(u.image as string) ?? null},
			${msToDate(u.created_at as number)},
			${msToDate(u.updated_at as number)}
		)
		ON CONFLICT (id) DO NOTHING
	`;
}
console.log(`  Inserted ${d1Users.length} users`);

console.log("Inserting sessions into Postgres...");
for (const s of d1Sessions) {
	await sql`
		INSERT INTO "session" (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES (
			${s.id as string},
			${msToDate(s.expires_at as number)},
			${s.token as string},
			${msToDate(s.created_at as number)},
			${msToDate(s.updated_at as number)},
			${(s.ip_address as string) ?? null},
			${(s.user_agent as string) ?? null},
			${s.user_id as string}
		)
		ON CONFLICT (id) DO NOTHING
	`;
}
console.log(`  Inserted ${d1Sessions.length} sessions`);

console.log("Inserting accounts into Postgres...");
for (const a of d1Accounts) {
	await sql`
		INSERT INTO "account" (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
		VALUES (
			${a.id as string},
			${a.account_id as string},
			${a.provider_id as string},
			${a.user_id as string},
			${(a.access_token as string) ?? null},
			${(a.refresh_token as string) ?? null},
			${(a.id_token as string) ?? null},
			${msToDate(a.access_token_expires_at as number)},
			${msToDate(a.refresh_token_expires_at as number)},
			${(a.scope as string) ?? null},
			${(a.password as string) ?? null},
			${msToDate(a.created_at as number)},
			${msToDate(a.updated_at as number)}
		)
		ON CONFLICT (id) DO NOTHING
	`;
}
console.log(`  Inserted ${d1Accounts.length} accounts`);

console.log("Inserting verifications into Postgres...");
for (const v of d1Verifications) {
	await sql`
		INSERT INTO "verification" (id, identifier, value, expires_at, created_at, updated_at)
		VALUES (
			${v.id as string},
			${v.identifier as string},
			${v.value as string},
			${msToDate(v.expires_at as number)},
			${msToDate(v.created_at as number)},
			${msToDate(v.updated_at as number)}
		)
		ON CONFLICT (id) DO NOTHING
	`;
}
console.log(`  Inserted ${d1Verifications.length} verifications`);

await sql.end();
console.log("\nMigration complete!");
