import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanSection } from "@/components/today/PlanSection";
import { LumiAvatar } from "@/components/chat/LumiAvatar";
import { Divider } from "@/components/ui/Ornament";
import { dayPart } from "@/core/time";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Today" };

/** What should I be doing right now? One thing, then a short path. docs/today.md */
export default async function TodayPage() {
  const user = await requireUser();
  // A page open is a visit too: the sitting (and any gap it began after) starts here if Today is opened first.
  await recordVisit(user);
  const part = dayPart(new Date(), user.timezone);
  const hello = part === "morning" ? "Good morning" : part === "afternoon" ? "Good afternoon" : part === "evening" ? "Good evening" : "Still up";

  return (
    <div className="today-page">
      {/* Today is set in the garden (globals.css → Today: the garden): the painting fills the
          viewport behind the shell, the page is one paper panel on its right, and the room
          stays open for Lumi to stand in. */}
      <div className="today-scene" aria-hidden />
      <div className="today-panel">
        <p className="label">Today</p>
        <div className="my-3">
          <Divider />
        </div>
        <div className="flex items-start gap-4">
          <LumiAvatar size={40} className="medallion mt-1" />
          <div className="min-w-0">
            <h1 className="font-display text-[30px] leading-[1.15] text-ink">
              {hello}, {user.displayName}.
            </h1>
            <Suspense fallback={<p className="today-dayline mt-2 font-display text-ink-mute">Working out the shape of today…</p>}>
              <PlanSection user={user} part="dayline" />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<PlanSkeleton />}>
          <PlanSection user={user} part="path" />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <PlanSection user={user} part="closing" />
      </Suspense>
    </div>
  );
}

/** While the path is being cut: the Right now kicker and Lumi's three slow dots — the same pause as in the chat, not grey bars. */
function PlanSkeleton() {
  return (
    <section className="today-now" aria-label="Right now" aria-busy>
      <p className="label">Right now</p>
      <p className="thinking-dots mt-4"><span>·</span><span>·</span><span>·</span></p>
    </section>
  );
}
