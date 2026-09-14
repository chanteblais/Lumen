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
const EXPECTED = {
  persona: { mailOff: "e7a261a4d3b73ae44ac5795ab573e41fbd926990f4eaac78dddd2b254f1e5a05", mailOn: "48431b4dfbdfdc286cdcb10abcd5f330bd0b5c91288ac5fadb7e3f1d68e51321" },
  prefix: { mailOff: "bc6254831a9943bcf2d6a50f9721b0f824df39eeb9a62fe50de2daef474ad155", mailOn: "d0551e8b14ffb846b5f2658eef44b0f50feadd6fcea092428f232f9b0bf66fbe" },
  designPartner: { persona: "870527b43d4f717938858e81c4cbcc7cc8d802d31c3d16e52ffefcdf9b9a2f87", prefix: "87280209769576f56df18e312b781c64b6f9773cf431da18b67224242b19b0b1" },
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
