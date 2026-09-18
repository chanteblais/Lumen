/**
 * Today at a glance: one line per area of life (a list), read off what is
 * already stored — what they said matters, dates, and today's path. Derived at
 * read time, never persisted; no counts of anything undone. docs/today.md →
 * Anatomy → At a glance. Pure; tested.
 */
import type { Intention, Priority } from "@/db/schema";
import { localDayDiff } from "@/core/time";
import { holdsOn } from "./priorities";

export type GlanceStatus = "matters" | "due_today" | "due_tomorrow" | "on_path" | "can_wait";

export type GlanceArea = {
  list: string;
  /** The list's place among the user's lists, as on the Lists sheet (0–3). */
  tint: number;
  status: GlanceStatus;
  /** The headline: "What matters this week", "Due today", "On today's path", "Can wait". */
  label: string;
  /** One quiet line under it: the thing that earned the headline, or why it can wait. */
  detail: string;
};

/** Most to least pressing; an area shows the first that's true of it. */
const RANK: Record<GlanceStatus, number> = { matters: 0, due_today: 1, due_tomorrow: 2, on_path: 3, can_wait: 4 };

export const GLANCE_LIMIT = 4;

type Source = Pick<Intention, "id" | "title" | "list" | "dueAt">;

export function glanceAreas(
  lists: string[],
  open: Source[],
  pathIds: string[],
  priorities: Pick<Priority, "intentionId" | "scope" | "weekOf" | "retiredAt">[],
  today: string,
  timeZone: string,
  now: Date = new Date(),
): GlanceArea[] {
  const onPath = new Map(pathIds.map((id, n) => [id, n]));
  const matters = new Map<string, Priority["scope"]>();
  for (const p of priorities) if (p.intentionId && holdsOn(p, today) && !matters.has(p.intentionId)) matters.set(p.intentionId, p.scope);

  const areas: GlanceArea[] = [];
  lists.forEach((list, index) => {
    const here = open.filter((i) => i.list?.trim() === list);
    if (!here.length) return;
    const tint = index % 4;

    const held = here.find((i) => matters.has(i.id));
    if (held) {
      areas.push({ list, tint, status: "matters", label: matters.get(held.id) === "week" ? "What matters this week" : "What matters for now", detail: held.title });
      return;
    }
    const dueIn = (i: Source) => (i.dueAt ? localDayDiff(now, i.dueAt, timeZone) : null);
    const dueToday = here.find((i) => dueIn(i) === 0);
    if (dueToday) {
      areas.push({ list, tint, status: "due_today", label: "Due today", detail: dueToday.title });
      return;
    }
    const dueTomorrow = here.find((i) => dueIn(i) === 1);
    if (dueTomorrow) {
      areas.push({ list, tint, status: "due_tomorrow", label: "Due tomorrow", detail: dueTomorrow.title });
      return;
    }
    const firstOnPath = here.filter((i) => onPath.has(i.id)).sort((a, b) => onPath.get(a.id)! - onPath.get(b.id)!)[0];
    if (firstOnPath) {
      areas.push({ list, tint, status: "on_path", label: "On today's path", detail: firstOnPath.title });
      return;
    }
    areas.push({ list, tint, status: "can_wait", label: "Can wait", detail: "Nothing here needs today." });
  });

  // With more areas than room, the least pressing drop off; the rest keep their own order, so the cards stay put day to day.
  const kept = new Set(
    areas
      .map((a, n) => ({ a, n }))
      .sort((x, y) => RANK[x.a.status] - RANK[y.a.status] || x.n - y.n)
      .slice(0, GLANCE_LIMIT)
      .map(({ a }) => a),
  );
  return areas.filter((a) => kept.has(a));
}
