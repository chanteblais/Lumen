import Link from "next/link";
import { Sparkle } from "@/components/ui/Ornament";
import type { Thread, ThreadNote, ThreadNoteKind } from "@/db/schema";
import type { BookContents } from "./load";
import { shortDate } from "./shelves";

/** Whose words a note rests on, said plainly: an inference shows as one. */
const SOURCE: Record<ThreadNote["source"], string> = { user_said: "your words", lumi_inferred: "Lumi’s reading" };

/**
 * A thread opened as a book, after Chanté's mockup: the left page is where it
 * has arrived (the summary, what's settled for now, where it stands), the
 * right page what's still alive, ideas, details, how it changed and the visits
 * that touched it. An empty heading isn't shown. Re-entry before history.
 */
export function BookView({ thread, book, timeZone, shelfHref }: { thread: Thread; book: BookContents; timeZone: string; shelfHref?: string }) {
  const of = (kind: ThreadNoteKind) => book.notes.filter((n) => n.kind === kind);
  const current = new Map(book.notes.map((n) => [n.id, n] as const));

  return (
    <>
      <div className="library-spread">
        <section className="library-leaf" aria-labelledby="library-title">
          <p className="library-kicker">Thread</p>
          <h1 id="library-title" className="font-display library-book-title">
            {thread.title}
          </h1>
          <Part title="Where we’ve arrived">
            {thread.summary ? <p className="library-prose">{thread.summary}</p> : <p className="library-prose library-quiet">Lumi hasn’t written where this stands yet.</p>}
          </Part>
          <Notes title="What we’ve settled — for now" notes={of("decision")} />
          <Notes title="Where it stands" notes={of("progress")} />
        </section>

        <section className="library-leaf" aria-label="Still open, and how it changed">
          <Notes title="Still alive" notes={of("question")} />
          <Notes title="Ideas" notes={of("idea")} />
          <Notes title="Details" notes={of("detail")} />
          {book.history.length > 0 && (
            <Part title="How this thread changed">
              <ul className="library-notes">
                {book.history.map((earlier) => {
                  const now = earlier.supersededById ? current.get(earlier.supersededById) : undefined;
                  return (
                    <li key={earlier.id} className="library-change">
                      <p className="library-change-then">
                        <span className="library-change-mark">Earlier</span>
                        {earlier.content}
                      </p>
                      {now && (
                        <p className="library-change-now">
                          <span className="library-change-mark">Now</span>
                          {now.content}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Part>
          )}
          {book.visits.length > 0 && (
            <Part title="Visits">
              <ul className="library-notes">
                {book.visits.map((v) => (
                  <li key={v.id} className="library-visit">
                    <span className="library-visit-date">{shortDate(v.endedAt, timeZone)}</span>
                    {v.summary}
                  </li>
                ))}
              </ul>
            </Part>
          )}
          {thread.summaryRevisedAt && <p className="library-revised">Last revised {shortDate(thread.summaryRevisedAt, timeZone)}</p>}
        </section>
      </div>

      {shelfHref && (
        <p className="library-aside">
          <Link href={shelfHref}>Back to the books under {thread.title}</Link>
        </p>
      )}
    </>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="library-part">
      <h2 className="font-display library-part-title">
        <Sparkle size={9} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Notes({ title, notes }: { title: string; notes: ThreadNote[] }) {
  if (notes.length === 0) return null;
  return (
    <Part title={title}>
      <ul className="library-notes">
        {notes.map((n) => (
          <li key={n.id} className="library-note">
            {n.content}
            <span className="library-source" data-source={n.source}>
              {SOURCE[n.source]}
            </span>
          </li>
        ))}
      </ul>
    </Part>
  );
}
