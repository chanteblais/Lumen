/**
 * Database client. Server-only. Lazy so a missing DATABASE_URL doesn't break
 * the build; the first query throws a clear error instead.
 *
 * Supabase transaction pooler (port 6543) hands out connections per
 * transaction and does not support prepared statements → prepare: false.
 *
 * Opening a connection costs ~0.5s (TLS + pooler handshake); a query on a
 * warm one ~70ms. Idle connections are kept for thirty minutes so a pause
 * between page views (a break, a meeting) doesn't reopen the whole pool; the
 * pooler keeps them alive that long (held idle 6 and 12 minutes, they answered
 * in ~70ms with no reconnect, 2026-09-13).
 *
 * max_pipeline: 0 — never send a query down a connection that is still busy.
 * The driver pipelines by default once every connection is busy, and through
 * the transaction pooler a pipelined query is never answered: it hung for 75s+
 * when a warm pool of 5 took 6 at once (the snapshot sends 7). With 0 the extra
 * queries wait for a free connection instead (~0.1–0.2s). The pool is 10 so a
 * page's usual fan-out doesn't wait at all. It also breaks the driver's own
 * transactions, so `begin` is replaced (`beginOnReserved`).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof connect>;

let instance: Db | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  return connect(url);
}

/** The app's pool on `url`, as production runs it. Exported for the wire tests (`client.db.test.ts`). */
export function connect(url: string, { warmUp = true } = {}) {
  // A named object, not a literal: the driver reads max_pipeline (src/index.js
  // → parseOptions) but its types leave it out.
  const options = { prepare: false, max: 10, max_pipeline: 0, idle_timeout: 30 * 60 };
  const client = postgres(url, options);
  Object.assign(client, { begin: beginOnReserved(client) });
  if (warmUp) warm(client, options.max);
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

type Work = (sql: postgres.TransactionSql) => unknown;

/**
 * `sql.begin` (what drizzle's `db.transaction` calls) on a reserved connection.
 * The driver's own begin reserves its connection in an `onexecute` callback
 * that `execute()` reaches only while `sent.length < max_pipeline` — never,
 * with max_pipeline 0 — so BEGIN ran on an unreserved pooled connection and the
 * driver refused it: *UNSAFE_TRANSACTION: Only use sql.begin, sql.reserved or
 * max: 1* (postgres 3.4.9, src/connection.js → execute and CommandComplete).
 * `sql.reserve()` holds a connection without that callback: BEGIN, the work and
 * COMMIT or ROLLBACK all run on it — one server connection for the whole
 * transaction through the pooler, as transaction mode expects — and then it goes
 * back to the pool. Savepoints carry drizzle's nested `tx.transaction`.
 */
function beginOnReserved(client: postgres.Sql): postgres.Sql["begin"] {
  return (async (...args: [Work] | [string, Work]) => {
    const [mode, fn] = args.length === 2 ? [args[0].replace(/[^a-z ]/gi, ""), args[1]] : ["", args[0]];
    const conn = await client.reserve();
    const tx = conn as unknown as postgres.TransactionSql;
    let savepoints = 0;
    Object.assign(tx, {
      savepoint: (...inner: [Work] | [string, Work]) => {
        const name = `s${savepoints++}`;
        return within(tx, inner.length === 2 ? inner[1] : inner[0], `savepoint ${name}`, `release savepoint ${name}`, `rollback to savepoint ${name}`);
      },
    });
    try {
      return await within(tx, fn, `begin ${mode}`, "commit", "rollback");
    } finally {
      conn.release();
    }
  }) as postgres.Sql["begin"];
}

async function within(tx: postgres.TransactionSql, fn: Work, open: string, done: string, undo: string) {
  await tx.unsafe(open);
  try {
    const x = fn(tx);
    const result = await (Array.isArray(x) ? Promise.all(x) : x);
    await tx.unsafe(done);
    return result;
  } catch (e) {
    await tx.unsafe(undo).catch(() => {});
    throw e;
  }
}

export function db(): Db {
  return (instance ??= create());
}
