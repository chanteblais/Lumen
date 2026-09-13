/**
 * One look through the mail: what arrived since the last look, what Lumi
 * noticed in it, saved as leads. Runs when Insights is opened and the last
 * look is older than SCAN_FRESH_MS — never on a timer, never a queue to clear.
 * Reads newest first a page at a time back to the last look; what a look runs
 * out of pages for is carried to the next one (`backlog`), so no mail is
 * skipped, and nothing older than a first look's week is read.
 */
import type { Db } from "@/db/client";
import type { Lead, User } from "@/db/schema";
import { inferLeads } from "@/core/ai/leads";
import { listOpenIntentions } from "@/core/domain/intentions";
import { createLeads, FIRST_LOOK_MS, knownSourceRefs, latestMailScan, listHandledLeadTitles, recordMailScan, SCAN_FRESH_MS, type MailRange, type MailScan } from "@/core/domain/leads";
import { DEFAULT_LISTS } from "@/db/schema";
import { GmailAuthError } from "./gmail";
import type { EmailMessage, EmailReader } from "./types";

/** A page of mail, and the pages one look reads: sixty messages at most go to one model call. */
export const MAIL_PAGE = 30;
export const MAIL_PAGES = 2;

export type ScanOutcome =
  | { status: "fresh"; scan: MailScan }
  | { status: "looked"; scan: MailScan; suggested: Lead[] }
  | { status: "disconnected" };

type Deps = { infer: typeof inferLeads; now: () => Date };
const live: Deps = { infer: inferLeads, now: () => new Date() };

/** One look per user per process at a time — a page and a refresh racing each other share the promise. Across instances, the leads' unique index keeps a lead from landing twice. */
const inFlight = new Map<string, Promise<ScanOutcome>>();

export async function ensureFreshMailScan(db: Db, user: User, reader: EmailReader, deps: Partial<Deps> = {}): Promise<ScanOutcome> {
  const d = { ...live, ...deps };
  const now = d.now();
  const last = await latestMailScan(db, user.id);
  if (last && now.getTime() - last.at.getTime() < SCAN_FRESH_MS) return { status: "fresh", scan: last };

  let pending = inFlight.get(user.id);
  if (!pending) {
    pending = scanMail(db, user, reader, last, d).finally(() => inFlight.delete(user.id));
    inFlight.set(user.id, pending);
  }
  return pending;
}

type ReadBack = { messages: EmailMessage[]; pages: number; rest?: MailRange };

/** Newest first from `before` (or now) back to `after`, up to `pages` pages. `rest`: the part of the range still unread when the pages ran out. */
async function readBack(reader: EmailReader, after: Date, before: Date | undefined, pages: number): Promise<ReadBack> {
  const read = new Map<string, EmailMessage>();
  let cursor = before;
  for (let used = 1; used <= pages; used++) {
    const page = await reader.recent({ since: after, before: cursor, max: MAIL_PAGE });
    const fresh = page.filter((m) => !read.has(m.id));
    for (const m of fresh) read.set(m.id, m);
    if (page.length < MAIL_PAGE || fresh.length === 0) return { messages: [...read.values()], pages: used };
    cursor = fresh.reduce((oldest, m) => (m.receivedAt < oldest ? m.receivedAt : oldest), fresh[0].receivedAt);
    if (used === pages) return { messages: [...read.values()], pages: used, rest: { after, before: cursor } };
  }
  return { messages: [...read.values()], pages };
}

/** A range cut to what's still worth reading (nothing older than `oldest`); undefined when none of it is. */
function worthReading(r: MailRange | undefined, oldest: Date): MailRange | undefined {
  if (!r) return undefined;
  const after = r.after > oldest ? r.after : oldest;
  return r.before > after ? { after, before: r.before } : undefined;
}

async function scanMail(db: Db, user: User, reader: EmailReader, last: MailScan | undefined, d: Deps): Promise<ScanOutcome> {
  const now = d.now();
  const oldest = new Date(now.getTime() - FIRST_LOOK_MS);
  const since = last?.through ?? oldest;
  const waiting = worthReading(last?.backlog, oldest);
  let recent: ReadBack;
  let older: ReadBack | undefined;
  try {
    recent = await readBack(reader, since, undefined, MAIL_PAGES);
    if (waiting && !recent.rest && recent.pages < MAIL_PAGES) older = await readBack(reader, waiting.after, waiting.before, MAIL_PAGES - recent.pages);
  } catch (e) {
    if (e instanceof GmailAuthError) return { status: "disconnected" };
    throw e;
  }
  // Still unread: this look's own remainder and whatever older range it didn't finish, joined into one.
  // Joining can re-read the stretch between them; it never skips one.
  const left = older ? older.rest : waiting;
  const backlog = worthReading(recent.rest && left ? { after: left.after, before: recent.rest.before } : (recent.rest ?? left), oldest);

  const messages = [...recent.messages, ...(older?.messages ?? [])];
  const seen = await knownSourceRefs(db, user.id, messages.map((m) => m.id));
  const fresh = messages.filter((m) => !seen.has(m.id));

  let suggested: Lead[] = [];
  if (fresh.length) {
    const [open, handled] = await Promise.all([listOpenIntentions(db, user.id), listHandledLeadTitles(db, user.id, new Date(now.getTime() - 30 * 86_400_000))]);
    const drafts = await d.infer({
      displayName: user.displayName,
      timezone: user.timezone,
      now,
      messages: fresh,
      lists: user.preferences.lists?.length ? user.preferences.lists : [...DEFAULT_LISTS],
      openTitles: open.map((i) => i.title),
      handledTitles: handled,
    });
    const byId = new Map(fresh.map((m) => [m.id, m]));
    suggested = await createLeads(
      db,
      user.id,
      drafts.map((l) => {
        const m = byId.get(l.messageId)!;
        return { sourceRef: m.id, title: l.title, why: l.why, list: l.list, dueAt: l.dueAt, fromName: m.fromName, subject: m.subject, receivedAt: m.receivedAt };
      }),
    );
  }
  // Next time, start just after the newest thing read; a look that found nothing new keeps the old watermark.
  const newest = recent.messages.reduce<Date | undefined>((acc, m) => (!acc || m.receivedAt > acc ? m.receivedAt : acc), undefined);
  const through = newest ? new Date(newest.getTime() + 1000) : since;
  await recordMailScan(db, user.id, { through, read: fresh.length, suggested: suggested.length, backlog });
  return { status: "looked", scan: { at: now, through, ...(backlog ? { backlog } : {}) }, suggested };
}
