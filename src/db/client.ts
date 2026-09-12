/**
 * Database client. Server-only. Lazy so a missing DATABASE_URL doesn't break
 * the build; the first query throws a clear error instead.
 *
 * Supabase transaction pooler (port 6543) hands out connections per
 * transaction and does not support prepared statements → prepare: false.
 *
 * Opening a connection costs ~0.5s (TLS + pooler handshake); a query on a
 * warm one ~70ms. Idle connections are kept for a few minutes so a pause
 * between page views doesn't reopen the whole pool.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof create>;

let instance: Db | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  const client = postgres(url, { prepare: false, max: 5, idle_timeout: 300 });
  return drizzle(client, { schema });
}

export function db(): Db {
  return (instance ??= create());
}
