import { completeIntention, dropIntention, reopenIntention, updateIntention } from "@/core/domain/intentions";
import { reflectClosedInPlan } from "@/core/domain/plan-sync";
import { db } from "@/db/client";
import { DEFAULT_LISTS } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/**
 * Corrections from a page (Today, Lists): complete, reopen, move to another of
 * the user's lists, or let go. Everything else goes through the conversation.
 * Every event carries `via: "app"`, so Lumi's context tells these from her own tool calls.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; list?: unknown };
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
    const row = await updateIntention(db(), user.id, id, { list: body.list }, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: row.id, status: row.status, list: row.list });
  }
  if (body.action === "drop") {
    const row = await dropIntention(db(), user.id, id, undefined, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    await reflectClosedInPlan(db(), user, id);
    return Response.json({ id: row.id, status: row.status });
  }
  return Response.json({ error: "action must be complete, reopen, move or drop" }, { status: 400 });
}
