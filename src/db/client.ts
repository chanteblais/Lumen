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
 *
 * max_pipeline: 0 — never send a query down a connection that is still busy.
 * The driver pipelines by default once every connection is busy, and through
 * the transaction pooler a pipelined query is never answered: it hung for 75s+
 * when a warm pool of 5 took 6 at once (the snapshot sends 7). With 0 the extra
 * queries wait for a free connection instead (~0.1–0.2s). The pool is 10 so a
 * page's usual fan-out doesn't wait at all.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof create>;

let instance: Db | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  // A named object, not a literal: the driver reads max_pipeline (src/index.js
  // → parseOptions) but its types leave it out.
  const options = { prepare: false, max: 10, max_pipeline: 0, idle_timeout: 300 };
  const client = postgres(url, options);
  warm(client, options.max);
  return drizzle(client, { schema });
}

/**
 * Open the whole pool as soon as it is made, all at once. Opening a connection
 * costs ~0.5s wherever it happens, and the driver opens a new one for any query
 * that finds none free rather than waiting for a busy one, so a page's parallel
 * reads after its first query (Today's snapshot fans out to ~9) each paid to
 * connect. Warmed, those nine took ~90ms instead of ~510ms (measured from
 * Vancouver, 2026-09-13); warming only 6 saved nothing, since the rest still
 * connected. A failure only means connections open on demand, as before.
 */
function warm(client: postgres.Sql, connections: number) {
  Promise.all(Array.from({ length: connections }, () => client`select 1`)).catch(() => {});
}

export function db(): Db {
  return (instance ??= create());
}
