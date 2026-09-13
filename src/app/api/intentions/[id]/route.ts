import { after } from "next/server";
import { recutAfterDecline } from "@/core/ai/today-plan";
import { isDeclineReason } from "@/core/declines";
import { parseDueDate, startOfLocalDay } from "@/core/due-date";
import { completeIntention, declineIntention, dropIntention, reopenIntention, updateIntention } from "@/core/domain/intentions";
import { reflectClosedInPlan, setFirstStepInPlan } from "@/core/domain/plan-sync";
import { localDate } from "@/core/time";
import { db } from "@/db/client";
import { DEFAULT_LISTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";

// Not this re-cuts the rest of today's path off the response — a model call — or, with nothing queued, before it.
export const maxDuration = 60;

/**
 * Corrections from a page (Today, Lists): complete, reopen, move to another of
 * the user's lists, give it a date, let go — and from Today's card, not this
 * (with its reason, re-cutting the path) and the first step they chose.
 * Everything else goes through the conversation. Every event carries
 * `via: "app"`, so Lumi's context tells these from her own tool calls.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; list?: unknown; text?: unknown; reason?: unknown };
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
    if (typeof body.list !== "string" || !lists.includes(body.list)) return Response.json({ error: "list must be one of the user's lists" }, { status: 400 });
    const r = await updateIntention(db(), user.id, id, { list: body.list }, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: r.row.id, status: r.row.status, list: r.row.list });
  }
  if (body.action === "date") {
    // Typed the way it's said ("fri", "sep 30"), read against their local today; a day alone is 00:00 there. Empty takes the date off.
    const text = typeof body.text === "string" ? body.text.trim() : "";
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
  if (body.action === "decline") {
    // Not this, on Today's card: the reason is recorded (a learning signal, never a failure) and the card changes at once;
    // Lumi re-cuts the rest of the day around it after the response, keeping what the card now shows.
    const reason = isDeclineReason(body.reason) ? body.reason : undefined;
    const row = await declineIntention(db(), user.id, id, reason);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    const { plan, refine } = await recutAfterDecline(db(), user, reason);
    if (refine) after(refine);
    return Response.json({ id: row.id, rightNow: plan.rightNow?.intentionId ?? null, note: plan.note ?? null });
  }
  if (body.action === "first_step") {
    // A step picked from Break it down: it becomes the intention's next action and, if it's Right now, the path's first step — no re-cut.
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 140) : "";
    if (!text) return Response.json({ error: "text required" }, { status: 400 });
    const r = await updateIntention(db(), user.id, id, { nextAction: text }, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    await setFirstStepInPlan(db(), user, id, text);
    return Response.json({ id: r.row.id, next_action: r.row.nextAction });
  }
  if (body.action === "drop") {
    const row = await dropIntention(db(), user.id, id, undefined, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    await reflectClosedInPlan(db(), user, id);
    return Response.json({ id: row.id, status: row.status });
  }
  return Response.json({ error: "action must be complete, reopen, move, date, decline, first_step or drop" }, { status: 400 });
}
