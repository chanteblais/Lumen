import { describe, expect, it } from "vitest";
import { clampLeads } from "./leads";

const msgs = [{ id: "m1" }, { id: "m2" }];
const lead = (o: Partial<{ message_id: string; title: string; why: string; list?: string; due_at?: string; confidence: number }> = {}) => ({
  message_id: "m1",
  title: "Send Priya the draft",
  why: "Priya asked for it by Friday.",
  confidence: 0.9,
  ...o,
});

describe("clampLeads", () => {
  it("drops unknown messages, low confidence, and empty titles", () => {
    const out = clampLeads([lead({ message_id: "ghost" }), lead({ confidence: 0.3 }), lead({ title: "  " }), lead({ title: "Book the dentist" })], msgs, ["Work"]);
    expect(out.map((l) => l.title)).toEqual(["Book the dentist"]);
  });
  it("never repeats a title, never suggests what is already known, and caps per message", () => {
    const raw = [lead(), lead({ title: "send priya the draft!" }), lead({ title: "Pay the invoice" }), lead({ title: "Reply to Ana" }), lead({ title: "Call the bank", message_id: "m2" })];
    const out = clampLeads(raw, msgs, [], ["Call the bank"]);
    expect(out.map((l) => l.title)).toEqual(["Send Priya the draft", "Pay the invoice"]);
  });
  it("keeps list only when it is one of theirs, and due only when it parses", () => {
    const out = clampLeads([lead({ list: "Work", due_at: "2026-09-18" }), lead({ title: "Other", list: "Nope", due_at: "friday" })], msgs, ["Work"]);
    expect(out[0]!.list).toBe("Work");
    expect(out[0]!.dueAt?.toISOString().slice(0, 10)).toBe("2026-09-18");
    expect(out[1]!.list).toBeNull();
    expect(out[1]!.dueAt).toBeNull();
  });
  it("reads a bare day as 00:00 that day in their timezone, not UTC midnight (B1)", () => {
    const out = clampLeads([lead({ due_at: "2026-09-20" }), lead({ title: "Pay rent", due_at: "2026-09-20T15:30:00-07:00" })], msgs, [], [], "America/Vancouver");
    expect(out[0]!.dueAt?.toISOString()).toBe("2026-09-20T07:00:00.000Z");
    expect(out[1]!.dueAt?.toISOString()).toBe("2026-09-20T22:30:00.000Z");
  });
  it("strips counts from what it keeps", () => {
    const out = clampLeads([lead({ why: "They want 3 things by Monday." })], msgs, []);
    expect(out[0]!.why).toBe("They want a few things by Monday.");
  });
});
