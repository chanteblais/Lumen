import { dismissLead, keepLead } from "@/core/domain/leads";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

/** Keep (→ an intention) or let go a lead from Insights. Lumi does the same in chat with keep_lead / dismiss_lead. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === "keep") {
    const r = await keepLead(db(), user.id, id, "app");
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: r.lead.id, status: r.lead.status, intentionId: r.intention.id });
  }
  if (body.action === "dismiss") {
    const row = await dismissLead(db(), user.id, id, "app");
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ id: row.id, status: row.status });
  }
  return Response.json({ error: "action must be keep or dismiss" }, { status: 400 });
}
