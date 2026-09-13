import Link from "next/link";
import { cookies } from "next/headers";
import { DEBUG_COOKIE, debugFrom } from "@/components/shell/debug-mode";
import { buildShelves } from "@/core/domain/library";
import type { Thread } from "@/db/schema";
import { readHeld } from "./load";

export async function isDebugMode(): Promise<boolean> {
  return debugFrom((await cookies()).get(DEBUG_COOKIE)?.value);
}

/**
 * Debug mode's view of the Library, over a room: a small parchment listing
 * each category (a section: a thread with threads under it), its shelves and
 * threads, then the threads in no category — each a link to its page. Who put
 * a thread where it is shows beside it. Nothing when debug mode is off.
 * `held` when the page has already read the threads (undefined: read them here;
 * null: they couldn't be read). Globals.css → Debug mode.
 */
export async function LibraryDebug({ userId, held }: { userId: string; held?: Thread[] | null }) {
  if (!(await isDebugMode())) return null;
  const threads = held === undefined ? await readHeld(userId) : held;
  const shelves = threads ? buildShelves(threads) : null;
  const empty = shelves && shelves.sections.length === 0 && shelves.loose.length === 0;

  return (
    <details className="debug-library" open>
      <summary className="debug-library-head">
        <span className="debug-library-kicker">Debug</span>
        <span className="font-display debug-library-title">Categories and threads</span>
      </summary>
      <div className="debug-library-body">
        {!shelves && <p className="debug-library-quiet">Couldn’t read the Library.</p>}
        {empty && <p className="debug-library-quiet">No categories or threads yet.</p>}
        {shelves?.sections.map(({ thread, shelves: rows }) => (
          <section key={thread.id} className="debug-library-section">
            <h3>
              <Link href={`/library/${thread.id}`}>{thread.title}</Link>
            </h3>
            {rows.map((row) => (
              <div key={row.shelf?.id ?? "own"}>
                {row.shelf && (
                  <p className="debug-library-shelf">
                    <Link href={`/library/${row.shelf.id}`}>{row.shelf.title}</Link>
                    <Who thread={row.shelf} />
                  </p>
                )}
                <ul className={row.shelf ? "debug-library-books is-shelved" : "debug-library-books"}>
                  {row.books.map((b) => (
                    <li key={b.id}>
                      <Link href={`/library/${b.id}/book`}>{b.title}</Link>
                      <Who thread={b} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
        {shelves && shelves.loose.length > 0 && (
          <section className="debug-library-section">
            <h3 className="debug-library-loose">In no category</h3>
            <ul className="debug-library-books">
              {shelves.loose.map((t) => (
                <li key={t.id}>
                  <Link href={`/library/${t.id}/book`}>{t.title}</Link>
                  <Who thread={t} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="debug-library-foot">Tap the wordmark five times to turn debug mode off.</p>
      </div>
    </details>
  );
}

function Who({ thread }: { thread: Thread }) {
  if (!thread.shelvedBy) return null;
  return <span className="debug-library-who">{thread.shelvedBy === "user" ? "placed by you" : "placed by Lumi"}</span>;
}
