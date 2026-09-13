import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookView } from "@/components/library/BookView";
import { LibrarySheet, LibraryUnreadable } from "@/components/library/LibrarySheet";
import { readBook, readThread } from "@/components/library/load";
import { childrenOf, crumbsFor } from "@/components/library/shelves";
import { RoomScene } from "@/components/shell/RoomScene";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/** A thread's own book, always — for a section or shelf too, whose page opens on its books. */
export default async function LibraryBookPage({ params }: PageProps<"/library/[id]/book">) {
  const { user } = await requireVisit();
  const { id } = await params;
  const place = await readThread(user.id, id);
  if (place === "missing") notFound();

  const book = place ? await readBook(user.id, place.thread.id) : null;
  if (!place || !book) {
    return (
      <div className="library-page">
        <RoomScene room="library" />
        <LibraryUnreadable />
      </div>
    );
  }

  const { thread, held } = place;
  const holds = childrenOf(held, thread.id).length > 0;
  const crumbs = crumbsFor(held, thread.id);
  return (
    <div className="library-page">
      <RoomScene room="library" />
      <LibrarySheet crumbs={holds ? [...crumbs, { href: `/library/${thread.id}`, label: thread.title }] : crumbs} current={holds ? "Its own book" : thread.title}>
        <BookView thread={thread} book={book} timeZone={user.timezone} shelfHref={holds ? `/library/${thread.id}` : undefined} />
      </LibrarySheet>
    </div>
  );
}
