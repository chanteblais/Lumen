import Link from "next/link";
import type { ShelfBooks } from "@/core/domain/library";
import { Sparkle } from "@/components/ui/Ornament";
import type { Thread } from "@/db/schema";
import { firstLine, toneOf } from "./shelves";

/**
 * A section or shelf opened: its name, one italic line of where it stands,
 * then its books as a row of spines — the ones directly in it first, then
 * each shelf under its plaque. Every title is at reading size and wraps; a
 * spine's leather is decoration only. Nothing to arrange, nothing counted.
 */
export function ShelfView({ thread, shelves, kicker }: { thread: Thread; shelves: ShelfBooks<Thread>[]; kicker: string }) {
  return (
    <>
      <header className="library-head">
        <p className="library-kicker">{kicker}</p>
        <h1 id="library-title" className="font-display library-title">
          {thread.title}
        </h1>
        {thread.summary && <p className="library-line">{firstLine(thread.summary)}</p>}
      </header>

      {shelves.map(({ shelf, books }) => (
        <section key={shelf?.id ?? "own"} className="library-shelf" aria-labelledby={shelf ? `shelf-${shelf.id}` : undefined} aria-label={shelf ? undefined : `In ${thread.title}`}>
          {shelf && (
            <h2 id={`shelf-${shelf.id}`} className="library-shelf-plaque">
              <Link href={`/library/${shelf.id}`}>
                <Sparkle size={9} />
                <span>{shelf.title}</span>
                <Sparkle size={9} />
              </Link>
            </h2>
          )}
          <ul className="library-spines">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/library/${b.id}`} className="library-spine" data-tone={toneOf(b.id)}>
                  <span>{b.title}</span>
                  <Sparkle size={9} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="library-aside">
        <Link href={`/library/${thread.id}/book`}>Read this thread’s own book</Link>
      </p>
    </>
  );
}
