import { z } from "zod";
import { parseDueDate, startOfLocalDay } from "@/core/due-date";
import { completeIntention, dropIntention, reopenIntention, updateIntention } from "@/core/domain/intentions";
import { reflectClosedInPlan } from "@/core/domain/plan-sync";
import { isUuid } from "@/core/ids";
import { localDate } from "@/core/time";
import { db } from "@/db/client";
import { DEFAULT_LISTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { badRequest, readBody } from "@/lib/http";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("reopen") }),
  z.object({ action: z.literal("move"), list: z.string().max(80) }),
  // Empty or absent text takes the date off.
  z.object({ action: z.literal("date"), text: z.string().max(80).optional() }),
  z.object({ action: z.literal("drop") }),
]);

/**
 * Corrections from a page (Today, Lists): complete, reopen, move to another of
 * the user's lists, give it a date, or let go. Everything else goes through the conversation.
 * Every event carries `via: "app"`, so Lumi's context tells these from her own tool calls.
 * A malformed id or body is a 400.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) return badRequest("id must be an intention id");
  const { data: body, error } = await readBody(req, Body, "action must be complete, reopen, move, date or drop");
  if (error) return error;
  if (body.action === "complete") {
    const row = await completeIntention(db(), user.id, id, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    await reflectClosedInPlan(db(), user, id);
    return Response.json({ id: row.id, status: row.status });
  }
  if (body.action === "reopen") {
    const row = await reopenIntention(db(), user.id, id, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: row.id, status: row.status });
  }
  if (body.action === "move") {
    const lists: string[] = user.preferences.lists?.length ? user.preferences.lists : [...DEFAULT_LISTS];
    if (!lists.includes(body.list)) return badRequest("list must be one of the user's lists");
    const r = await updateIntention(db(), user.id, id, { list: body.list }, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: r.row.id, status: r.row.status, list: r.row.list });
  }
  if (body.action === "date") {
    // Typed the way it's said ("fri", "sep 30"), read against their local today; a day alone is 00:00 there. Empty takes the date off.
    const text = body.text?.trim() ?? "";
    let dueAt: Date | null = null;
    if (text) {
      const date = parseDueDate(text, localDate(new Date(), user.timezone));
      if (!date) return Response.json({ error: "unreadable" }, { status: 422 });
      dueAt = startOfLocalDay(date, user.timezone);
    }
    const r = await updateIntention(db(), user.id, id, { dueAt }, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: r.row.id, due_at: r.row.dueAt });
  }
  const row = await dropIntention(db(), user.id, id, undefined, "app");
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  await reflectClosedInPlan(db(), user, id);
  return Response.json({ id: row.id, status: row.status });
}
