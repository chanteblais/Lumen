import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanSection } from "@/components/today/PlanSection";
import { Divider } from "@/components/ui/Ornament";
import { dayPart } from "@/core/time";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Today" };

/** What should I be doing right now? One thing, then a short path. docs/today.md */
export default async function TodayPage() {
  // A page open is a visit too: the sitting (and any gap it began after) starts here if Today is opened first.
  const { user } = await requireVisit();
  const part = dayPart(new Date(), user.timezone);
  const hello = part === "morning" ? "Good morning" : part === "afternoon" ? "Good afternoon" : part === "evening" ? "Good evening" : "Still up";

  return (
    <div className="today-page">
      {/* Today is set in the garden (globals.css → Today: the garden): the painting fills the
          viewport behind the shell, and three things sit on it, each quieter than the last —
          Lumi's words set on the painting, the one Right now card, and a slip with the rest. */}
      <div className="today-scene" aria-hidden />
      <header className="today-voice">
        <p className="label">Today</p>
        <div className="my-3">
          <Divider />
        </div>
        <h1 className="font-display text-[30px] leading-[1.15] text-ink">
          {hello}, {user.displayName}.
        </h1>
        <Suspense fallback={<p className="today-dayline mt-2 font-display text-ink-mute">Working out the shape of today…</p>}>
          <PlanSection user={user} part="voice" />
        </Suspense>
      </header>

      <Suspense fallback={<PlanSkeleton />}>
        <PlanSection user={user} part="now" />
      </Suspense>

      <Suspense fallback={null}>
        <PlanSection user={user} part="rest" />
      </Suspense>
    </div>
  );
}

/** While the path is being cut: the card with Lumi's three slow dots — the same pause as in the chat, not grey bars. */
function PlanSkeleton() {
  return (
    <section className="today-now" aria-label="Right now" aria-busy>
      <p className="thinking-dots"><span>·</span><span>·</span><span>·</span></p>
    </section>
  );
}
