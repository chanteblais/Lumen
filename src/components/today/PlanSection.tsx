import { cache } from "react";
import { ensureTodaysPlan, needsFirstItems } from "@/core/ai/today-plan";
import { glanceAreas } from "@/core/domain/day-glance";
import { doneOn } from "@/core/domain/intentions";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { CapacityPrompt } from "./CapacityPrompt";
import { TodayRow } from "./TodayRow";

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

/**
 * The page's two layers: `voice` (Lumi's day line and, once a day, the capacity
 * question — set on the painting) and `day`, Today at a glance (2026-09-18,
 * after Chanté's mockup): a sheet with a card per area of life, Suggested for
 * today (the path as one list — no Right now card), what's done, and the
 * closing line; and Up next beside it with the fixed times. docs/today.md → Anatomy.
 */
export async function PlanSection({ user, part }: { user: User; part: "voice" | "day" }) {
  const { snap, plan, byId } = await getTodaysPlan(user);

  const path = [plan.rightNow?.intentionId, ...plan.afterThat.map((a) => a.intentionId)]
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((i): i is Intention => Boolean(i));
  const later = plan.later.map((l) => byId.get(l.intentionId)).filter((i): i is Intention => Boolean(i));

  if (part === "voice") {
    // Once a day, skippable, and only when there is a path to shape.
    const askCapacity = !snap.capacity && !snap.capacitySkipped && path.length > 0;
    return (
      <>
        <p className="today-dayline mt-2 font-display text-ink-soft">{plan.dayLine}</p>
        {askCapacity && <CapacityPrompt />}
      </>
    );
  }

  const areas = glanceAreas(snap.lists, snap.openIntentions, path.map((i) => i.id), snap.priorities, snap.today, user.timezone);
  const tintOf = (list: string | null) => (list && snap.lists.includes(list) ? snap.lists.indexOf(list) % 4 : null);
  const done = doneOn(snap.recentlyDone, snap.today, user.timezone);
  const closing = plan.restCanWait ? (plan.closingLine ?? "Everything else can wait.") : null;
  const firstId = plan.rightNow?.intentionId;

  return (
    <div className="today-board">
      <section className="today-day" aria-label="Today at a glance">
        <h2 className="today-day-title font-display text-ink">Today at a glance</h2>

        {areas.length > 0 && (
          <ul className="today-areas" aria-label="Areas">
            {areas.map((a) => (
              <li key={a.list} className="today-area" data-tint={a.tint} data-status={a.status}>
                <p className="today-area-name">{a.list}</p>
                <p className="today-area-label">{a.label}</p>
                <p className="today-area-detail font-display italic">{a.detail}</p>
              </li>
            ))}
          </ul>
        )}

        <section className="today-part today-suggested" aria-label="Suggested for today">
          <p className="label">Suggested for today</p>
          {path.length > 0 ? (
            <ul className="today-rows">
              {path.map((i) => (
                <TodayRow
                  key={i.id}
                  id={i.id}
                  title={i.title}
                  list={i.list}
                  tint={tintOf(i.list)}
                  estimateMinutes={i.estimateMinutes}
                  firstStep={i.id === firstId ? plan.rightNow!.firstStep : i.nextAction}
                  note={i.id === firstId ? plan.note : undefined}
                />
              ))}
            </ul>
          ) : (
            <p className="today-empty font-display text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
          )}
        </section>

        {/* What's already off the plate today, receded: titles only, oldest first, never a count. */}
        {done.length > 0 && (
          <section className="today-part today-done" aria-label="Done today">
            <p className="label label-mute">Done today</p>
            <p className="today-done-list">{done.map((i) => i.title).join(" · ")}</p>
          </section>
        )}

        {closing && <p className="today-closing font-display italic">{closing}</p>}
      </section>

      {later.length > 0 && (
        <aside className="today-upnext" aria-label="Up next">
          <p className="label">Up next</p>
          <ol className="today-times">
            {later.map((i) => (
              <li key={i.id}>
                <span className="today-time">{fmtTime(i.dueAt!, user.timezone)}</span>
                <span className="today-time-title">{i.title}</span>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
