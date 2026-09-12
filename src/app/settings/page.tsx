import { requireUser } from "@/lib/auth";

export default async function Page() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-[1080px] px-1">
      <p className="label">Settings</p>
      <div className="rule-short my-4 !w-[18px]" />
      <p className="font-display text-[26px] leading-[1.35] text-ink-soft">Your name, your timezone, and what Rali knows about you. Soon.</p>
    </div>
  );
}
