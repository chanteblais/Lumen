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
    <div className="mx-auto w-full max-w-[880px] px-1 pb-14">
      {/* Today is set in the garden: the painting fills the viewport behind the shell
          (globals.css → Today: the garden); the page's parts lie over it on plates of paper. */}
      <div className="today-scene" aria-hidden />
      <div className="today-plate today-opening mb-8">
        <p className="label">Today</p>
        <div className="my-4">
          <Divider />
        </div>
        <div className="flex items-start gap-6">
          <LumiAvatar size={48} className="medallion mt-1" />
          <div className="min-w-0">
            <h1 className="font-display text-[34px] leading-[1.2] text-ink sm:text-[40px]">
              {hello}, {user.displayName}.
            </h1>
            <Suspense fallback={<p className="mt-2 font-display text-[20px] text-ink-mute">Working out the shape of today…</p>}>
              <PlanSection user={user} part="dayline" />
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={<PlanSkeleton />}>
        <PlanSection user={user} part="path" />
      </Suspense>
    </div>
  );
}

/** While the path is being cut: the card, its kicker, and Lumi's three slow dots — the same pause as in the chat, not grey bars. */
function PlanSkeleton() {
  return (
    <section className="card px-8 py-8 sm:px-10" aria-label="Right now" aria-busy>
      <p className="label">Right now</p>
      <p className="thinking-dots mt-5"><span>·</span><span>·</span><span>·</span></p>
    </section>
  );
}
