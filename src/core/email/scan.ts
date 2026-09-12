/**
 * One look through the mail: what arrived since the last look, what Lumi
 * noticed in it, saved as leads. Runs when Insights is opened and the last
 * look is older than SCAN_FRESH_MS — never on a timer, never a queue to clear.
 */
import type { Db } from "@/db/client";
import type { Lead, User } from "@/db/schema";
import { inferLeads } from "@/core/ai/leads";
import { listOpenIntentions } from "@/core/domain/intentions";
import { createLeads, FIRST_LOOK_MS, knownSourceRefs, latestMailScan, listHandledLeadTitles, recordMailScan, SCAN_FRESH_MS, type MailScan } from "@/core/domain/leads";
import { DEFAULT_LISTS } from "@/db/schema";
import { GmailAuthError } from "./gmail";
import type { EmailReader } from "./types";

export type ScanOutcome =
  | { status: "fresh"; scan: MailScan }
  | { status: "looked"; scan: MailScan; suggested: Lead[] }
  | { status: "disconnected" };

type Deps = { infer: typeof inferLeads; now: () => Date };
const live: Deps = { infer: inferLeads, now: () => new Date() };

/** One look per user per process at a time — a page and a refresh racing each other share the promise. */
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

async function scanMail(db: Db, user: User, reader: EmailReader, last: MailScan | undefined, d: Deps): Promise<ScanOutcome> {
  const now = d.now();
  const since = last?.through ?? new Date(now.getTime() - FIRST_LOOK_MS);
  let messages;
  try {
    messages = await reader.recent({ since });
  } catch (e) {
    if (e instanceof GmailAuthError) return { status: "disconnected" };
    throw e;
  }
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
  // Next time, start just after the newest thing read; a look that found nothing keeps the old watermark.
  const newest = messages.reduce<Date | undefined>((acc, m) => (!acc || m.receivedAt > acc ? m.receivedAt : acc), undefined);
  const through = newest ? new Date(newest.getTime() + 1000) : since;
  await recordMailScan(db, user.id, { through, read: fresh.length, suggested: suggested.length });
  return { status: "looked", scan: { at: now, through }, suggested };
}
