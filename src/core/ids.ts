/**
 * Row ids (Postgres uuids) as they arrive from outside — a URL segment, a
 * message's metadata, a request body. Checked before a query, so a malformed id
 * is a 400 or "not found", never a database error. Pure.
 */
import { z } from "zod";

/** 8-4-4-4-12 hex, any version: what `gen_random_uuid()` and `randomUUID()` produce, and test fixtures too. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(s: unknown): s is string {
  return typeof s === "string" && UUID.test(s);
}

/** The same check as a schema field. */
export const idSchema = z.string().regex(UUID, "must be an id");
