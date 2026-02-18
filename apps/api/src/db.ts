import { drizzle } from "drizzle-orm/bun-sqlite";
import Database from "bun:sqlite";
import * as schema from "@rudel/sql-schema";

const sqlite = new Database(
	process.env.DATABASE_PATH ?? "data/auth.sqlite",
);

export const db = drizzle(sqlite, { schema });
