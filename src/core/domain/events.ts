/**
 * Append-only events. Every state change writes one — this is the raw
 * material for the understanding layer. Never update or delete rows.
 */
import { type Db } from "@/db/client";
import { events } from "@/db/schema";

export type EventInput = {
  userId: string;
  type: string;
  subjectType?: "intention" | "session" | "note" | "user";
  subjectId?: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
};

export async function appendEvent(db: Db, input: EventInput) {
  const [row] = await db
    .insert(events)
    .values({
      userId: input.userId,
      type: input.type,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      payload: input.payload ?? {},
      occurredAt: input.occurredAt ?? new Date(),
    })
    .returning({ id: events.id });
  return row;
}
