import type { Metadata } from "next";
import { ListsPanel } from "@/components/lists/ListsPanel";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Lists" };

/** Lists opened from the nav: the sheet over the page you were on, which stays underneath (a parallel slot intercepting /lists). */
export default async function ListsOverPage() {
  const user = await requireUser();
  return <ListsPanel user={user} over />;
}
