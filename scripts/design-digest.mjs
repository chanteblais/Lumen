#!/usr/bin/env node
// Lumi's design notebook, for design and implementation sessions (docs/architecture.md →
// Lumi's design notebook). Reads the database in .env.local. Writes nothing unless
// --generate, and then only the next digest: a window already digested is found, not
// made twice, so it is safe to run on a schedule and to repeat.
//
//   npm run design:digest                  the latest digest
//   npm run design:digest -- --all         the last seven digests, newest first
//   npm run design:digest -- --generate    make the next digest first (notes up to the end of yesterday)
//   npm run design:digest -- --notebook    every note as it stands, with its history
//
// Whose: the users named in COHERENCE_DESIGN_PARTNERS (internal users.id or Clerk user ids).
// What it prints is reference material, never requirements (PROJECT-CANON.md → How the canon works).

import { designPartnerUsers, listDesignContributions, listDesignHistory } from "../src/core/domain/design-contributions.ts";
import { generateDesignDigest, listDesignDigests, renderDesignDigests, renderDesignNotebook } from "../src/core/domain/design-digest.ts";
import { db } from "../src/db/client.ts";

const KNOWN = new Set(["--all", "--generate", "--notebook"]);

async function main() {
  const flags = new Set(process.argv.slice(2));
  const unknown = [...flags].filter((f) => !KNOWN.has(f));
  if (unknown.length) {
    console.error(`Unknown: ${unknown.join(" ")}. Flags: ${[...KNOWN].join(" ")}`);
    return 2;
  }
  const partners = await designPartnerUsers(db());
  if (!partners.length) {
    console.error("No design partner found. Set COHERENCE_DESIGN_PARTNERS in .env.local to a users.id or Clerk user id.");
    return 1;
  }
  for (const user of partners) {
    if (partners.length > 1) console.log(`<!-- ${user.displayName} · ${user.id} -->\n`);
    if (flags.has("--generate")) {
      const r = await generateDesignDigest(db(), user);
      console.error(`[design] digest: ${r.status}${r.status === "nothing" ? " (nothing settled since the last digest)" : ` · revisions through ${r.digest.throughRevisionId}`}`);
    }
    if (flags.has("--notebook")) {
      const [contributions, history] = await Promise.all([listDesignContributions(db(), user.id), listDesignHistory(db(), user.id)]);
      console.log(renderDesignNotebook(contributions, history, user.timezone));
    } else {
      console.log(renderDesignDigests(await listDesignDigests(db(), user.id, flags.has("--all") ? 7 : 1)));
    }
  }
  return 0;
}

// The pool keeps idle connections for half an hour; exit rather than wait on it.
main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
