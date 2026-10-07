import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __myqrDb?: Database };

function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (or connect Neon in Vercel).");
  }
  return url;
}

function createDb(): Database {
  const url = databaseUrl();
  // Neon's HTTP driver suits serverless functions; anything else gets a normal pool.
  if (/neon\.tech|neon\.build/.test(url)) {
    return drizzleNeon(neon(url), { schema }) as unknown as Database;
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  return drizzlePg(pool, { schema });
}

/** Lazily created so builds without a database still succeed. */
export function getDb(): Database {
  if (!globalForDb.__myqrDb) globalForDb.__myqrDb = createDb();
  return globalForDb.__myqrDb;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export * as schema from "./schema";
