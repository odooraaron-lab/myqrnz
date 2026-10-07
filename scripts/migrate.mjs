// Applies the SQL migrations in ./drizzle. Runs before every build, and quietly
// skips when no database is configured (e.g. a first preview deploy).
import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log("[migrate] No DATABASE_URL — skipping migrations.");
  process.exit(0);
}

const folder = "./drizzle";

if (/neon\.tech|neon\.build/.test(url)) {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");
  await migrate(drizzle(neon(url)), { migrationsFolder: folder });
} else {
  const pg = (await import("pg")).default;
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const pool = new pg.Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: folder });
  await pool.end();
}

console.log("[migrate] Database is up to date.");
