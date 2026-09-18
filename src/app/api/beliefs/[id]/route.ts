import { z } from "zod";
import { applyBeliefOps } from "@/core/domain/memory";
import { isUuid } from "@/core/ids";
import { correctionError } from "@/core/knows";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { readBody } from "@/lib/http";

// Generous: the domain trims and refuses what's too long (a 422 in their words); this only keeps a runaway body out.
const Body = z.object({ content: z.string().max(2000) });

/** "What Lumi knows" → Correct: their word supersedes the belief (the old wording stays as history, out of her context). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  // A malformed id can't be one of theirs: "not found", in the page's words, as before.
  if (!isUuid(id)) return Response.json({ error: correctionError("not found") }, { status: 404 });
  const { data: body, error } = await readBody(req, Body, "content required");
  if (error) return error;
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
  if (!isUuid(id)) return Response.json({ error: correctionError("not found") }, { status: 404 });
  const r = await applyBeliefOps(db(), user.id, [{ op: "delete", id }], "user");
  if (r.deleted.length) return Response.json({ ok: true });
  return Response.json({ error: correctionError(r.skipped[0]?.why) }, { status: 404 });
}
