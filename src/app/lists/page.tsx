import type { Metadata } from "next";
import Link from "next/link";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { Divider, Tailpiece } from "@/components/ui/Ornament";
import { loadSnapshot } from "@/core/domain/snapshot";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lists" };

/** The pile. Lumi files things here from the conversation; you tick them off or correct her. */
export default async function ListsPage() {
  const user = await requireUser();
  await recordVisit(user);
  const snap = await loadSnapshot(db(), user);
  const groups = new Map<string, typeof snap.openIntentions>();
  for (const name of snap.lists) groups.set(name, []);
  for (const i of snap.openIntentions) {
    const key = i.list && groups.has(i.list) ? i.list : i.list ?? "Unsorted";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-1 pb-14">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="label">Lists</p>
          <div className="my-4">
            <Divider />
          </div>
          <p className="font-display text-[26px] leading-[1.35] text-ink-soft">Everything, kept. Say it in the chat and Lumi files it here.</p>
        </div>
        <Link href={{ pathname: "/", query: { prefill: "Add to my list: " } }} className="chip shrink-0">
          Add something
        </Link>
      </div>

      {snap.openIntentions.length === 0 && (
        <p className="font-display text-[22px] text-ink-mute">Nothing here yet. Tell Lumi what&rsquo;s on your mind and it&rsquo;ll land in the right place.</p>
      )}

      <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        {[...groups.entries()].map(([name, items]) =>
          items.length === 0 && !snap.lists.includes(name) ? null : (
            <section key={name} aria-label={name}>
              <div className="mb-3 flex items-baseline gap-4">
                <h2 className="font-display text-[24px] text-ink">{name}</h2>
                <div className="rule flex-1" />
              </div>
              {items.length === 0 ? (
                <p className="py-3 text-[16px] text-ink-mute">Nothing filed here.</p>
              ) : (
                <ul className="flex flex-col">
                  {items.map((i) => (
                    <li key={i.id} className="row">
                      <CompleteCircle id={i.id} label={i.title} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[18px] leading-snug text-ink">{i.title}</p>
                        {i.nextAction && <p className="mt-0.5 text-[15px] text-ink-mute">{i.nextAction}</p>}
                      </div>
                      {i.estimateMinutes && <span className="pill">~{i.estimateMinutes} min</span>}
                      {i.dueAt && <span className="pill">{fmt(i.dueAt, user.timezone)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ),
        )}
      </div>

      {snap.openIntentions.length === 0 && <Tailpiece className="mt-14" />}
    </div>
  );
}

function fmt(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "short", day: "numeric" }).format(d);
}
