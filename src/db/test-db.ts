/**
 * An in-process Postgres (PGlite) with every migration applied, for tests that
 * need real SQL — persistence, ownership, deletion. Test-only: nothing in the
 * app imports it, and it needs no server, no network and no DATABASE_URL.
 */
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "./client";
import * as schema from "./schema";
import { users, type User } from "./schema";

const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");

/** `logger`: sees every statement after the migrations — for tests about the order of writes. */
export async function openTestDb({ logger }: { logger?: Logger } = {}): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite();
  await migrate(drizzle(client, { schema }), { migrationsFolder });
  const pglite = drizzle(client, { schema, logger });
  // The app's client is postgres-js; the query builder the domain uses is the same surface.
  return { db: pglite as unknown as Db, close: () => client.close() };
}

/**
 * The same database behind a real Postgres wire (pglite-socket on a free local
 * port), for tests of the app's own pool (`connect` in client.ts): the
 * `postgres` driver and its rules, which PGlite's in-process driver never meets.
 */
export async function openTestServer({ migrations = true } = {}): Promise<{ url: string; close: () => Promise<void> }> {
  const client = new PGlite();
  if (migrations) await migrate(drizzle(client, { schema }), { migrationsFolder });
  const server = new PGLiteSocketServer({ db: client, port: 0, maxConnections: 10 });
  await server.start();
  return {
    url: `postgres://postgres:postgres@${server.getServerConn()}/postgres`,
    close: async () => {
      await server.stop();
      await client.close();
    },
  };
}

let made = 0;

export async function createTestUser(db: Db, name = "Test"): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({ clerkUserId: `test_${name}_${++made}`, displayName: name })
    .returning();
  return row;
}
