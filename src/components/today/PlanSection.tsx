import { cache } from "react";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { ensureTodaysPlan, needsFirstItems } from "@/core/ai/today-plan";
import { doneOn } from "@/core/domain/intentions";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { CapacityPrompt } from "./CapacityPrompt";
import { RightNowActions } from "./RightNowActions";

/** One snapshot per request, shared by the page's readiness check and its parts. */
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

/** The list and the estimate as one marginal note, parted by a middle dot. */
function Note({ i }: { i: Intention }) {
  const parts = [i.list, i.estimateMinutes ? `~${i.estimateMinutes} min` : null].filter(Boolean);
  if (!parts.length) return null;
  return <p className="today-row-note">{parts.join(" · ")}</p>;
}

/**
 * The page's two layers: `voice` (Lumi's day line and, once a day, the capacity
 * question — set on the painting) and `day` (the day at a glance on one sheet:
 * Right now, After that, Later, what's done, and the closing line). Right now
 * leads the sheet; it no longer takes the page (2026-09-18). docs/today.md → Anatomy.
 */
export async function PlanSection({ user, part }: { user: User; part: "voice" | "day" }) {
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

  const done = doneOn(snap.recentlyDone, snap.today, user.timezone);
  const closing = plan.restCanWait ? (plan.closingLine ?? "Everything else can wait.") : null;

  return (
    <section className="today-day" aria-label="Today at a glance">
      <section className="today-part today-now" aria-label="Right now">
        <p className="label">Right now</p>
        {rightNow ? (
          <>
            <h2 className="today-now-title font-display text-ink">{rightNow.title}</h2>
            {/* After a Not this, Lumi's one line on why this fits instead. */}
            {plan.note && <p className="today-now-note font-display italic">{plan.note}</p>}
            <Note i={rightNow} />
            <p className="today-first">
              <span className="label label-mute mr-2">First</span>
              {plan.rightNow!.firstStep}
            </p>
            <RightNowActions key={rightNow.id} id={rightNow.id} title={rightNow.title} />
          </>
        ) : (
          <p className="today-now-empty font-display text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
        )}
      </section>

      {afterThat.length > 0 && (
        <section className="today-part" aria-label="After that">
          <p className="label label-mute">After that</p>
          <ul className="mt-1 flex flex-col">
            {afterThat.map((i) => (
              <li key={i.id} className="row">
                <CompleteCircle id={i.id} label={i.title} size={20} />
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
                <span className="today-time label label-mute">{fmtTime(i.dueAt!, user.timezone)}</span>
                <p className="min-w-0 flex-1 text-[16px] text-ink-soft">{i.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* What's already off the plate today, receded: titles only, oldest first, never a count. */}
      {done.length > 0 && (
        <section className="today-part today-done" aria-label="Done today">
          <p className="label label-mute">Done today</p>
          <p className="today-done-list">{done.map((i) => i.title).join(" · ")}</p>
        </section>
      )}

      {closing && <p className="today-closing font-display italic">{closing}</p>}
    </section>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
