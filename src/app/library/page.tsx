import type { Metadata } from "next";
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
      <div className="library-scene" aria-hidden />
      <h1 className="sr-only">Library</h1>
    </div>
  );
}
