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
  persona: { mailOff: "1b9b2292433645462929981e5ce1eaad472e8656446aa83a3ddf09bd1983a825", mailOn: "400722ca49e1445f83e6333d024308b0cbbbf0ed4416d2d3652bb3eb713cd21f" },
  prefix: { mailOff: "401b6c164b2af13b2cf433c2266309ec93457a1320758eacad36604216f3f9c2", mailOn: "87702e50a02fcecdbae51df31c9ba6930bf59abbb162646c334329261848be49" },
  designPartner: { persona: "b8bad884431975cb2c71c7e91464cc5b7aa675c1241741db281dc1633afe19a2", prefix: "99ab24bf228ca9107197c76f2156dd24d4b3ac88042d23eb9ffd9dc433a7e6b7" },
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
