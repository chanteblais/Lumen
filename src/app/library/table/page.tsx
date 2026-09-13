import type { Metadata } from "next";
import Link from "next/link";
import { LibrarySheet, LibraryUnreadable } from "@/components/library/LibrarySheet";
import { readHeld } from "@/components/library/load";
import { BOOKCASES } from "@/components/library/room-slots";
import { clip, firstLine } from "@/components/library/shelves";
import { RoomScene } from "@/components/shell/RoomScene";
import { buildShelves } from "@/core/domain/library";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/**
 * The table in the reading circle: the threads that stand on their own (under
 * nothing, holding nothing) as papers, each opening its book, and any section
 * the room has no bookcase for yet.
 */
export default async function LibraryTablePage() {
  const { user } = await requireVisit();
  const held = await readHeld(user.id);
  if (!held) {
    return (
      <div className="library-page">
        <RoomScene room="library" />
        <LibraryUnreadable />
      </div>
    );
  }

  const { sections, loose } = buildShelves(held);
  const beyond = sections.slice(BOOKCASES.length);

  return (
    <div className="library-page">
      <RoomScene room="library" />
      <LibrarySheet crumbs={[{ href: "/library", label: "Library" }]} current="On the table">
        <header className="library-head">
          <p className="library-kicker">The table</p>
          <h1 id="library-title" className="font-display library-title">
            On the table
          </h1>
          <p className="library-line">Threads that stand on their own.</p>
        </header>

        {loose.length > 0 ? (
          <ul className="library-papers">
            {loose.map((t) => (
              <li key={t.id}>
                <Link href={`/library/${t.id}/book`} className="library-paper">
                  <span className="font-display library-paper-title">{t.title}</span>
                  {t.summary && <span className="library-paper-line">{clip(firstLine(t.summary), 110)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="library-prose library-quiet">Nothing is on the table.</p>
        )}

        {beyond.length > 0 && (
          <section aria-labelledby="library-more">
            <h2 id="library-more" className="font-display library-subhead">
              More sections
            </h2>
            <ul className="library-papers">
              {beyond.map(({ thread }) => (
                <li key={thread.id}>
                  <Link href={`/library/${thread.id}`} className="library-paper is-section">
                    <span className="font-display library-paper-title">{thread.title}</span>
                    {thread.summary && <span className="library-paper-line">{clip(firstLine(thread.summary), 110)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </LibrarySheet>
    </div>
  );
}
