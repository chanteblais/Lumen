import { cache } from "react";
import Link from "next/link";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { ensureTodaysPlan } from "@/core/ai/today-plan";
import { db } from "@/db/client";
import type { DayPlanJson, Intention, User } from "@/db/schema";

/**
 * Loads the persisted path — usually already primed in the background when
 * the app was opened (`primeTodaysPlan`); generated here only if not. Both
 * halves of the page call this; React's cache() makes it one computation per request.
 */
const getTodaysPlan = cache(async (user: User): Promise<{ plan: DayPlanJson; byId: Map<string, Intention> }> => {
  const { snap, plan } = await ensureTodaysPlan(db(), user);
  return { plan, byId: new Map(snap.openIntentions.map((i) => [i.id, i])) };
});

export async function PlanSection({ user, part }: { user: User; part: "dayline" | "path" }) {
  const { plan, byId } = await getTodaysPlan(user);

  if (part === "dayline") {
    return <p className="mt-2 font-display text-[20px] leading-[1.4] text-ink-soft sm:text-[22px]">{plan.dayLine}</p>;
  }

  const rightNow = plan.rightNow ? byId.get(plan.rightNow.intentionId) : undefined;
  const afterThat = plan.afterThat.map((a) => byId.get(a.intentionId)).filter((i): i is Intention => Boolean(i));
  const later = plan.later.map((l) => byId.get(l.intentionId)).filter((i): i is Intention => Boolean(i));

  return (
    <div className="flex flex-col gap-8">
      <section className="card px-8 py-8 sm:px-10 sm:py-9" aria-label="Right now">
        <p className="label">Right now</p>
        {rightNow ? (
          <>
            <div className="mt-5 flex items-start gap-5">
              <CompleteCircle key={rightNow.id} id={rightNow.id} label={rightNow.title} size={34} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[32px] leading-[1.15] text-ink sm:text-[40px]">{rightNow.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {rightNow.list && <span className="pill">{rightNow.list}</span>}
                  {rightNow.estimateMinutes && <span className="pill">~{rightNow.estimateMinutes} min</span>}
                </div>
                <p className="mt-5 text-[18px] leading-snug text-ink-soft">
                  <span className="label mr-3">First</span>
                  {plan.rightNow!.firstStep}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={{ pathname: "/", query: { start: rightNow.id } }} className="btn-primary">
                Start with Lumi
              </Link>
              <Link href={{ pathname: "/", query: { decline: rightNow.id } }} className="btn-ghost">
                Not this
              </Link>
              <Link href={{ pathname: "/", query: { breakdown: rightNow.id } }} className="tool-link ml-2">
                Break it down
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-5 font-display text-[26px] text-ink-soft">Nothing queued. {later.length ? "Just what's on the clock." : "Say what's on your mind in the chat, or enjoy the quiet."}</p>
        )}
      </section>

      {afterThat.length > 0 && (
        <section aria-label="After that">
          <div className="mb-3 flex items-baseline gap-4">
            <p className="label">After that</p>
            <div className="rule flex-1" />
          </div>
          <ul className="flex flex-col">
            {afterThat.map((i) => (
              <li key={i.id} className="row">
                <CompleteCircle id={i.id} label={i.title} />
                <p className="min-w-0 flex-1 text-[18px] leading-snug text-ink">{i.title}</p>
                {i.list && <span className="pill">{i.list}</span>}
                {i.estimateMinutes && <span className="pill">~{i.estimateMinutes} min</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {later.length > 0 && (
        <section aria-label="Later">
          <div className="mb-3 flex items-baseline gap-4">
            <p className="label">Later</p>
            <div className="rule flex-1" />
          </div>
          <ul className="flex flex-col">
            {later.map((i) => (
              <li key={i.id} className="row row-quiet">
                <span className="w-[26px]" />
                <p className="min-w-0 flex-1 text-[18px] text-ink-soft">{i.title}</p>
                <span className="label label-mute">{fmtTime(i.dueAt!, user.timezone)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.restCanWait && (
        <p className="font-display text-[20px] italic text-ink-mute">{plan.closingLine ?? "Everything else can wait."}</p>
      )}
    </div>
  );
}

function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
