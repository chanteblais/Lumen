/**
 * Supersession chains in one query. A belief's wordings link back through
 * `memory_notes.supersedes_id`; a Library note links forward through
 * `thread_notes.superseded_by_id`. Forgetting either takes every version, so
 * both walk the chain in both directions — a recursive CTE, instead of one
 * query per step.
 */
import { getTableName, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * `(select id …)` — the ids of every row joined to `startId` through `pointer`,
 * either way, among this user's rows; for `WHERE id IN`. Empty when `startId`
 * isn't theirs. `union` (not `union all`) stops at a cycle.
 */
export function chainIds(table: PgTable, pointer: PgColumn, userId: string, startId: string): SQL {
  const t = sql.identifier(getTableName(table));
  const p = sql.identifier(pointer.name);
  return sql`(with recursive chain(id, ptr) as (
    select id, ${p} from ${t} where id = ${startId} and user_id = ${userId}
    union
    select n.id, n.${p} from ${t} n join chain c on n.${p} = c.id or n.id = c.ptr where n.user_id = ${userId}
  ) select id from chain)`;
}
