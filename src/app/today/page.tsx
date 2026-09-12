import { Suspense } from "react";
import { PlanSection } from "@/components/today/PlanSection";
import { LumiAvatar } from "@/components/chat/LumiAvatar";
import { dayPart } from "@/core/time";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** What should I be doing right now? One thing, then a short path. docs/today.md */
export default async function TodayPage() {
  const user = await requireUser();
  // A page open is a visit too: the sitting (and any gap it began after) starts here if Today is opened first.
  await recordVisit(user);
  const part = dayPart(new Date(), user.timezone);
  const hello = part === "morning" ? "Good morning" : part === "afternoon" ? "Good afternoon" : part === "evening" ? "Good evening" : "Still up";

  return (
    <div className="mx-auto w-full max-w-[880px] px-1 pb-14">
      <div className="mb-8 flex items-start gap-6">
        <LumiAvatar size={48} className="mt-1" />
        <div className="min-w-0">
          <h1 className="font-display text-[34px] leading-[1.2] text-ink sm:text-[40px]">
            {hello}, {user.displayName}.
          </h1>
          <Suspense fallback={<p className="mt-2 font-display text-[20px] text-ink-mute">Working out the shape of today…</p>}>
            <PlanSection user={user} part="dayline" />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<PlanSkeleton />}>
        <PlanSection user={user} part="path" />
      </Suspense>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <section className="card px-8 py-8 sm:px-10">
      <p className="label">Right now</p>
      <div className="mt-6 h-9 w-2/3 rounded bg-paper-deep" />
      <div className="mt-4 h-5 w-1/3 rounded bg-paper-deep" />
    </section>
  );
}
