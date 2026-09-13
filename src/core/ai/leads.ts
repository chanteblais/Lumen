/**
 * Lumi reads recent mail and notices what might need doing. The model
 * proposes leads (structured output); clampLeads() guards them — same
 * shape as the day plan and belief ops: model proposes, code decides.
 * Mail text goes to the model for this one call and is never stored.
 */
import { z } from "zod";
import { dueAtFromModel } from "@/core/due-date";
import type { EmailMessage } from "@/core/email/types";
import { localFormat } from "./format";
import { stripCounts } from "./plan";
import { proposeStructured } from "./structured";

export type LeadInputs = {
  displayName: string;
  timezone: string;
  now: Date;
  messages: EmailMessage[];
  lists: readonly string[];
  /** Titles already on their list — never suggest these again. */
  openTitles: string[];
  /** Titles they kept or let go recently — the same thing in a new reply is not news. */
  handledTitles: string[];
};

export type LeadDraft = {
  messageId: string;
  title: string;
  why: string;
  list: string | null;
  dueAt: Date | null;
};

const LeadsSchema = z.object({
  leads: z
    .array(
      z.object({
        message_id: z.string().describe("The id of the message this comes from"),
        title: z.string().max(120).describe("What might need doing, in the person's own terms — 'Send Priya the draft', not 'Re: draft'"),
        why: z.string().max(160).describe("One short line: who asked, or what the mail says. No counts, no urgency words"),
        list: z.string().max(40).optional().describe("One of their lists, if it obviously belongs there"),
        due_at: z.string().optional().describe("ISO 8601 date or datetime, only if the mail names a real day or time"),
        confidence: z.number().min(0).max(1).describe("How sure you are this is theirs to do and still open"),
      }),
    )
    .max(12),
});

const LEAD_RULES = `## Reading their mail
You are looking through the person's recent mail for things that might need doing — things *they* have to do: reply, send, pay, book, sign, decide, turn up. You are noticing, not filing: they will say which ones still matter.
- Skip newsletters, marketing, receipts for things already paid, shipping notices, social notifications, "FYI" threads, and anything automated that asks for nothing.
- Skip anything already on their list, and anything they have already kept or let go (both are given below). A new reply in the same thread is not a new thing.
- One lead per thing to do, at most two per message. Fewer is better. An empty list is a fine answer.
- title is an action in their terms ("Book the dentist", "Reply to Priya about the draft"). why names who or what in one line. Never urgency words ("ASAP", "overdue"), never counts.
- due_at only when the mail names a real date or time. Don't invent one.
- confidence below 0.5 means don't bother.`;

const MAX_LEADS = 8;
const MAX_PER_MESSAGE = 2;
const MIN_CONFIDENCE = 0.5;

export async function inferLeads(inputs: LeadInputs): Promise<LeadDraft[]> {
  if (inputs.messages.length === 0) return [];
  const raw = await proposeStructured({
    name: "mail_leads",
    kind: "leads",
    persona: true,
    rules: LEAD_RULES,
    inputs: describeMail(inputs),
    prompt: "Look through the mail and return only the structured leads.",
    schema: LeadsSchema,
    effort: "low",
  });
  return clampLeads(raw?.leads ?? [], inputs.messages, inputs.lists, [...inputs.openTitles, ...inputs.handledTitles], inputs.timezone);
}

/** Pure guardrails over whatever the model returned. A bare day is 00:00 that day in `timezone`. Tested. */
export function clampLeads(
  raw: { message_id: string; title: string; why: string; list?: string; due_at?: string; confidence: number }[],
  messages: Pick<EmailMessage, "id">[],
  lists: readonly string[],
  knownTitles: string[] = [],
  timezone = "UTC",
): LeadDraft[] {
  const ids = new Set(messages.map((m) => m.id));
  const known = new Set(knownTitles.map(norm));
  const perMessage = new Map<string, number>();
  const seen = new Set<string>();
  const out: LeadDraft[] = [];
  for (const l of raw) {
    if (out.length >= MAX_LEADS) break;
    if (!ids.has(l.message_id) || !(l.confidence >= MIN_CONFIDENCE)) continue;
    const title = stripCounts(l.title.trim()).slice(0, 120);
    if (!title) continue;
    const key = norm(title);
    if (seen.has(key) || known.has(key)) continue;
    const n = perMessage.get(l.message_id) ?? 0;
    if (n >= MAX_PER_MESSAGE) continue;
    perMessage.set(l.message_id, n + 1);
    seen.add(key);
    out.push({
      messageId: l.message_id,
      title,
      why: stripCounts(l.why.trim()).slice(0, 160),
      list: l.list && lists.includes(l.list) ? l.list : null,
      dueAt: l.due_at ? dueAtFromModel(l.due_at, timezone) : null,
    });
  }
  return out;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function describeMail(inputs: LeadInputs): string {
  const when = (d: Date) => localFormat(inputs.timezone, "stamp").format(d);
  const lines = [
    "## Inputs",
    `- Person: ${inputs.displayName}. Now: ${when(inputs.now)} (${inputs.timezone}).`,
    `- Their lists: ${inputs.lists.join(" · ")}.`,
  ];
  if (inputs.openTitles.length) lines.push("", "## Already on their list (skip)", ...inputs.openTitles.slice(0, 40).map((t) => `- ${t}`));
  if (inputs.handledTitles.length) lines.push("", "## Already kept or let go (skip)", ...inputs.handledTitles.slice(0, 40).map((t) => `- ${t}`));
  lines.push("", "## Recent mail (newest first)");
  for (const m of inputs.messages) {
    lines.push("", `### id ${m.id} · from ${m.fromName} <${m.fromAddress}> · ${when(m.receivedAt)}`, `Subject: ${m.subject}`, m.text || "(no text)");
  }
  return lines.join("\n");
}
