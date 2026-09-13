import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookView } from "@/components/library/BookView";
import { LibrarySheet, LibraryUnreadable } from "@/components/library/LibrarySheet";
import { readBook, readThread } from "@/components/library/load";
import { crumbsFor, shelvesUnder } from "@/components/library/shelves";
import { ShelfView } from "@/components/library/ShelfView";
import { RoomScene } from "@/components/shell/RoomScene";
import { shelfPath } from "@/core/domain/library";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/**
 * A thread in the Library, over its room. One that holds threads opens as its
 * shelves of books; one that holds nothing opens as its book.
 */
export default async function LibraryThreadPage({ params }: PageProps<"/library/[id]">) {
  const { user } = await requireVisit();
  const { id } = await params;
  const place = await readThread(user.id, id);
  if (place === "missing") notFound();

  return (
    <div className="library-page">
      <RoomScene room="library" />
      {place ? <ThreadSheet place={place} userId={user.id} timeZone={user.timezone} /> : <LibraryUnreadable />}
    </div>
  );
}

async function ThreadSheet({ place: { thread, held }, userId, timeZone }: { place: NonNullable<Exclude<Awaited<ReturnType<typeof readThread>>, "missing">>; userId: string; timeZone: string }) {
  const crumbs = crumbsFor(held, thread.id);
  const shelves = shelvesUnder(held, thread.id);

  if (shelves.length > 0) {
    const depth = shelfPath(held, thread.id).length;
    return (
      <LibrarySheet crumbs={crumbs} current={thread.title}>
        <ShelfView thread={thread} shelves={shelves} kicker={depth === 0 ? "Section" : "Shelf"} />
      </LibrarySheet>
    );
  }

  const book = await readBook(userId, thread.id);
  if (!book) return <LibraryUnreadable />;
  return (
    <LibrarySheet crumbs={crumbs} current={thread.title}>
      <BookView thread={thread} book={book} timeZone={timeZone} />
    </LibrarySheet>
  );
}
