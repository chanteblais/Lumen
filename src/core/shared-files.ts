/**
 * Files shared in the conversation — a photo of a note, a screenshot, a PDF, a
 * text file. Lumi reads one on the turn it arrives, and it isn't kept: the
 * stored message holds a note that it was shared (its name and kind) in the
 * file's place, the way a look at the mail leaves a line per thing and never
 * the mail. Shared from Home's composer (`components/chat/attach.ts`);
 * `/api/chat` checks them, reads them and notes them.
 */
import type { TextPart } from "ai";

type SharedFileKind = "image" | "pdf" | "text";

/** What the transcript keeps in a file's place: the data of a `data-shared-file` part. */
export type SharedFileNote = { name: string; kind: SharedFileKind };

/** A shared file as the page shows it: the file itself while the page still holds it (`url`), its note after that. */
export type SharedFileView = SharedFileNote & { url?: string };

export const SHARED_FILE_LIMITS = {
  /** Files in one message. */
  count: 3,
  /** Bytes per file. Photos are shrunk in the browser first, so they rarely come near. */
  bytes: { image: 2_000_000, pdf: 3_000_000, text: 100_000 } satisfies Record<SharedFileKind, number>,
  /** Bytes for one message's files together: base64 adds a third, and a Vercel function takes at most a 4.5 MB body. */
  total: 3_000_000,
} as const;

const MEDIA_TYPES: Record<SharedFileKind, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
  text: ["text/plain", "text/markdown", "text/csv"],
};

const TEXT_BY_EXTENSION: Record<string, string> = { txt: "text/plain", text: "text/plain", md: "text/markdown", markdown: "text/markdown", csv: "text/csv" };

/** What the file picker offers. */
export const SHARED_FILE_ACCEPT = [...Object.values(MEDIA_TYPES).flat(), ".txt", ".md", ".markdown", ".csv"].join(",");

const bareType = (mediaType: string) => (mediaType.split(";")[0] ?? "").trim().toLowerCase();

/** The kind of file a media type is, or undefined when Lumi can't take it. */
export function sharedFileKind(mediaType: string): SharedFileKind | undefined {
  const type = bareType(mediaType);
  return (Object.keys(MEDIA_TYPES) as SharedFileKind[]).find((kind) => MEDIA_TYPES[kind].includes(type));
}

/**
 * The media type Lumi reads a file as, or undefined when she can't take it. A
 * text file the browser left untyped or typed oddly (a `.md` often is) goes by its name.
 */
export function sharedMediaType(mediaType: string, filename = ""): string | undefined {
  const type = bareType(mediaType);
  if (sharedFileKind(type)) return type;
  if (type && type !== "application/octet-stream" && !type.startsWith("text/")) return undefined;
  const extension = /\.([a-z]+)$/.exec(filename.toLowerCase())?.[1];
  return extension ? TEXT_BY_EXTENSION[extension] : undefined;
}

type Part = { type: string };
type FilePart = { type: "file"; mediaType: string; url: string; filename?: string };
const isFilePart = (p: Part): p is FilePart => p.type === "file";

/** A name as it may appear in the transcript and to Lumi: one line, no quotes, not too long. */
const cleanName = (name: unknown) => (typeof name === "string" ? name.replace(/"/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) : "");

const isKind = (kind: unknown): kind is SharedFileKind => kind === "image" || kind === "pdf" || kind === "text";

/** The bytes of a `data:` URL, or undefined when it isn't one. */
function dataUrlBytes(url: unknown): Uint8Array | undefined {
  if (typeof url !== "string") return undefined;
  const match = /^data:[^,]*?(;base64)?,([\s\S]*)$/.exec(url);
  if (!match) return undefined;
  const [, base64, data = ""] = match;
  try {
    if (!base64) return new TextEncoder().encode(decodeURIComponent(data));
    return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

type SharedFilesProblem = "too_many" | "unsupported" | "not_inline" | "too_large";

/** Why a message's files can't go to Lumi, or undefined when they can: each one inline, a kind she reads, within the limits. */
export function sharedFilesProblem(parts: readonly Part[]): SharedFilesProblem | undefined {
  const files = parts.filter(isFilePart);
  if (files.length > SHARED_FILE_LIMITS.count) return "too_many";
  let total = 0;
  for (const file of files) {
    const kind = sharedFileKind(typeof file.mediaType === "string" ? file.mediaType : "");
    if (!kind) return "unsupported";
    // Only what arrived with the message: a link would have the model's provider go and fetch it.
    const bytes = dataUrlBytes(file.url);
    if (!bytes) return "not_inline";
    if (bytes.length > SHARED_FILE_LIMITS.bytes[kind]) return "too_large";
    total += bytes.length;
  }
  return total > SHARED_FILE_LIMITS.total ? "too_large" : undefined;
}

/**
 * The message as Lumi reads it on the turn it arrives. A text file becomes its
 * words — not every provider takes a text file, and words are words; a photo or
 * a PDF goes as it is. Check it with `sharedFilesProblem` first.
 */
export function readSharedFiles<M extends { parts: readonly Part[] }>(message: M): M {
  const parts = message.parts.map((p) => {
    if (!isFilePart(p) || sharedFileKind(p.mediaType) !== "text") return p;
    const words = new TextDecoder().decode(dataUrlBytes(p.url) ?? new Uint8Array());
    return { type: "text", text: `The file "${cleanName(p.filename) || "untitled"}" they shared:\n\n${words}` };
  });
  return { ...message, parts } as M;
}

/** The message as it is kept: each file replaced by a note that it was shared. */
export function noteSharedFiles<M extends { parts: readonly Part[] }>(message: M): M {
  const parts = message.parts.map((p) => {
    if (!isFilePart(p)) return p;
    const note: SharedFileNote = { name: cleanName(p.filename), kind: sharedFileKind(p.mediaType) ?? "text" };
    return { type: "data-shared-file", data: note };
  });
  return { ...message, parts } as M;
}

const KIND_WORDS: Record<SharedFileKind, string> = { image: "an image", pdf: "a PDF", text: "a text file" };

/**
 * A note, as Lumi reads it on the turns after (`convertToModelMessages`'
 * `convertDataPart`): that something was shared, and that she can't see it now.
 * Any other data part stays out of what she reads.
 */
export function sharedFileNoteText(part: { type: string; data: unknown }): TextPart | undefined {
  if (part.type !== "data-shared-file") return undefined;
  const note = (part.data ?? {}) as Partial<Record<keyof SharedFileNote, unknown>>;
  const what = isKind(note.kind) ? KIND_WORDS[note.kind] : "a file";
  const name = cleanName(note.name);
  return { type: "text", text: `[They shared ${what}${name ? ` ("${name}")` : ""} here. You read it on that turn; it wasn't kept, so you can't see it now.]` };
}

/** What was shared with a message: the files themselves while the page holds them, their notes after that. */
export function sharedFilesIn(parts: readonly Part[]): SharedFileView[] {
  return parts.flatMap((p): SharedFileView[] => {
    if (isFilePart(p)) return [{ name: cleanName(p.filename), kind: sharedFileKind(p.mediaType) ?? "text", url: p.url }];
    if (p.type !== "data-shared-file") return [];
    const note = ((p as { data?: unknown }).data ?? {}) as Partial<Record<keyof SharedFileNote, unknown>>;
    return [{ name: cleanName(note.name), kind: isKind(note.kind) ? note.kind : "text" }];
  });
}
