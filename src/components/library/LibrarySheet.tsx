import Link from "next/link";
import { Sparkle } from "@/components/ui/Ornament";
import type { Crumb } from "./shelves";

/**
 * A page of the Library opened over its room: the Lists sheet's parchment
 * (globals.css → Library: the sheet), with the way back along its top —
 * Library › Section › Shelf, each a link — and × to the place one step back.
 * A page, not a dialog: the browser's Back and the links do the closing.
 */
export function LibrarySheet({ crumbs, current, children }: { crumbs: Crumb[]; current: string; children: React.ReactNode }) {
  const back = crumbs[crumbs.length - 1];
  return (
    <div className="library-veil">
      <article className="library-sheet" aria-labelledby="library-title">
        <Link href={back.href} className="library-close" aria-label={`Back to ${back.label}`}>
          <svg aria-hidden width="18" height="18" viewBox="0 0 18 18">
            <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </Link>
        <Sparkle size={10} className="library-corner library-corner-bl" />
        <Sparkle size={10} className="library-corner library-corner-br" />
        <nav className="library-crumbs" aria-label="Where this is in the Library">
          <ol>
            {crumbs.map((c) => (
              <li key={c.href}>
                <Link href={c.href}>{c.label}</Link>
              </li>
            ))}
            <li aria-current="page">{current}</li>
          </ol>
        </nav>
        <div className="library-sheet-body">{children}</div>
      </article>
    </div>
  );
}

/** When the Library can't be read: said once, quietly, with the way back. */
export function LibraryUnreadable() {
  return (
    <LibrarySheet crumbs={[{ href: "/library", label: "Library" }]} current="Unavailable">
      <h1 id="library-title" className="font-display library-title">
        The Library can’t be read just now.
      </h1>
      <p className="library-line">Nothing in it is lost. Try again in a little while.</p>
    </LibrarySheet>
  );
}
