import type { Metadata } from "next";
import Link from "next/link";
import { CompleteCircle } from "@/components/lists/CompleteCircle";
import { Divider, Tailpiece } from "@/components/ui/Ornament";
import { loadSnapshot } from "@/core/domain/snapshot";
import { db } from "@/db/client";
import { recordVisit, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/** The pile, kept in the Library. Lumi files things here from the conversation; you tick them off or correct her. */
export default async function LibraryPage() {
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
    <div className="library-page">
      {/* The Library is set in a painted reading room (globals.css → Library: the reading room):
          the painting fills the viewport behind the shell, the lists sit on one paper panel on
          its right, and the room stays open for Lumi to stand in. */}
      <div className="library-scene" aria-hidden />
      <div className="library-panel">
        <div className="flex items-center justify-between gap-6">
          <p className="label">Library</p>
          <Link href={{ pathname: "/", query: { prefill: "Add to my list: " } }} className="chip shrink-0">
            Add something
          </Link>
        </div>
        <div className="my-3">
          <Divider />
        </div>
        <p className="font-display text-[22px] leading-[1.35] text-ink-soft">Everything, kept. Say it in the chat and Lumi files it here.</p>

        {snap.openIntentions.length === 0 && (
          <p className="mt-6 font-display text-[20px] text-ink-mute">Nothing here yet. Tell Lumi what&rsquo;s on your mind and it&rsquo;ll land in the right place.</p>
        )}

        {[...groups.entries()].map(([name, items]) =>
          items.length === 0 && !snap.lists.includes(name) ? null : (
            <section key={name} aria-label={name} className="library-list">
              <div className="mb-2 flex items-baseline gap-4">
                <h2 className="font-display text-[24px] text-ink">{name}</h2>
                <div className="rule flex-1" />
              </div>
              {items.length === 0 ? (
                <p className="py-2 text-[16px] text-ink-mute">Nothing filed here.</p>
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

        {snap.openIntentions.length === 0 && <Tailpiece className="mt-10" />}
      </div>
    </div>
  );
}

function fmt(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "short", day: "numeric" }).format(d);
}
