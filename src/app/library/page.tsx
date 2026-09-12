import { Divider, Tailpiece } from "@/components/ui/Ornament";
import { requireUser } from "@/lib/auth";

export default async function Page() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-[1080px] px-1 pb-10">
      <p className="label">Library</p>
      <div className="my-4"><Divider /></div>
      <p className="font-display text-[26px] leading-[1.35] text-ink-soft">Not yet. This will hold the strategies that actually work for you.</p>
      <Tailpiece className="mt-14" />
    </div>
  );
}
