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

// Moved with the merge of main (today-in-place: focus sessions and Start with Lumi out of the persona and tools; the brief's places line).
const EXPECTED = {
  persona: { mailOff: "f6e40ef5f956603c73c4e4a140b9592f19eef9c5880748473b8ef8292c221136", mailOn: "064e626473dcceb3ceb14b7c4daafb13daf0a82b5e5672b2a82bd61b1a341c71" },
  prefix: { mailOff: "deac9fc3e7f06f033c21fdb5c654eec1567a403454e7554f6299f2b7cbada750", mailOn: "7ff1e0da6f6feeb4a591dc9a9815698db695e045711cfa1ee1663d6342086d5e" },
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
