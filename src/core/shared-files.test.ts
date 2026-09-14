import { describe, expect, it } from "vitest";
import { convertToModelMessages, type UIMessage } from "ai";
import {
  SHARED_FILE_LIMITS,
  noteSharedFiles,
  readSharedFiles,
  sharedFileNoteText,
  sharedFilesIn,
  sharedFilesProblem,
  sharedMediaType,
} from "./shared-files";

const base64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const file = (mediaType: string, body: string, filename = "file") => ({ type: "file" as const, mediaType, filename, url: `data:${mediaType};base64,${base64(body)}` });

describe("sharedMediaType", () => {
  it("takes photos, PDFs and text files", () => {
    expect(sharedMediaType("image/png")).toBe("image/png");
    expect(sharedMediaType("image/jpeg; charset=binary")).toBe("image/jpeg");
    expect(sharedMediaType("application/pdf")).toBe("application/pdf");
    expect(sharedMediaType("text/csv")).toBe("text/csv");
  });
  it("reads a text file the browser left untyped, or typed oddly, by its name", () => {
    expect(sharedMediaType("", "notes.md")).toBe("text/markdown");
    expect(sharedMediaType("application/octet-stream", "LIST.TXT")).toBe("text/plain");
    expect(sharedMediaType("text/x-markdown", "draft.markdown")).toBe("text/markdown");
  });
  it("turns the rest away", () => {
    expect(sharedMediaType("image/heic", "IMG_0001.heic")).toBeUndefined();
    expect(sharedMediaType("application/zip", "notes.txt")).toBeUndefined();
    expect(sharedMediaType("", "essay.docx")).toBeUndefined();
  });
});

describe("sharedFilesProblem", () => {
  it("passes words alone, and files within the limits", () => {
    expect(sharedFilesProblem([{ type: "text" }])).toBeUndefined();
    expect(sharedFilesProblem([file("image/png", "png"), file("text/plain", "milk, eggs")])).toBeUndefined();
  });
  it("turns away too many, a kind she can't read, a link, and too much", () => {
    expect(sharedFilesProblem(Array.from({ length: SHARED_FILE_LIMITS.count + 1 }, () => file("text/plain", "x")))).toBe("too_many");
    expect(sharedFilesProblem([file("application/zip", "x")])).toBe("unsupported");
    expect(sharedFilesProblem([{ type: "file", mediaType: "image/png", url: "https://example.com/a.png" } as never])).toBe("not_inline");
    expect(sharedFilesProblem([file("text/plain", "x".repeat(SHARED_FILE_LIMITS.bytes.text + 1))])).toBe("too_large");
    const nearlyAPdf = "x".repeat(SHARED_FILE_LIMITS.bytes.pdf - 10);
    expect(sharedFilesProblem([file("application/pdf", nearlyAPdf), file("application/pdf", nearlyAPdf)])).toBe("too_large");
  });
});

describe("readSharedFiles", () => {
  it("gives Lumi a text file as its words, and a photo as it is", () => {
    const photo = file("image/png", "png", "desk.png");
    const read = readSharedFiles({ parts: [photo, file("text/markdown", "# Café list\n- oat milk", "list.md"), { type: "text", text: "sort this" }] });
    expect(read.parts[0]).toEqual(photo);
    expect(read.parts[1]).toEqual({ type: "text", text: 'The file "list.md" they shared:\n\n# Café list\n- oat milk' });
    expect(read.parts[2]).toEqual({ type: "text", text: "sort this" });
  });
});

describe("noteSharedFiles", () => {
  it("keeps a note in each file's place, and the words as they were", () => {
    const kept = noteSharedFiles({ id: "m1", parts: [file("image/jpeg", "jpg", 'my "desk"\n.jpg'), { type: "text", text: "help" }] });
    expect(kept.id).toBe("m1");
    expect(kept.parts).toEqual([{ type: "data-shared-file", data: { name: "my desk .jpg", kind: "image" } }, { type: "text", text: "help" }]);
    expect(JSON.stringify(kept)).not.toContain("base64");
  });
});

describe("a shared file on the turns after", () => {
  it("reads to Lumi as shared and not kept; other data parts stay out", async () => {
    const history: UIMessage[] = [
      { id: "m1", role: "user", parts: [{ type: "data-shared-file", data: { name: "whiteboard.jpg", kind: "image" } }, { type: "data-other", data: { secret: true } }, { type: "text", text: "what's on this" }] },
    ];
    const model = JSON.stringify(await convertToModelMessages(history, { convertDataPart: sharedFileNoteText }));
    expect(model).toContain('They shared an image (\\"whiteboard.jpg\\") here');
    expect(model).toContain("wasn't kept");
    expect(model).not.toContain("secret");
  });
});

describe("sharedFilesIn", () => {
  it("shows the file while the page holds it, and its note after", () => {
    const photo = file("image/png", "png", "desk.png");
    expect(sharedFilesIn([photo, { type: "text" }])).toEqual([{ name: "desk.png", kind: "image", url: photo.url }]);
    expect(sharedFilesIn(noteSharedFiles({ parts: [photo] }).parts)).toEqual([{ name: "desk.png", kind: "image" }]);
  });
});
