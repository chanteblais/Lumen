import type { Metadata } from "next";
import { LibraryRoom } from "@/components/library/LibraryRoom";
import { readHeld } from "@/components/library/load";
import { RoomScene } from "@/components/shell/RoomScene";
import { buildShelves } from "@/core/domain/library";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/**
 * The Library: its painted room, with each section's name on a bookcase and
 * the threads that stand on their own on the table. With nothing in the
 * Library yet, or when it can't be read, the room is all there is.
 */
export default async function LibraryPage() {
  const { user } = await requireVisit();
  const held = await readHeld(user.id);
  const shelves = held ? buildShelves(held) : null;

  return (
    <div className="library-page">
      {/* The painted reading room (globals.css → Library: the reading room); the names on it are LibraryRoom. */}
      <RoomScene room="library" />
      <h1 className="sr-only">Library</h1>
      {shelves && (shelves.sections.length > 0 || shelves.loose.length > 0) && <LibraryRoom shelves={shelves} />}
    </div>
  );
}
