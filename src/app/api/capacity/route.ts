import { recutTodaysPlan } from "@/core/ai/today-plan";
import { isCapacityLevel, reportCapacity, skipCapacity } from "@/core/domain/capacity";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

// Answering re-cuts the path, which is a model call.
export const maxDuration = 60;

/**
 * Today's capacity prompt. `{ level }` records the report and re-cuts the
 * path around it (unless nothing would change); `{ skip: true }` records
 * that it was asked, so Today doesn't ask again today.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as { level?: unknown; skip?: unknown };
  if (body.skip === true) {
    await skipCapacity(db(), user.id);
    return Response.json({ skipped: true });
  }
  if (!isCapacityLevel(body.level)) {
    return Response.json({ error: "level must be low, normal or high — or skip: true" }, { status: 400 });
  }
  await reportCapacity(db(), user.id, { level: body.level });
  const { plan } = await recutTodaysPlan(db(), user, "capacity");
  return Response.json({ level: body.level, rightNow: plan.rightNow?.intentionId ?? null });
}
