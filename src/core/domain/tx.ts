/**
 * Atomic writes for the domain. A write that is more than one statement — a
 * row and its event, a delete with its tombstone — runs in a transaction, so a
 * failure between the steps leaves nothing half-done and a concurrent caller
 * sees all of it or none. Framework-free; the pool's `begin` (`db/client.ts →
 * beginOnReserved`) makes `db.transaction` safe through the transaction pooler.
 */
import { PgTransaction } from "drizzle-orm/pg-core";
import type { Db } from "@/db/client";

/**
 * Run `work` in a new transaction — or, when `db` already is one (consolidation
 * filing notes, a lead kept as an intention), inside it, without a savepoint:
 * the caller's transaction already makes it all-or-nothing, and a savepoint per
 * step would add two round trips through the pooler each.
 */
export async function atomic<T>(db: Db, work: (tx: Db) => Promise<T>): Promise<T> {
  if ((db as unknown) instanceof PgTransaction) return work(db);
  return (await db.transaction((tx) => work(tx as unknown as Db))) as T;
}
