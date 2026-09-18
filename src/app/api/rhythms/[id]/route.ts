import { z } from "zod";
import { practiceRhythm, unpracticeRhythm } from "@/core/domain/rhythms";
import { isUuid } from "@/core/ids";
import { localDate } from "@/core/time";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { badRequest, readBody } from "@/lib/http";

const Body = z.discriminatedUnion("action", [z.object({ action: z.literal("practiced") }), z.object({ action: z.literal("unpracticed") })]);

/**
 * Today's Rhythms: *Did it* marks a rhythm practiced today (`via: "app"`), and
 * tapping again takes it back — a mistake, not a judgement. Holding, letting
 * go and past days go through the conversation. A malformed id or body is a 400.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) return badRequest("id must be a rhythm id");
  const { data: body, error } = await readBody(req, Body, "action must be practiced or unpracticed");
  if (error) return error;
  const today = localDate(new Date(), user.timezone);
  if (body.action === "practiced") {
    const r = await practiceRhythm(db(), user.id, id, today, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id, practiced_on: today, already: r.already });
  }
  const gone = await unpracticeRhythm(db(), user.id, id, today);
  return Response.json({ id, practiced_on: today, removed: gone });
}
