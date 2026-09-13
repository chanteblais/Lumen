import { cache } from "react";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { ensureTodaysPlan, needsFirstItems } from "@/core/ai/today-plan";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { CapacityPrompt } from "./CapacityPrompt";
import { RightNowActions } from "./RightNowActions";

/** One snapshot per request, shared by the page's readiness check and its three parts. */
const getTodaysSnapshot = cache((user: User) => loadSnapshot(db(), user));

/**
 * Loads the persisted path — usually already primed in the background when
 * the app was opened (`primeTodaysPlan`); generated here only if not. Every
 * part of the page calls this; React's cache() makes it one computation per request.
 */
const getTodaysPlan = cache(async (user: User): Promise<{ snap: Snapshot; plan: DayPlanJson; byId: Map<string, Intention> }> => {
  const { snap, plan } = await ensureTodaysPlan(db(), user, { load: () => getTodaysSnapshot(user) });
  return { snap, plan, byId: new Map(snap.openIntentions.map((i) => [i.id, i])) };
});

/**
 * Today's path is already cut, so the page can render whole without waiting on
 * the model. False when it still has to be generated (the day's first open
 * before the background prime lands, or a plan cut before anything was filed).
 */
export async function planIsReady(user: User): Promise<boolean> {
  const snap = await getTodaysSnapshot(user);
  return Boolean(snap.plan && !needsFirstItems(snap, user.timezone));
}

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

/**
 * The page's three layers, each quieter than the last: `voice` (Lumi's day line
 * and, once a day, the capacity question — set on the painting), `now` (the one
 * card) and `rest` (After that, Later and the closing line on one faint slip).
 */
export async function PlanSection({ user, part }: { user: User; part: "voice" | "now" | "rest" }) {
  const { snap, plan, byId } = await getTodaysPlan(user);

  const rightNow = plan.rightNow ? byId.get(plan.rightNow.intentionId) : undefined;
  const afterThat = plan.afterThat.map((a) => byId.get(a.intentionId)).filter((i): i is Intention => Boolean(i));
  const later = plan.later.map((l) => byId.get(l.intentionId)).filter((i): i is Intention => Boolean(i));

  if (part === "voice") {
    // Once a day, skippable, and only when there is a path to shape.
    const askCapacity = !snap.capacity && !snap.capacitySkipped && Boolean(rightNow || afterThat.length);
    return (
      <>
        <p className="today-dayline mt-2 font-display text-ink-soft">{plan.dayLine}</p>
        {askCapacity && <CapacityPrompt />}
      </>
    );
  }

  if (part === "now") {
    return (
      <section className="today-now" aria-label="Right now">
        {rightNow ? (
          <>
            <h2 className="today-now-title font-display text-ink">{rightNow.title}</h2>
            <Note i={rightNow} />
            <p className="mt-4 text-[17px] leading-snug text-ink-soft">
              <span className="label mr-3">First</span>
              {plan.rightNow!.firstStep}
            </p>
            <RightNowActions key={rightNow.id} id={rightNow.id} title={rightNow.title} />
          </>
        ) : (
          <p className="font-display text-[22px] leading-[1.3] text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
        )}
      </section>
    );
  }

  const closing = plan.restCanWait ? (plan.closingLine ?? "Everything else can wait.") : null;
  if (!afterThat.length && !later.length && !closing) return null;

  return (
    <div className="today-rest">
      {afterThat.length > 0 && (
        <section className="today-part" aria-label="After that">
          <p className="label label-mute">After that</p>
          <ul className="mt-1 flex flex-col">
            {afterThat.map((i) => (
              <li key={i.id} className="row">
                <CompleteCircle id={i.id} label={i.title} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] leading-snug text-ink">{i.title}</p>
                  <Note i={i} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {later.length > 0 && (
        <section className="today-part" aria-label="Later">
          <p className="label label-mute">Later</p>
          <ul className="mt-1 flex flex-col">
            {later.map((i) => (
              <li key={i.id} className="row">
                <span className="w-[22px] flex-none" />
                <p className="min-w-0 flex-1 text-[16px] text-ink-soft">{i.title}</p>
                <span className="label label-mute">{fmtTime(i.dueAt!, user.timezone)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {closing && <p className="today-closing font-display italic">{closing}</p>}
    </div>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
