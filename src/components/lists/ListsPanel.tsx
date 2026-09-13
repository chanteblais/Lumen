import { listOpenIntentions, listRecentlyDone } from "@/core/domain/intentions";
import { buildListsView } from "@/core/domain/lists-view";
import { db } from "@/db/client";
import { DEFAULT_LISTS, type User } from "@/db/schema";
import { ListsSheet } from "./ListsSheet";

/** What Completed shows: the things ticked off most recently. */
const DONE_SHOWN = 30;

/**
 * Loads everything on the user's lists and hands it to the sheet. Used by both
 * ways in: from the nav, over the page you were on (`over`), and /lists opened
 * directly, over the Library's room.
 */
export async function ListsPanel({ user, over }: { user: User; over: boolean }) {
  const [open, done] = await Promise.all([listOpenIntentions(db(), user.id), listRecentlyDone(db(), user.id, DONE_SHOWN)]);
  const lists = user.preferences.lists?.length ? user.preferences.lists : [...DEFAULT_LISTS];
  return <ListsSheet view={buildListsView(open, done, lists, user.timezone)} over={over} />;
}
