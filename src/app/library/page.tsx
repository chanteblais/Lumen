import type { Metadata } from "next";
import { RoomScene } from "@/components/shell/RoomScene";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Library" };

/** The Library, for now only its room: the painting, and Lumi standing in it. */
export default async function LibraryPage() {
  await requireVisit();

  return (
    <div className="library-page">
      {/* The Library is set in a painted reading room (globals.css → Library: the reading room):
          the painting fills the viewport behind the shell and nothing sits on it yet. */}
      <RoomScene room="library" />
      <h1 className="sr-only">Library</h1>
    </div>
  );
}
