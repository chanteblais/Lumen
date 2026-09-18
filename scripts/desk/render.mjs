// Renders the desk: docs/desk/desk.json poured into docs/desk/desk.template.html,
// written to docs/desk/.out/desk.html (ignored) for the Artifact tool to publish.
// The page is the snapshot; Chanté's answers live in the artifact's db, not here.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const deskDir = join(root, "docs", "desk");
const data = JSON.parse(readFileSync(join(deskDir, "desk.json"), "utf8"));

const problems = [];
const ids = new Set();
for (const list of ["asks", "hands", "moving"]) {
  if (!Array.isArray(data[list])) problems.push(`${list} must be an array`);
  for (const item of data[list] ?? []) {
    if (!item.id || !item.title) problems.push(`${list}: every item needs an id and a title`);
    if (ids.has(item.id)) problems.push(`duplicate id ${item.id}`);
    ids.add(item.id);
  }
}
for (const ask of data.asks ?? []) {
  if (!["glance", "think", "sit"].includes(ask.effort)) problems.push(`${ask.id}: effort is glance, think or sit`);
  if (!ask.recommendation) problems.push(`${ask.id}: an ask carries Claude's recommendation`);
  if (!ask.ifSilent) problems.push(`${ask.id}: an ask says what happens if Chanté never answers`);
}
if (problems.length) {
  console.error(`desk.json is not ready:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
} catch {}

const payload = JSON.stringify({ ...data, commit }).replace(/</g, "\\u003c");
const template = readFileSync(join(deskDir, "desk.template.html"), "utf8");
if (!template.includes("/*DESK_DATA*/")) {
  console.error("desk.template.html has lost its /*DESK_DATA*/ marker");
  process.exit(1);
}
const out = join(deskDir, ".out", "desk.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, template.replace("/*DESK_DATA*/", payload));
console.log(`desk rendered: ${out} (round ${data.round}, ${data.asks.length} asks, commit ${commit})`);
