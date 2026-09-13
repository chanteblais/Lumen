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
// app, "too big" asks first).
const EXPECTED = {
  persona: { mailOff: "e8ead01578dfcd98831e589290b79d4aa4ecfc14887bc4aa07f7ccea1152a4c5", mailOn: "4a615e951edc705a364f714f808b6f67d0deca3e39ee155d18dc8ad71a94b08f" },
  prefix: { mailOff: "dda31f89b6a51e74cebcdf554d84aab3d5203d7b428bf4b5e83699b57f31ba7f", mailOn: "0a3423b8bf23dde64f754575ecc7213a098ec2d641f43765088190a681523b93" },
};

async function hashes(mailOn: boolean) {
  vi.resetModules();
  vi.doMock("@/core/email/types", async (importOriginal) => ({ ...(await importOriginal<object>()), MAIL_ON: mailOn }));
  const { PERSONA } = await import("./persona");
  const { buildTools } = await import("./tools");
  const tools = buildTools({ db: {} as Db, userId: "u", timezone: "UTC" }) as Record<string, { description?: string; inputSchema: Parameters<typeof asSchema>[0] }>;
  const described = [];
  for (const [name, t] of Object.entries(tools)) described.push({ name, description: t.description, input: await asSchema(t.inputSchema).jsonSchema });
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");
  return { persona: sha(PERSONA), prefix: sha(PERSONA + JSON.stringify(described)), tools: Object.keys(tools) };
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

  it("is byte-stable with mail on", async () => {
    const h = await hashes(true);
    expect(h.tools).toContain("look_at_email");
    expect({ persona: h.persona, prefix: h.prefix }, advice).toEqual({ persona: EXPECTED.persona.mailOn, prefix: EXPECTED.prefix.mailOn });
  });
});
