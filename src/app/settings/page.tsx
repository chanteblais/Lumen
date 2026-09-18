import type { Metadata } from "next";
import { MemoryItem } from "@/components/settings/MemoryItem";
import { Divider, Tailpiece } from "@/components/ui/Ornament";
import { loadBeliefsOrNothing } from "@/core/domain/memory";
import { groupBeliefs, KNOWS_LINES, provenanceLine } from "@/core/knows";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

/**
 * Settings. For now, "What Lumi knows": every belief she holds, grouped by what
 * it's about, whose word it rests on, and a way to correct or forget each one.
 * Nothing here is asked for; no counts. docs/features.md → Settings.
 */
export default async function Page() {
  const user = await requireUser();
  const { beliefs, unavailable } = await loadBeliefsOrNothing(db(), user.id);
  const groups = groupBeliefs(beliefs);

  return (
    <div className="mx-auto w-full max-w-[880px] px-1 pb-14">
      <p className="label">Settings</p>
      <div className="my-4">
        <Divider />
      </div>

      <section aria-labelledby="knows-title">
        <h1 id="knows-title" className="font-display text-[30px] leading-[1.2] text-ink sm:text-[36px]">
          {KNOWS_LINES.title}
        </h1>
        <p className="mt-3 max-w-[640px] text-[17px] leading-snug text-ink-soft">{unavailable ? KNOWS_LINES.unavailable : groups.length ? KNOWS_LINES.intro : KNOWS_LINES.empty}</p>
        {groups.map((g) => (
          <div key={g.kind} className="mt-10">
            <h2 className="label">{g.heading}</h2>
            <ul className="mt-3" aria-label={g.heading}>
              {g.beliefs.map((b) => (
                <MemoryItem key={b.id} id={b.id} content={b.content} provenance={provenanceLine(b, user.timezone)} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <p className="mt-14 text-[17px] leading-snug text-ink-mute">{KNOWS_LINES.later}</p>
      <Tailpiece className="mt-14" />
    </div>
  );
}
