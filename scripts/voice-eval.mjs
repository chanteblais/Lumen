#!/usr/bin/env node
// Runs the nine voice scenarios (docs/voice-eval-log.md) against the live
// persona + context block with the real model, without touching the database.
// Usage: node --env-file=.env.local --import tsx scripts/voice-eval.mjs [scenario#]
// Another model: LUMI_MODEL=anthropic:claude-opus-5 node --env-file=.env.local --import tsx scripts/voice-eval.mjs
// Output: one transcript per scenario, plus token/cache usage per turn.
import { generateText } from "ai";
import { PERSONA } from "../src/core/ai/persona.ts";
import { buildContextBlock } from "../src/core/ai/context.ts";
import { CHAT_MODEL_ID, cachedPrefixOptions, chatModel, chatProviderOptions } from "../src/core/ai/model.ts";

console.log(`Model: ${CHAT_MODEL_ID}`);

const SCENARIOS = [
  ["I know what I need to do but I can't start.", "It's a grant report. Due Monday."],
  ["I have too many things to do and I don't know what to prioritise.", "Thesis chapter, two emails to my supervisor, a dentist appointment I keep not booking, groceries, and the camp website."],
  ["I don't even know what I need to do."],
  ["I've been avoiding this task all day.", "Calling the insurance company."],
  ["I got distracted."],
  ["I haven't opened this app in two weeks and everything is a mess."],
  ["Can you just stay with me while I work?", "Editing chapter 3. About 45 minutes."],
  ["I only have about 20% capacity today."],
  ["ok brain dump: thesis intro rewrite, email priya about the extension, book dentist, the lamp wire thing, plan the washington trip, reply to sam, clean the desk, figure out what's wrong with the deploy"],
];

const only = process.argv[2] ? Number(process.argv[2]) : null;
const context = buildContextBlock({ displayName: "Chanté", timezone: "America/Vancouver", lastSeenAt: new Date(Date.now() - 3 * 3600_000) });

for (const [i, turns] of SCENARIOS.entries()) {
  if (only && only !== i + 1) continue;
  console.log(`\n══════ Scenario ${i + 1}`);
  const messages = [];
  for (const t of turns) {
    messages.push({ role: "user", content: t });
    console.log(`\nYou: ${t}`);
    const r = await generateText({
      model: chatModel(),
      instructions: [
        { role: "system", content: PERSONA, providerOptions: cachedPrefixOptions },
        { role: "system", content: context },
      ],
      messages,
      providerOptions: chatProviderOptions,
    });
    console.log(`\nLumi: ${r.text}`);
    const d = r.totalUsage.inputTokenDetails;
    console.log(`   [in=${r.totalUsage.inputTokens} out=${r.totalUsage.outputTokens} cacheRead=${d?.cacheReadTokens ?? 0} cacheWrite=${d?.cacheWriteTokens ?? 0} finish=${r.finishReason}]`);
    messages.push({ role: "assistant", content: r.text });
  }
}
