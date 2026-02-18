import Database from "bun:sqlite";
import * as schema from "@rudel/sql-schema";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(process.env.DATABASE_PATH ?? "data/auth.sqlite");

export const db = drizzle(sqlite, { schema });
