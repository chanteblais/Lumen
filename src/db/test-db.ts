/**
 * An in-process Postgres (PGlite) with every migration applied, for tests that
 * need real SQL — persistence, ownership, deletion. Test-only: nothing in the
 * app imports it, and it needs no server, no network and no DATABASE_URL.
 */
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "./client";
import * as schema from "./schema";
import { users, type User } from "./schema";

export async function openTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: path.resolve(process.cwd(), "src/db/migrations") });
  // The app's client is postgres-js; the query builder the domain uses is the same surface.
  return { db: pglite as unknown as Db, close: () => client.close() };
}

let made = 0;

export async function createTestUser(db: Db, name = "Test"): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({ clerkUserId: `test_${name}_${++made}`, displayName: name })
    .returning();
  return row;
}
