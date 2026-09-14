/**
 * The design digest on a real Postgres (PGlite), at fixed clocks in Vancouver:
 * no digest when nothing changed; one digest per window however often it runs;
 * only what changed since, with corrections of something already shown up
 * front; nothing lost at a window's edge; no filler; silence and inclusion never
 * endorse; nothing is promoted into anything but the notebook.
 */
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import { designDigests, events, intentions, memoryNotes, priorities, threadNotes, type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { contributeDesign, listDesignContributions, listDesignHistory, recordDesignFeedback, reviseDesign, type NewDesignNote } from "./design-contributions";
import { generateDesignDigest, listDesignDigests, renderDesignDigests, renderDesignNotebook } from "./design-digest";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

const TZ = "America/Vancouver"; // UTC-7 in September
/** 11am on 14, 15, 16, 17 September, Vancouver. */
const day = (n: 1 | 2 | 3 | 4, hour = 18) => new Date(Date.UTC(2026, 8, 13 + n, hour));

async function designer(name: string): Promise<User> {
  const u = await createTestUser(db, name);
  return { ...u, timezone: TZ };
}
/** Chanté's example: her direction, Lumi's reading of it, and a possibility nobody has agreed to. */
const TODAY_TENSION: NewDesignNote = {
  kind: "tension",
  area: "Today",
  title: "Today learns without paperwork",
  insight: "There is a tension between learning enough to help and making the user do more work. A useful design question is how little Today needs to ask before offering something useful.",
  statedDirection: "Today should draw out useful context without feeling like paperwork.",
  statedSource: "their_words",
  possibility: "A shared paragraph with tappable phrases could represent the working picture of the day.",
  uncertainty: "How little is enough to be useful?",
};
const OTHER = { kind: "insight" as const, area: "Library", title: "The Library never needs tidying", insight: "If shelving happens between visits, the Library must never show a mess the user is expected to fix." };

describe("generating the digest", () => {
  it("makes nothing when nothing changed, and leaves today's notes for tomorrow", async () => {
    const u = await designer("Nothing");
    expect(await generateDesignDigest(db, u, day(1))).toEqual({ status: "nothing" });
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    expect(await generateDesignDigest(db, u, day(1, 23))).toEqual({ status: "nothing" });
    expect(await db.select().from(designDigests).where(eq(designDigests.userId, u.id))).toHaveLength(0);

    const r = await generateDesignDigest(db, u, day(2));
    expect(r.status).toBe("made");
    const md = r.status === "made" ? r.digest.markdown! : "";
    expect(md).toContain("# Coherence design digest · 2026-09-15");
    expect(md).toContain("not requirements");
    expect(md).toContain("## Your stated direction");
    expect(md).toContain("“Today should draw out useful context without feeling like paperwork.” — DC-1");
    expect(md).toContain("## Unreviewed — Lumi's hypotheses and possibilities");
    expect(md).toContain("Lumi's reading (unreviewed): There is a tension");
    expect(md).toContain("Possibility — Lumi's proposal, not endorsed: A shared paragraph with tappable phrases");
    expect(md).toContain("## Open questions");
    expect(md).toContain("### Today");
  });

  it("is safe to repeat and to race: one digest per window, and nothing unchanged comes back", async () => {
    const u = await designer("Retry");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    const [a, b] = await Promise.all([generateDesignDigest(db, u, day(2)), generateDesignDigest(db, u, day(2))]);
    expect([a.status, b.status].filter((s) => s === "made")).toHaveLength(1);
    for (const r of [a, b]) expect(["made", "already_made", "nothing"]).toContain(r.status);
    expect(await generateDesignDigest(db, u, day(2, 20))).toEqual({ status: "nothing" });
    expect(await generateDesignDigest(db, u, day(3))).toEqual({ status: "nothing" });
    expect(await db.select().from(designDigests).where(eq(designDigests.userId, u.id))).toHaveLength(1);
    expect(await db.select().from(events).where(eq(events.type, "design.digested"))).not.toHaveLength(0);
  });

  it("shows only what changed since, and puts a rejection of something already shown up front", async () => {
    const u = await designer("Changes");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    await contributeDesign(db, u.id, OTHER, day(1));
    expect((await generateDesignDigest(db, u, day(2))).status).toBe("made");

    await recordDesignFeedback(db, u.id, 1, { target: "possibility", verdict: "reject", theirWords: "no, not a tappable paragraph" }, day(2));
    const second = await generateDesignDigest(db, u, day(3));
    const md = second.status === "made" ? second.digest.markdown! : "";
    expect(md).toContain("## Changed, corrected or withdrawn");
    expect(md).toContain("you rejected the possibility: “no, not a tappable paragraph”");
    expect(md).toContain("(an earlier digest showed this note)");
    expect(md).toContain("Possibility — Lumi's proposal, rejected by you");
    expect(md).not.toContain("DC-2");
    expect(md.indexOf("## Changed")).toBeLessThan(md.indexOf("DC-1"));

    await recordDesignFeedback(db, u.id, 2, { target: "insight", verdict: "endorse", theirWords: "yes the Library should never need tidying" }, day(3));
    const third = await generateDesignDigest(db, u, day(4));
    const md3 = third.status === "made" ? third.digest.markdown! : "";
    expect(md3).toContain("## Endorsed by you");
    expect(md3).toContain("Endorsed is not a requirement until it's in the canon");
    expect(md3).toContain("Lumi's reading (endorsed by you)");
    expect(md3).not.toContain("DC-1");
  });

  it("doesn't lose a note written just before a window closes", async () => {
    const u = await designer("Edge");
    // 23:59:30 on the 15th, Vancouver; the run comes a minute later, just after midnight.
    await contributeDesign(db, u.id, TODAY_TENSION, new Date("2026-09-16T06:59:30Z"));
    expect(await generateDesignDigest(db, u, new Date("2026-09-16T07:00:30Z"))).toEqual({ status: "nothing" });
    const later = await generateDesignDigest(db, u, new Date("2026-09-16T07:05:00Z"));
    expect(later.status).toBe("made");
  });

  it("makes no filler: a note made and withdrawn before any digest saw it shows nothing", async () => {
    const u = await designer("Quiet");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    await reviseDesign(db, u.id, 1, { retract: true, note: "Already in the Garden doc." }, day(1, 19));
    const r = await generateDesignDigest(db, u, day(2));
    expect(r.status).toBe("quiet");
    expect(r.status === "quiet" && r.digest.markdown).toBeNull();
    expect(await listDesignDigests(db, u.id)).toEqual([]);
    expect(renderDesignDigests([])).toContain("No design digest yet");
    expect(await generateDesignDigest(db, u, day(3))).toEqual({ status: "nothing" });
  });

  it("shows a replaced note as replaced once a digest has shown it, linking both ways", async () => {
    const u = await designer("Replaced");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    await generateDesignDigest(db, u, day(2));
    await contributeDesign(db, u.id, { kind: "shift", area: "Today", title: "Today offers before it asks", insight: "The worry about asking was about order: offer something first, then ask one thing.", supersedesRef: 1 }, day(2));
    const r = await generateDesignDigest(db, u, day(3));
    const md = r.status === "made" ? r.digest.markdown! : "";
    expect(md).toMatch(/## Changed, corrected or withdrawn[\s\S]*DC-1 · Today learns without paperwork\*\* · tension · superseded by DC-2/);
    expect(md).toContain("Links: supersedes DC-1");
  });
});

describe("what the digest never does", () => {
  it("treats silence as silence: days of digests leave every part unreviewed", async () => {
    const u = await designer("Silence");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    const first = await generateDesignDigest(db, u, day(2));
    await generateDesignDigest(db, u, day(3));
    await generateDesignDigest(db, u, day(4));
    expect(first.status === "made" && first.digest.markdown).toContain("Nobody has agreed with these yet.");
    expect(first.status === "made" && first.digest.markdown).toContain("Being in a digest is not endorsement, and neither is silence.");
    const [note] = await listDesignContributions(db, u.id);
    expect(note).toMatchObject({ insightStatus: "unreviewed", possibilityStatus: "unreviewed", version: 1 });
    expect((await listDesignHistory(db, u.id)).map((h) => h.change)).toEqual(["created"]);
  });

  it("never promotes a note: endorsed stays a note, and nothing outside the notebook is written", async () => {
    const u = await designer("Promote");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    await recordDesignFeedback(db, u.id, 1, { target: "insight", verdict: "endorse", theirWords: "yes, exactly that tension" }, day(1, 19));
    await recordDesignFeedback(db, u.id, 1, { target: "possibility", verdict: "endorse", theirWords: "and yes to the paragraph" }, day(1, 20));
    const r = await generateDesignDigest(db, u, day(2));
    const md = r.status === "made" ? r.digest.markdown! : "";
    expect(md).toContain("## Endorsed by you");
    expect(md).toContain("nothing here is canon until you put it in the canon");
    expect(md).not.toMatch(/\brequirement:|\bapproved\b|\baccepted\b/i);
    const [note] = await listDesignContributions(db, u.id);
    expect(note).toMatchObject({ insightStatus: "endorsed", possibilityStatus: "endorsed" });
    for (const table of [intentions, memoryNotes, threadNotes, priorities]) {
      expect(await db.select().from(table).where(eq(table.userId, u.id))).toHaveLength(0);
    }
    const kinds = new Set((await db.select().from(events).where(eq(events.userId, u.id))).map((e) => e.type));
    expect([...kinds].every((t) => t.startsWith("design."))).toBe(true);
  });
});

describe("the notebook as a document", () => {
  it("shows current notes, then superseded and withdrawn ones, each with its history", async () => {
    const u = await designer("Document");
    await contributeDesign(db, u.id, TODAY_TENSION, day(1));
    await contributeDesign(db, u.id, OTHER, day(1));
    await reviseDesign(db, u.id, 2, { retract: true, note: "Settled by the Library doc." }, day(2));
    await recordDesignFeedback(db, u.id, 1, { target: "possibility", verdict: "qualify", theirWords: "maybe, if it stays optional", note: "Only if nothing has to be tapped." }, day(2));
    const md = renderDesignNotebook(await listDesignContributions(db, u.id), await listDesignHistory(db, u.id), TZ);
    expect(md.indexOf("## Current")).toBeLessThan(md.indexOf("DC-1"));
    expect(md.indexOf("## Superseded and withdrawn")).toBeLessThan(md.indexOf("DC-2"));
    expect(md).toContain("withdrawn by Lumi");
    expect(md).toContain("History: v1 2026-09-14 noted by Lumi · v2 2026-09-15 you qualified the possibility: “maybe, if it stays optional” (Only if nothing has to be tapped.)");
  });
});
