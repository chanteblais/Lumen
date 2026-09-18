import type { CSSProperties } from "react";
import Link from "next/link";
import type { LibraryShelves } from "@/core/domain/library";
import type { Thread } from "@/db/schema";
import { BOOKCASES, TABLE_SLIP, faceStyle, pointStyle, rectStyle } from "./room-slots";
import { clip } from "./shelves";

/**
 * What the Library holds, drawn on its painted room: each section's name on a
 * bookcase's plaque, in the order sections arrived, and — when some threads
 * stand on their own, or there are more sections than bookcases — a slip on
 * the table. Each is a link; the whole bookcase face is its hit region, and
 * the plaque warms on hover or focus. Below 768px there is no room: the same
 * links as a plain list, which is also there, visually hidden, for screen
 * readers on a desktop (globals.css → Library: sections on the bookcases).
 */
export function LibraryRoom({ shelves }: { shelves: LibraryShelves<Thread> }) {
  const onCases = shelves.sections.slice(0, BOOKCASES.length);
  const beyond = shelves.sections.slice(BOOKCASES.length);
  const onTable = shelves.loose.length > 0 || beyond.length > 0;

  return (
    <>
      <div className="library-stage">
        {onCases.map(({ thread }, i) => {
          const slot = BOOKCASES[i];
          if (!slot) return null; // onCases is cut to BOOKCASES.length
          return (
            <Link key={thread.id} href={`/library/${thread.id}`} className="library-case" style={faceStyle(slot)} aria-label={thread.title} data-slot={slot.id}>
              <span aria-hidden className="library-case-glow" style={rectStyle(slot.panel)} />
              <span aria-hidden className="library-case-name" style={{ ...rectStyle(slot.name), "--size": slot.type } as CSSProperties}>
                <span>{clip(thread.title, slot.charsPerLine * 2)}</span>
              </span>
            </Link>
          );
        })}
        {onTable && (
          <Link href="/library/table" className="library-slip" style={pointStyle(TABLE_SLIP)}>
            On the table
          </Link>
        )}
      </div>

      <nav className="library-plain" aria-label="In the Library">
        {shelves.sections.length > 0 && (
          <>
            <h2 className="library-plain-head">Sections</h2>
            <ul>
              {shelves.sections.map(({ thread }) => (
                <li key={thread.id}>
                  <Link href={`/library/${thread.id}`}>{thread.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {shelves.loose.length > 0 && (
          <>
            <h2 className="library-plain-head">On the table</h2>
            <ul>
              {shelves.loose.map((t) => (
                <li key={t.id}>
                  <Link href={`/library/${t.id}/book`}>{t.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </>
  );
}
