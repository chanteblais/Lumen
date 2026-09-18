/**
 * The design notebook through Lumi's tools, on a real Postgres (PGlite): only a
 * design partner has them (and the persona section that permits capture without
 * asking); a note is kept in one call; their words are checked, and feedback goes
 * only on them; the ledger says what happened, quietly.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listDesignContributions } from "@/core/domain/design-contributions";
import type { Heard } from "@/core/domain/memory-rules";
import type { Db } from "@/db/client";
import { type User } from "@/db/schema";
import { createTestUser, openTestDb } from "@/db/test-db";
import { ledgerLines } from "./ledger";
import { DESIGN_PARTNER, PERSONA, personaFor } from "./persona";
import { buildTools } from "./tools";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await openTestDb());
}, 60_000);
afterAll(async () => {
  await close();
});

type Callable = { execute?: (input: never, options: never) => unknown };
async function call(t: Callable | undefined, input: object): Promise<Record<string, unknown>> {
  return (await t!.execute!(input as never, { toolCallId: "test", messages: [] } as never)) as Record<string, unknown>;
}

const said: Heard = { messageId: randomUUID(), text: "I think Today should draw out useful context without feeling like paperwork." };
const partnerTools = (u: User, userWords: Heard[] = [said]) => buildTools({ db, userId: u.id, timezone: "America/Vancouver", userWords, designPartner: true });

// What gpt-6-astra sends: every field, null for "none".
const NOTE = {
  revises: null,
  kind: "tension",
  title: "Today learns without paperwork",
  insight: "There is a tension between learning enough to help and making the user do more work: how little does Today need to ask?",
  area: "Today",
  their_words: "Today should draw out useful context without feeling like paperwork",
  possibility: "A shared paragraph with tappable phrases could represent the working picture of the day.",
  why_it_matters: null,
  uncertainty: "How little is enough?",
  prompted_by: "Talking through Today's capacity prompt",
  related: null,
  supersedes: null,
  retract: null,
  change_note: null,
};

describe("only for design partners", () => {
  it("gives the notebook tools and the design section to a design partner and to nobody else", async () => {
    const u = await createTestUser(db, "Gate");
    const everyone = buildTools({ db, userId: u.id, timezone: "UTC" });
    expect(Object.keys(everyone)).not.toContain("contribute_design");
    expect(Object.keys(everyone)).not.toContain("design_feedback");
    expect(Object.keys(partnerTools(u))).toEqual(expect.arrayContaining(["contribute_design", "design_feedback"]));
    expect(personaFor({ designPartner: false })).toBe(PERSONA);
    expect(personaFor({ designPartner: true }).startsWith(PERSONA)).toBe(true);
    expect(personaFor({ designPartner: true }).endsWith(DESIGN_PARTNER)).toBe(true);
  });

  it("permits capture without asking, and says what isn't design evidence or feedback", () => {
    expect(DESIGN_PARTNER).toContain("Don't ask whether to save it and don't wait to be told");
    expect(DESIGN_PARTNER).toContain("Their own tasks, days, work and life are never design evidence");
    expect(DESIGN_PARTNER).toContain("Silence, thanks or a change of subject is not feedback");
    expect(DESIGN_PARTNER).toContain("Agreeing with a problem is not agreeing with your solution");
    expect(DESIGN_PARTNER).toContain("never treat a note as a requirement");
    // Byte-stable: no dates, no per-user content.
    expect(DESIGN_PARTNER).not.toMatch(/\b20\d\d\b|\$\{/);
  });
});

describe("contribute_design", () => {
  it("keeps a note in one call — nothing to confirm — with their checked words apart from Lumi's reading", async () => {
    const u = await createTestUser(db, "Capture");
    const r = await call(partnerTools(u).contribute_design, NOTE);
    expect(r).toMatchObject({ id: "DC-1", change: "noted", stated: "their_words", insight_status: "unreviewed", possibility_status: "unreviewed" });
    expect(r).not.toHaveProperty("note");
    const [row] = await listDesignContributions(db, u.id);
    expect(row).toMatchObject({ sourceMessageId: said.messageId, statedDirection: NOTE.their_words, promptedBy: NOTE.prompted_by, supersedesId: null });
  });

  it("holds words it can't find in their messages as Lumi's paraphrase, and says so", async () => {
    const u = await createTestUser(db, "Unmatched");
    const r = await call(partnerTools(u).contribute_design, { ...NOTE, their_words: "the garden should feel like a season, not a scoreboard" });
    expect(r).toMatchObject({ stated: "lumi_paraphrase", note: expect.stringContaining("paraphrase") });
  });

  it("revises, links, supersedes and withdraws through the same tool, and names a duplicate instead of copying it", async () => {
    const u = await createTestUser(db, "Changes");
    const tools = partnerTools(u);
    await call(tools.contribute_design, NOTE);
    expect(await call(tools.contribute_design, NOTE)).toMatchObject({ already_held: "DC-1" });
    const revised = await call(tools.contribute_design, { ...NOTE, revises: "DC-1", kind: null, title: null, insight: null, their_words: null, possibility: null, uncertainty: "Is one question a day enough?", change_note: "Narrowed it" });
    expect(revised).toMatchObject({ id: "DC-1", change: "revised" });
    const next = await call(tools.contribute_design, { ...NOTE, kind: "shift", title: "Today offers before it asks", insight: "The worry about asking was about order: offer one useful thing, then ask one thing.", supersedes: "DC-1", their_words: null, possibility: null });
    expect(next).toMatchObject({ id: "DC-2", supersedes: "DC-1" });
    expect(await call(tools.contribute_design, { ...NOTE, revises: "DC-2", retract: true, change_note: "Already settled in the Garden doc" })).toMatchObject({ id: "DC-2", change: "withdrawn", withdrawn: true });
    expect(await call(tools.contribute_design, { ...NOTE, revises: "DC-9" })).toEqual({ error: expect.stringContaining("no such note") });
  });
});

describe("design_feedback", () => {
  it("goes only on their word, and only on the part they meant", async () => {
    const u = await createTestUser(db, "Feedback");
    const yes: Heard = { messageId: randomUUID(), text: "Yes, that tension between helping and paperwork is real, but I don't want a tappable paragraph." };
    const tools = partnerTools(u, [said, yes]);
    await call(tools.contribute_design, NOTE);
    expect(await call(tools.design_feedback, { id: "DC-1", on: "insight", verdict: "endorse", their_words: "sounds great", note: null })).toEqual({ error: expect.stringContaining("feedback goes on their word") });
    expect((await listDesignContributions(db, u.id))[0]).toMatchObject({ insightStatus: "unreviewed", version: 1 });

    expect(await call(tools.design_feedback, { id: "DC-1", on: "insight", verdict: "endorse", their_words: "that tension between helping and paperwork is real", note: null })).toMatchObject({ insight_status: "endorsed", possibility_status: "unreviewed" });
    expect(await call(tools.design_feedback, { id: "DC-1", on: "possibility", verdict: "reject", their_words: "I don't want a tappable paragraph", note: null })).toMatchObject({ insight_status: "endorsed", possibility_status: "rejected" });
  });
});

describe("the ledger", () => {
  it("says a note was kept, revised, withdrawn or answered — and nothing for a duplicate", () => {
    const done = (type: string, input: object, output: object) => ({ type, state: "output-available", input, output });
    expect(
      ledgerLines([
        done("tool-contribute_design", {}, { id: "DC-1", title: "Today learns without paperwork", change: "noted" }),
        done("tool-contribute_design", {}, { already_held: "DC-1" }),
        done("tool-contribute_design", {}, { id: "DC-1", title: "Today learns without paperwork", change: "revised" }),
        done("tool-contribute_design", {}, { id: "DC-2", title: "Offers first", change: "withdrawn" }),
        done("tool-design_feedback", { on: "possibility", verdict: "reject" }, { id: "DC-1", on: "possibility", verdict: "reject" }),
      ]),
    ).toEqual([
      "Design note · DC-1 · Today learns without paperwork",
      "Design note revised · DC-1 · Today learns without paperwork",
      "Design note withdrawn · DC-2 · Offers first",
      "Design feedback · DC-1 · possibility rejected",
    ]);
  });
});
