import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
if (!connectionString) {
	throw new Error(
		"DATABASE_URL or PG_CONNECTION_STRING environment variable is required",
	);
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

const migrationsFolder = join(import.meta.dir, "..", "db", "migrations");

console.log("Running migrations...");
await migrate(db, { migrationsFolder });
console.log("Migrations applied successfully.");

await sql.end();
