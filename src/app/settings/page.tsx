import type { Metadata } from "next";
import { Divider, Tailpiece } from "@/components/ui/Ornament";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-[1080px] px-1 pb-10">
      <p className="label">Settings</p>
      <div className="my-4"><Divider /></div>
      <p className="font-display text-[26px] leading-[1.35] text-ink-soft">Your name, your timezone, and what Lumi knows about you. Soon.</p>
      <Tailpiece className="mt-14" />
    </div>
  );
}
