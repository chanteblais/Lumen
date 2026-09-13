import { getOwnedThread, listCurrentNotes, listNoteHistory, listThreadEpisodes, listThreads } from "@/core/domain/library";
import { db } from "@/db/client";
import type { Episode, Thread, ThreadNote } from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reads for the Library's pages. Like `loadLibraryOrNothing`, none of them
 * throws: when the Library can't be read the room shows without its names and
 * a thread's page says so quietly, and the reason goes to the log.
 */

/** Every thread the user holds, or null when the Library can't be read. */
export async function readHeld(userId: string): Promise<Thread[] | null> {
  try {
    return await listThreads(db(), userId);
  } catch (err) {
    console.error("[library] couldn't read the Library; showing the room without it", err);
    return null;
  }
}

export type ThreadPlace = { thread: Thread; held: Thread[] };

/** The thread with everything held around it; "missing" when it isn't theirs (or isn't a thread id); null when it can't be read. */
export async function readThread(userId: string, id: string): Promise<ThreadPlace | "missing" | null> {
  if (!UUID.test(id)) return "missing";
  try {
    const [thread, held] = await Promise.all([getOwnedThread(db(), userId, id), listThreads(db(), userId)]);
    if (!thread) return "missing";
    return { thread, held: held.some((t) => t.id === thread.id) ? held : [...held, thread] };
  } catch (err) {
    console.error("[library] couldn't read a thread", err);
    return null;
  }
}

export type BookContents = { notes: ThreadNote[]; history: ThreadNote[]; visits: Episode[] };

/** What a thread's book holds: its current notes, the notes later ones replaced, and the visits that touched it. Null when it can't be read. */
export async function readBook(userId: string, threadId: string): Promise<BookContents | null> {
  try {
    const [notes, history, visits] = await Promise.all([
      listCurrentNotes(db(), userId, [threadId]),
      listNoteHistory(db(), userId, threadId),
      listThreadEpisodes(db(), userId, threadId),
    ]);
    return { notes, history, visits };
  } catch (err) {
    console.error("[library] couldn't read a thread's book", err);
    return null;
  }
}
