/**
 * Gmail as an EmailReader over the REST API with a bearer token. Read-only
 * (`gmail.readonly`). No SDK: two endpoints and a MIME walk are all it takes,
 * and this stays liftable into a worker.
 */
import type { EmailMessage, EmailReader, RecentMailQuery } from "./types";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";
/** Inbox only, minus the shelves nobody needs Lumi to read. Updates stay: bills and bookings live there. */
const BASE_QUERY = "in:inbox -category:promotions -category:social";
const DEFAULT_MAX = 30;
const MAX_TEXT = 1500;
const CONCURRENCY = 6;

export class GmailAuthError extends Error {
  constructor(message = "Gmail said no — the connection needs renewing.") {
    super(message);
    this.name = "GmailAuthError";
  }
}

export function gmailReader(token: string, fetchImpl: typeof fetch = fetch): EmailReader {
  const get = async (path: string): Promise<unknown> => {
    const r = await fetchImpl(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } });
    if (r.status === 401 || r.status === 403) throw new GmailAuthError();
    if (!r.ok) throw new Error(`gmail ${r.status}`);
    return r.json();
  };

  return {
    async recent(q: RecentMailQuery): Promise<EmailMessage[]> {
      const max = q.max ?? DEFAULT_MAX;
      const query = [BASE_QUERY, `after:${Math.floor(q.since.getTime() / 1000)}`, q.search?.trim()].filter(Boolean).join(" ");
      const list = (await get(`/messages?maxResults=${max}&q=${encodeURIComponent(query)}`)) as { messages?: { id: string }[] };
      const ids = (list.messages ?? []).map((m) => m.id);
      const out: EmailMessage[] = [];
      // A few at a time: Gmail's per-user rate limit is generous but not infinite.
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const batch = await Promise.all(ids.slice(i, i + CONCURRENCY).map((id) => get(`/messages/${id}?format=full`)));
        for (const raw of batch) {
          const m = parseGmailMessage(raw as GmailRaw);
          if (m) out.push(m);
        }
      }
      return out.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
    },
  };
}

/* ------------------------------------------------------------- parsing */

export type GmailRaw = {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart;
};
type GmailPart = {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
};

/** Pure. Headers, the plain-text part (or the html one, stripped), quoted replies removed. */
export function parseGmailMessage(raw: GmailRaw): EmailMessage | undefined {
  if (!raw?.id || !raw.payload) return undefined;
  const header = (name: string) => raw.payload!.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  const from = parseAddress(header("From"));
  const receivedAt = raw.internalDate ? new Date(Number(raw.internalDate)) : new Date(header("Date") || Date.now());
  const text = cleanText(findText(raw.payload) || raw.snippet || "");
  return {
    id: raw.id,
    threadId: raw.threadId ?? raw.id,
    fromName: from.name,
    fromAddress: from.address,
    subject: header("Subject").trim() || "(no subject)",
    receivedAt: Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt,
    text,
  };
}

export function parseAddress(s: string): { name: string; address: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(s);
  if (m) return { name: m[1].trim() || m[2].split("@")[0], address: m[2].trim() };
  const address = s.trim();
  return { name: address.split("@")[0] || address, address };
}

function findText(part: GmailPart): string {
  const plain = findMime(part, "text/plain");
  if (plain) return decode(plain);
  const html = findMime(part, "text/html");
  return html ? stripHtml(decode(html)) : "";
}

function findMime(part: GmailPart, mime: string): string | undefined {
  if (part.mimeType === mime && part.body?.data) return part.body.data;
  for (const p of part.parts ?? []) {
    const hit = findMime(p, mime);
    if (hit) return hit;
  }
  return undefined;
}

function decode(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Drop quoted replies and signatures-by-convention; collapse whitespace; cap length. */
export function cleanText(s: string): string {
  const lines = s.replace(/\r/g, "").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) continue;
    if (/^\s*On .+ wrote:\s*$/.test(line) || /^-{2,}\s*Original Message\s*-{2,}$/i.test(line) || /^\s*From: .+$/.test(line) && kept.length > 0) break;
    if (/^\s*--\s*$/.test(line)) break;
    kept.push(line);
  }
  return kept
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT);
}
