import type { Metadata } from "next";
import { ListsPanel } from "@/components/lists/ListsPanel";
import { requireVisit } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lists" };

/**
 * Lists opened directly (a link, a reload): the sheet over the Library's room.
 * From the nav it opens over whatever page you were on instead (app/@sheet/(.)lists).
 */
export default async function ListsPage() {
  const { user } = await requireVisit();

  return (
    <div className="library-page">
      <div className="library-scene" aria-hidden />
      <ListsPanel user={user} over={false} />
    </div>
  );
}
