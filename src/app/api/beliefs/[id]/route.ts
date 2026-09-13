import { applyBeliefOps } from "@/core/domain/memory";
import { correctionError } from "@/core/knows";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "What Lumi knows" → Correct: their word supersedes the belief (the old wording stays as history, out of her context). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: correctionError("not found") }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { content?: unknown };
  if (typeof body.content !== "string") return Response.json({ error: "content required" }, { status: 400 });
  const r = await applyBeliefOps(db(), user.id, [{ op: "revise", id, content: body.content }], "user");
  const b = r.created[0];
  if (b) return Response.json({ id: b.id, content: b.content });
  const why = r.skipped[0]?.why;
  return Response.json({ error: correctionError(why) }, { status: why === "not active" ? 404 : 422 });
}

/** "What Lumi knows" → Forget: the belief and every earlier wording, deleted. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: correctionError("not found") }, { status: 404 });
  const r = await applyBeliefOps(db(), user.id, [{ op: "delete", id }], "user");
  if (r.deleted.length) return Response.json({ ok: true });
  return Response.json({ error: correctionError(r.skipped[0]?.why) }, { status: 404 });
}
