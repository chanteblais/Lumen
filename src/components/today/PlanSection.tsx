import { cache } from "react";
import { ensureTodaysPlan, needsFirstItems } from "@/core/ai/today-plan";
import { glanceAreas } from "@/core/domain/day-glance";
import { type DaySegment, shapeDay } from "@/core/domain/day-shape";
import { doneOn } from "@/core/domain/intentions";
import { weekDays } from "@/core/domain/rhythms";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";
import { loadSnapshot, type Snapshot } from "@/core/domain/snapshot";
import { CapacityPrompt } from "./CapacityPrompt";
import { RhythmRow } from "./RhythmRow";
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

/** Ten minutes or less: a quick one, worth knowing on a low day. */
const QUICK_MINUTES = 10;
/** A rhythm with no estimate is taken to want about half an hour when looking for room. */
const RHYTHM_MINUTES = 30;

/** "Before Practicum" → "before practicum"; "The rest of the afternoon" → "this afternoon". */
function roomWords(label: string): string {
  if (label.startsWith("The rest of the ")) return `this ${label.slice("The rest of the ".length)}`;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * The page's two layers: `voice` (Lumi's day line and, once a day, the capacity
 * question — set on the painting) and `day`, the rest of today laid along
 * itself (2026-09-18): how full it is, as a shape; what's done above a Now
 * mark; the suggested path in the windows between now and each fixed time,
 * the first thing marked Start here with its step already open; the rhythms
 * they're building, with the days each happened this week; and one quiet line
 * per area of life. docs/today.md → Anatomy.
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

  const now = new Date();
  const shape = shapeDay(
    path,
    later.map((i) => ({ id: i.id, title: i.title, at: i.dueAt!, estimateMinutes: i.estimateMinutes })),
    now,
    user.timezone,
  );
  const areas = glanceAreas(snap.lists, snap.openIntentions, path.map((i) => i.id), snap.priorities, snap.today, user.timezone, now);
  const tintOf = (list: string | null) => (list && snap.lists.includes(list) ? snap.lists.indexOf(list) % 4 : null);
  const done = doneOn(snap.recentlyDone, snap.today, user.timezone);
  const closing = plan.restCanWait ? (plan.closingLine ?? "Everything else can wait.") : null;
  const firstId = plan.rightNow?.intentionId;
  const week = weekDays(snap.today);
  const windows = shape.segments.filter((s): s is Extract<DaySegment<Intention>, { kind: "window" }> => s.kind === "window");
  /** The first window today with room for a rhythm of `minutes`, in words — or null. */
  const roomFor = (minutes: number | null) => {
    const w = windows.find((s) => s.free >= (minutes ?? RHYTHM_MINUTES));
    return w ? roomWords(w.label) : null;
  };

  const row = (i: Intention) => (
    <TodayRow
      key={i.id}
      id={i.id}
      title={i.title}
      list={i.list}
      tint={tintOf(i.list)}
      estimateMinutes={i.estimateMinutes}
      quick={Boolean(i.estimateMinutes && i.estimateMinutes <= QUICK_MINUTES)}
      firstStep={i.id === firstId ? plan.rightNow!.firstStep : i.nextAction}
      startHere={i.id === firstId}
      note={i.id === firstId ? plan.note : undefined}
    />
  );

  // How full the rest of today is, as a shape: each window as wide as it is long, filled by what's placed in it; fixed times as ticks. No numbers.
  const shapeable = shape.segments.filter((s) => s.kind === "landmark" || Number.isFinite(s.minutes));
  const showShape = shapeable.some((s) => s.kind === "window" && s.minutes >= 15) && (path.length > 0 || later.length > 0);

  return (
    <section className="today-day" aria-label="The rest of today">
      <h2 className="today-day-title font-display text-ink">The rest of today</h2>

      {showShape && (
        <div className="today-shape" role="img" aria-label="How full the rest of today is">
          {shapeable.map((s) =>
            s.kind === "landmark" ? (
              <span key={s.id} className="today-shape-tick" title={s.title} />
            ) : (
              <span key={s.label} className="today-shape-window" style={{ flexGrow: Math.max(s.minutes, 8) }}>
                {s.minutes > 0 && s.free < s.minutes && <span className="today-shape-fill" style={{ width: `${Math.min(100, ((s.minutes - s.free) / s.minutes) * 100)}%` }} />}
              </span>
            ),
          )}
        </div>
      )}

      <ol className="today-spine">
        {/* The day so far: what's done, receded above the Now mark. Titles only, never a count. */}
        {done.length > 0 && (
          <li className="today-past" aria-label="Done today">
            <p className="today-done-list">{done.map((i) => i.title).join(" · ")}</p>
          </li>
        )}

        <li className="today-nowmark" aria-label="Now">
          <span className="label">Now</span>
          <span className="today-nowmark-part">{shape.nowPart}</span>
        </li>

        {path.length === 0 && (
          <li className="today-window">
            <p className="today-empty font-display text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
          </li>
        )}

        {shape.segments.map((s) =>
          s.kind === "landmark" ? (
            <li key={s.id} className="today-landmark">
              <span className="today-landmark-time">{fmtTime(s.at, user.timezone)}</span>
              <span className="today-landmark-title">{s.title}</span>
            </li>
          ) : s.items.length > 0 ? (
            <li key={s.label} className="today-window">
              <p className="today-window-label">
                <span className="label label-mute">{s.label}</span>
                {s.span && <span className="today-window-span">{s.span}</span>}
              </p>
              <ul className="today-rows">{s.items.map(row)}</ul>
            </li>
          ) : null,
        )}

        {shape.spill.length > 0 && (
          <li className="today-window today-spill">
            <p className="today-window-label">
              <span className="label label-mute">If there’s room</span>
            </p>
            <ul className="today-rows">{shape.spill.map(row)}</ul>
          </li>
        )}
      </ol>

      {/* The routines they're building: the week as marks on the days each happened. State and shape; never a count. */}
      {snap.rhythms.length > 0 && (
        <section className="today-part today-rhythms" aria-label="Rhythms">
          <p className="label label-mute">Rhythms</p>
          <ul className="today-rhythm-list">
            {snap.rhythms.map((r) => (
              <RhythmRow
                key={r.id}
                id={r.id}
                name={r.name}
                content={r.content}
                cadence={r.cadence}
                week={week}
                practicedOn={r.practicedOn}
                today={snap.today}
                room={r.practicedOn.includes(snap.today) ? null : roomFor(r.typicalMinutes)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* One line per area of life, under the spine: containment, said per area. No numbers. */}
      {areas.length > 0 && (
        <section className="today-part today-standing" aria-label="How things stand">
          <p className="label label-mute">How things stand</p>
          <ul className="today-areas">
            {areas.map((a) => (
              <li key={a.list} className="today-area" data-tint={a.tint} data-status={a.status}>
                <span className="today-area-name">{a.list}</span>
                <span className="today-area-label">{a.label}</span>
                {/* The title only when it says something the spine doesn't: what matters, or a date. */}
                {(a.status === "matters" || a.status === "due_today" || a.status === "due_tomorrow") && <span className="today-area-detail">· {a.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {closing && <p className="today-closing font-display italic">{closing}</p>}
    </section>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
