import { completeIntention, reopenIntention } from "@/core/domain/intentions";
import { reflectClosedInPlan } from "@/core/domain/plan-sync";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

/** Complete or reopen from Today / Library. Everything else goes through the conversation. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
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
  return Response.json({ error: "action must be complete or reopen" }, { status: 400 });
}
