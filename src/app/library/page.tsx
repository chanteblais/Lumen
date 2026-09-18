import type { Metadata } from "next";
import { isDebugMode, LibraryDebug } from "@/components/library/LibraryDebug";
import { LibraryRoom } from "@/components/library/LibraryRoom";
import { readHeld } from "@/components/library/load";
import { RoomScene } from "@/components/shell/RoomScene";
import { buildShelves } from "@/core/domain/library";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/**
 * The Library: its painted room. Until the Library is integrated into the room
 * properly (Chanté, 2026-09-13: "Let's wait to integrate it properly"), what it
 * holds shows only in debug mode — each category's name on a bookcase, the
 * threads in no category on the table, and debug mode's parchment list.
 */
export default async function LibraryPage() {
  const { user } = await requireVisit();
  const debug = await isDebugMode();
  const held = debug ? await readHeld(user.id) : null;
  const shelves = held ? buildShelves(held) : null;

  return (
    <div className="library-page">
      {/* The painted reading room (globals.css → Library: the reading room); the names on it are LibraryRoom. */}
      <RoomScene room="library" />
      <h1 className="sr-only">Library</h1>
      {shelves && (shelves.sections.length > 0 || shelves.loose.length > 0) && <LibraryRoom shelves={shelves} />}
      {debug && <LibraryDebug userId={user.id} held={held} />}
    </div>
  );
}
