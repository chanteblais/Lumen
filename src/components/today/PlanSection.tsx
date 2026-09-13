import { cache } from "react";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { ensureTodaysPlan } from "@/core/ai/today-plan";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import type { Snapshot } from "@/core/domain/snapshot";
import { CapacityPrompt } from "./CapacityPrompt";
import { RightNowActions } from "./RightNowActions";

/**
 * Loads the persisted path — usually already primed in the background when
 * the app was opened (`primeTodaysPlan`); generated here only if not. Every
 * part of the page calls this; React's cache() makes it one computation per request.
 */
const getTodaysPlan = cache(async (user: User): Promise<{ snap: Snapshot; plan: DayPlanJson; byId: Map<string, Intention> }> => {
  const { snap, plan } = await ensureTodaysPlan(db(), user);
  return { snap, plan, byId: new Map(snap.openIntentions.map((i) => [i.id, i])) };
});

/** The list and the estimate as a marginal note (two parted by a middle dot). */
function Note({ i }: { i: Intention }) {
  if (!i.list && !i.estimateMinutes) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-3">
      {i.list && <span className="pill">{i.list}</span>}
      {i.estimateMinutes ? <span className="pill">~{i.estimateMinutes} min</span> : null}
    </div>
  );
}

export async function PlanSection({ user, part }: { user: User; part: "dayline" | "path" | "closing" }) {
  const { snap, plan, byId } = await getTodaysPlan(user);

  if (part === "dayline") {
    return <p className="today-dayline mt-2 font-display text-ink-soft">{plan.dayLine}</p>;
  }
  if (part === "closing") {
    return plan.restCanWait ? <p className="today-aside font-display italic">{plan.closingLine ?? "Everything else can wait."}</p> : null;
  }

  const rightNow = plan.rightNow ? byId.get(plan.rightNow.intentionId) : undefined;
  const afterThat = plan.afterThat.map((a) => byId.get(a.intentionId)).filter((i): i is Intention => Boolean(i));
  const later = plan.later.map((l) => byId.get(l.intentionId)).filter((i): i is Intention => Boolean(i));
  // Once a day, skippable, and only when there is a path to shape.
  const askCapacity = !snap.capacity && !snap.capacitySkipped && Boolean(rightNow || afterThat.length);

  return (
    <>
      {askCapacity && <CapacityPrompt />}

      <section className="today-now" aria-label="Right now">
        <p className="label">Right now</p>
        {rightNow ? (
          <>
            <div className="mt-4 flex items-start gap-4">
              <CompleteCircle key={rightNow.id} id={rightNow.id} label={rightNow.title} size={30} />
              <div className="min-w-0 flex-1">
                <h2 className="today-now-title font-display text-ink">{rightNow.title}</h2>
                <Note i={rightNow} />
                <p className="mt-4 text-[17px] leading-snug text-ink-soft">
                  <span className="label mr-3">First</span>
                  {plan.rightNow!.firstStep}
                </p>
              </div>
            </div>
            <RightNowActions key={rightNow.id} id={rightNow.id} title={rightNow.title} />
          </>
        ) : (
          <p className="mt-4 font-display text-[22px] leading-[1.3] text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
        )}
      </section>

      {afterThat.length > 0 && (
        <section className="today-part" aria-label="After that">
          <p className="label">After that</p>
          <ul className="mt-1 flex flex-col">
            {afterThat.map((i) => (
              <li key={i.id} className="row">
                <CompleteCircle id={i.id} label={i.title} />
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-snug text-ink">{i.title}</p>
                  <Note i={i} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {later.length > 0 && (
        <section className="today-part" aria-label="Later">
          <p className="label">Later</p>
          <ul className="mt-1 flex flex-col">
            {later.map((i) => (
              <li key={i.id} className="row row-quiet">
                <span className="w-[26px]" />
                <p className="min-w-0 flex-1 text-[17px] text-ink-soft">{i.title}</p>
                <span className="label label-mute">{fmtTime(i.dueAt!, user.timezone)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
