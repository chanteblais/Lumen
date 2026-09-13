import { breakDown } from "@/core/ai/breakdown";
import { getIntention } from "@/core/domain/intentions";
import { loadBeliefsOrNothing } from "@/core/domain/memory";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

// A model call.
export const maxDuration = 60;

/**
 * Break it down, on Today's card: a few small physical steps for one open
 * intention, proposed by Lumi, for the user to pick the one they'll start with
 * (`PATCH /api/intentions/[id]` → `first_step`). Writes nothing.
 * `smallerThan`: the steps they found still too big.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { smallerThan?: unknown };
  const intention = await getIntention(db(), user.id, id);
  if (!intention || intention.status !== "open") return Response.json({ error: "not found" }, { status: 404 });
  const smallerThan = Array.isArray(body.smallerThan) ? body.smallerThan.filter((s): s is string => typeof s === "string").slice(0, 5) : undefined;
  const { beliefs } = await loadBeliefsOrNothing(db(), user.id);
  const steps = await breakDown({
    title: intention.title,
    note: intention.note,
    nextAction: intention.nextAction,
    estimateMinutes: intention.estimateMinutes,
    smallerThan,
    beliefs,
  });
  if (!steps.length) return Response.json({ error: "no steps" }, { status: 502 });
  return Response.json({ steps });
}
