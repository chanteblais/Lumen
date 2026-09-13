import type { FileUIPart } from "ai";
import { SHARED_FILE_LIMITS, sharedFileKind, sharedMediaType } from "@/core/shared-files";

/**
 * Getting files ready to share from the composer: the ones Lumi can take, a
 * photo shrunk to what she needs to read it, each as a data URL on a file part.
 * Nothing is uploaded anywhere first: the files go with the message, and the
 * server keeps only a note of them (`core/shared-files.ts`).
 */

/** Long edge of a shared photo, in px: plenty to read a note, a whiteboard or a screenshot. */
const PHOTO_EDGE = 1600;

/** The files to share so far, and one line in Lumi's voice for any that couldn't come along. */
type Attached = { parts: FileUIPart[]; problem?: string };

export async function attachFiles(files: readonly File[], already: readonly FileUIPart[]): Promise<Attached> {
  const parts = [...already];
  let problem: string | undefined;
  for (const file of files) {
    if (parts.length >= SHARED_FILE_LIMITS.count) {
      problem = "Three at a time is plenty. Send these first.";
      break;
    }
    const mediaType = sharedMediaType(file.type, file.name);
    const kind = mediaType ? sharedFileKind(mediaType) : undefined;
    if (!mediaType || !kind) {
      problem = "I can read photos, PDFs and text files, not that one.";
      continue;
    }
    const blob = kind === "image" ? await shrinkPhoto(file) : new Blob([file], { type: mediaType });
    if (!blob) {
      problem = "I couldn't open that image. A screenshot or a JPEG works.";
      continue;
    }
    if (blob.size > SHARED_FILE_LIMITS.bytes[kind]) {
      problem = kind === "text" ? "That file's too long for me to read in one go." : "That one's too big for me. Under 3 MB works.";
      continue;
    }
    if (parts.reduce((sum, p) => sum + dataUrlSize(p.url), 0) + blob.size > SHARED_FILE_LIMITS.total) {
      problem = "That's more than I can take in one message. Send these first.";
      continue;
    }
    parts.push({ type: "file", mediaType: blob.type, filename: kind === "image" ? asJpegName(file.name) : file.name, url: await readAsDataUrl(blob) });
  }
  return { parts, problem };
}

/** The photo redrawn as a JPEG no longer than `PHOTO_EDGE` on its long edge; undefined when the browser can't open it (a HEIC outside Safari). */
async function shrinkPhoto(file: File): Promise<Blob | undefined> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return undefined;
  }
  const scale = Math.min(1, PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  // A JPEG has no transparency: a see-through screenshot goes on white, not black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? undefined), "image/jpeg", 0.85));
}

const asJpegName = (name: string) => `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;

/** Roughly how many bytes a base64 data URL holds. */
const dataUrlSize = (url: string) => Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
