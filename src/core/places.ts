/**
 * Where the user is when they speak to Lumi: the page, and which way in they used.
 * The client sends the path and its chat slot with each turn (`chat-client.tsx`);
 * this reads them, trusting nothing, and the context block says it in Lumi's terms.
 * Derived on every turn, never stored, nothing for the user to keep.
 */

/** The places in the nav (`components/shell/Sidebar.tsx`). */
export type Place = "home" | "today" | "library" | "lists" | "insights" | "settings";

/** Which way in: Home's composer, the companion's speech bubble, or the Lists sheet's Add task line (`HeldChatSlot`). */
export type Via = "home" | "bubble" | "lists-add";

/** Inside the Library: a thread's shelves, a thread open as a book, or the loose threads on the table. */
export type LibraryDetail = "thread" | "book" | "table";

export type Where = { place: Place; via: Via; detail?: LibraryDetail };

const VIAS: readonly Via[] = ["home", "bubble", "lists-add"];

/** The place a path belongs to, or undefined for a path that isn't one of them. */
export function placeFromPath(path: string): Pick<Where, "place" | "detail"> | undefined {
  const parts = (path.split(/[?#]/)[0] ?? "").split("/").filter(Boolean);
  if (parts.length === 0) return { place: "home" };
  const [head, ...rest] = parts;
  switch (head) {
    case "today":
    case "lists":
    case "insights":
    case "settings":
      return rest.length === 0 ? { place: head } : undefined;
    case "library":
      if (rest.length === 0) return { place: "library" };
      if (rest.length === 1) return { place: "library", detail: rest[0] === "table" ? "table" : "thread" };
      if (rest.length === 2 && rest[1] === "book") return { place: "library", detail: "book" };
      return undefined;
    default:
      return undefined;
  }
}

/** Reads `{ path, via }` from a request body; anything malformed is no place at all. */
export function parseWhere(raw: unknown): Where | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { path, via } = raw as { path?: unknown; via?: unknown };
  if (typeof path !== "string" || path.length > 200 || !VIAS.includes(via as Via)) return undefined;
  const at = placeFromPath(path);
  return at ? { ...at, via: via as Via } : undefined;
}
