/**
 * Leads: things Lumi noticed (in mail, for now) that might need doing. A
 * lead is suggested until the user keeps it — it becomes an intention — or
 * lets it go. Every change appends an event. Mail bodies never land here.
 */
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { type Db } from "@/db/client";
import { leads, type Intention, type Lead, type LeadSource } from "@/db/schema";
import { appendEvent, appendEvents, latestEvent, type ActionSource } from "./events";
import { createIntention, getIntention } from "./intentions";
import { atomic } from "./tx";

export const EMAIL_SCAN_EVENT = "email.scanned";
/** A look through the mail is fresh for this long; the page doesn't look again sooner. */
export const SCAN_FRESH_MS = 30 * 60_000;
/** How far back the first look goes. */
export const FIRST_LOOK_MS = 7 * 86_400_000;

export type NewLead = {
  source?: LeadSource;
  sourceRef: string;
  title: string;
  why?: string | null;
  list?: string | null;
  dueAt?: Date | null;
  fromName?: string | null;
  subject?: string | null;
  receivedAt?: Date | null;
};

/** A lead's title as stored: trimmed, inner whitespace collapsed. The unique index (`leads_user_ref_title_idx`) compares it lower-cased. */
export function leadTitle(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Insert what's new and return it. A lead already held for the same message
 * and title — two looks racing, or the same thing proposed twice — is skipped
 * by the unique index, with no event.
 */
export async function createLeads(db: Db, userId: string, inputs: NewLead[]): Promise<Lead[]> {
  if (inputs.length === 0) return [];
  return atomic(db, async (tx) => {
    const rows = await tx
      .insert(leads)
      .values(
        inputs.map((i) => ({
          userId,
          source: i.source ?? "email",
          sourceRef: i.sourceRef,
          title: leadTitle(i.title),
          why: i.why?.trim() || null,
          list: i.list?.trim() || null,
          dueAt: i.dueAt ?? null,
          fromName: i.fromName?.trim() || null,
          subject: i.subject?.trim() || null,
          receivedAt: i.receivedAt ?? null,
        })),
      )
      .onConflictDoNothing()
      .returning();
    await appendEvents(tx, rows.map((r) => ({ userId, type: "lead.suggested", subjectType: "lead" as const, subjectId: r.id, payload: { source: r.source, list: r.list } })));
    return rows;
  });
}

export async function listSuggestedLeads(db: Db, userId: string, limit = 12): Promise<Lead[]> {
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.status, "suggested")))
    .orderBy(desc(leads.suggestedAt))
    .limit(limit);
}

/** Titles kept or let go since `since` — so a new reply in the same thread isn't news. */
export async function listHandledLeadTitles(db: Db, userId: string, since: Date): Promise<string[]> {
  const rows = await db
    .select({ title: leads.title })
    .from(leads)
    .where(and(eq(leads.userId, userId), inArray(leads.status, ["kept", "dismissed"]), gte(leads.suggestedAt, since)));
  return rows.map((r) => r.title);
}

/** Which of these message ids already produced a lead. */
export async function knownSourceRefs(db: Db, userId: string, refs: string[]): Promise<Set<string>> {
  if (refs.length === 0) return new Set();
  const rows = await db.select({ ref: leads.sourceRef }).from(leads).where(and(eq(leads.userId, userId), inArray(leads.sourceRef, refs)));
  return new Set(rows.map((r) => r.ref));
}

export async function getLead(db: Db, userId: string, id: string): Promise<Lead | undefined> {
  const [row] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.userId, userId))).limit(1);
  return row;
}

/**
 * "Still needs doing": the lead becomes an intention, in one transaction that
 * first claims the lead (`WHERE status = 'suggested'`). Kept already — a second
 * tap, Lumi and Insights at once — it returns the intention it became, with no
 * second one and no second event. Undefined when it isn't theirs or was let go.
 */
export async function keepLead(db: Db, userId: string, id: string, via: ActionSource = "app"): Promise<{ lead: Lead; intention: Intention } | undefined> {
  return atomic(db, async (tx) => {
    const [claimed] = await tx
      .update(leads)
      .set({ status: "kept", resolvedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.userId, userId), eq(leads.status, "suggested")))
      .returning();
    if (!claimed) {
      const lead = await getLead(tx, userId, id);
      const intention = lead?.status === "kept" && lead.intentionId ? await getIntention(tx, userId, lead.intentionId) : undefined;
      return lead && intention ? { lead, intention } : undefined;
    }
    const intention = await createIntention(tx, userId, {
      title: claimed.title,
      note: [claimed.why, claimed.subject ? `From mail: "${claimed.subject}"${claimed.fromName ? ` — ${claimed.fromName}` : ""}` : null].filter(Boolean).join(" "),
      list: claimed.list,
      dueAt: claimed.dueAt,
    });
    const [lead] = await tx.update(leads).set({ intentionId: intention.id }).where(eq(leads.id, id)).returning();
    await appendEvent(tx, { userId, type: "lead.kept", subjectType: "lead", subjectId: id, payload: { via, intention_id: intention.id } });
    return { lead, intention };
  });
}

/** "Let it go": handled, not a thing, or not theirs — the distinction isn't asked. Let go already: the lead as it is, no second event. Undefined when it isn't theirs or was kept. */
export async function dismissLead(db: Db, userId: string, id: string, via: ActionSource = "app"): Promise<Lead | undefined> {
  return atomic(db, async (tx) => {
    const [row] = await tx
      .update(leads)
      .set({ status: "dismissed", resolvedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.userId, userId), eq(leads.status, "suggested")))
      .returning();
    if (!row) {
      const lead = await getLead(tx, userId, id);
      return lead?.status === "dismissed" ? lead : undefined;
    }
    await appendEvent(tx, { userId, type: "lead.dismissed", subjectType: "lead", subjectId: id, payload: { via } });
    return row;
  });
}

export type MailScan = { at: Date; through: Date };

/** The last look through the mail, derived from the newest `email.scanned` event. */
export async function latestMailScan(db: Db, userId: string): Promise<MailScan | undefined> {
  const e = await latestEvent(db, userId, EMAIL_SCAN_EVENT);
  if (!e) return undefined;
  const through = (e.payload as { through?: string }).through;
  return { at: e.occurredAt, through: through ? new Date(through) : e.occurredAt };
}

export async function recordMailScan(db: Db, userId: string, p: { through: Date; read: number; suggested: number }): Promise<void> {
  await appendEvent(db, { userId, type: EMAIL_SCAN_EVENT, subjectType: "user", subjectId: userId, payload: { through: p.through.toISOString(), read: p.read, suggested: p.suggested } });
}
