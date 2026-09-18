/**
 * The cached prefix guard. The persona and every tool's description and input
 * schema are the prompt prefix both providers cache: a byte that moves misses the
 * cache on every turn after deploy. This pins their sha256 for both states of
 * `MAIL_ON` (the mail tools and the persona's mail line come and go with it).
 *
 * A change to the prefix that you meant: update the hash below in the same commit,
 * and say in the commit message what moved (docs/architecture.md → System prompt).
 */
import { createHash } from "node:crypto";
import { asSchema } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/client";

// Moved with the merges of main: today-in-place (focus sessions and Start with Lumi out of the persona and tools; the
// brief's places line), then chat-files (the persona's line on a shared file), then lumi-environment (the map of the
// app, "too big" asks first), then priorities (the persona's priorities line; hold_priority and let_go_priority).
// Design partners (design-notebook branch) have a prefix of their own — the persona with its design section, and the
// two notebook tools — pinned below; everyone else's is the one above, unchanged by it.
// Then lumi-function: what she's for (the persona's opening line, What you're for → What matters, one brief sentence).
const EXPECTED = {
  persona: { mailOff: "f6865d3141523d489799720417f258e31266594c2a14a945094cf14329ab70dc", mailOn: "2d86a9cf494e91bde7c32e156a72928c02c47dc290e8a9461bbf8e6d60b73db6" },
  prefix: { mailOff: "3460b2ae5a592551361e4b50f7fafe2bd8b6067c1c2b79589a2d6817e799bc22", mailOn: "75740a059da1ab10c67edab6ad1b0492f7b510b605583282bbf49cad1744df95" },
  designPartner: { persona: "e101a8c877013540e779506c0f549248068e6ba3cc3ff04e50096be9d31a75cd", prefix: "f4d6d39eca410a706663ad7f88c1d5982d295ebb6c2aa0d772b34f29c9839f62" },
};

async function hashes(mailOn: boolean, designPartner = false) {
  vi.resetModules();
  vi.doMock("@/core/email/types", async (importOriginal) => ({ ...(await importOriginal<object>()), MAIL_ON: mailOn }));
  const { personaFor } = await import("./persona");
  const { buildTools } = await import("./tools");
  const persona = personaFor({ designPartner });
  const tools = buildTools({ db: {} as Db, userId: "u", timezone: "UTC", designPartner }) as Record<string, { description?: string; inputSchema: Parameters<typeof asSchema>[0] }>;
  const described = [];
  for (const [name, t] of Object.entries(tools)) described.push({ name, description: t.description, input: await asSchema(t.inputSchema).jsonSchema });
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  return { persona: sha(persona), prefix: sha(persona + JSON.stringify(described)), tools: Object.keys(tools) };
}

afterEach(() => {
  vi.doUnmock("@/core/email/types");
  vi.resetModules();
});

const advice = "The cached prefix (persona + tool descriptions + input schemas) changed. If you meant it, update EXPECTED in src/core/ai/prefix.test.ts in the same commit and note the change; every cached turn misses once after deploy.";

describe("the cached prefix", () => {
  it("is byte-stable with mail off", async () => {
    const h = await hashes(false);
    expect(h.tools).not.toContain("look_at_email");
    expect({ persona: h.persona, prefix: h.prefix }, advice).toEqual({ persona: EXPECTED.persona.mailOff, prefix: EXPECTED.prefix.mailOff });
  });

  it("is byte-stable for a design partner (mail off), with the notebook tools only there", async () => {
    const h = await hashes(false, true);
    expect(h.tools).toEqual(expect.arrayContaining(["contribute_design", "design_feedback"]));
    expect((await hashes(false)).tools).not.toContain("contribute_design");
    expect({ persona: h.persona, prefix: h.prefix }, advice).toEqual(EXPECTED.designPartner);
  });

  it("is byte-stable with mail on", async () => {
    const h = await hashes(true);
    expect(h.tools).toContain("look_at_email");
    expect({ persona: h.persona, prefix: h.prefix }, advice).toEqual({ persona: EXPECTED.persona.mailOn, prefix: EXPECTED.prefix.mailOn });
  });
});
