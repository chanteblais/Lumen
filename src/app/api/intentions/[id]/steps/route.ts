import { z } from "zod";
import { breakDown } from "@/core/ai/breakdown";
import { getIntention } from "@/core/domain/intentions";
import { loadBeliefsOrNothing } from "@/core/domain/memory";
import { isUuid } from "@/core/ids";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { badRequest, readBody } from "@/lib/http";

// A model call.
export const maxDuration = 60;

// The steps Lumi proposed (≤ 5, ≤ 100 chars each), sent back when they were still too big.
const Body = z.object({ smallerThan: z.array(z.string().max(200)).max(5).optional() });

/**
 * Break it down, on Today's card: a few small physical steps for one open
 * intention, proposed by Lumi, for the user to pick the one they'll start with
 * (`PATCH /api/intentions/[id]` → `first_step`). Writes nothing.
 * `smallerThan`: the steps they found still too big.
 * A malformed id or body is a 400, before any query or model call.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) return badRequest("id must be an intention id");
  const { data: body, error } = await readBody(req, Body, "smallerThan must be a list of steps");
  if (error) return error;
  const intention = await getIntention(db(), user.id, id);
  if (!intention || intention.status !== "open") return Response.json({ error: "not found" }, { status: 404 });
  const { beliefs } = await loadBeliefsOrNothing(db(), user.id);
  const steps = await breakDown({
    title: intention.title,
    note: intention.note,
    nextAction: intention.nextAction,
    estimateMinutes: intention.estimateMinutes,
    smallerThan: body.smallerThan?.length ? body.smallerThan : undefined,
    beliefs,
  });
  if (!steps.length) return Response.json({ error: "no steps" }, { status: 502 });
  return Response.json({ steps });
}
