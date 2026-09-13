#!/usr/bin/env node
// Lumi's brief (docs/philosophy/lumi-brief.md → Reviewing it). The doc is the
// source; this writes the text between its brief markers into
// src/core/ai/brief.ts, which persona.ts puts in her cached prompt prefix.
//
//   npm run brief                 regenerate brief.ts from the doc
//   npm run brief -- --reviewed   after a review: stamp today's date and every
//                                 source's current hash, then regenerate
//   npm run check:brief           (inside `npm run check`) fail if brief.ts
//                                 doesn't match the doc, or a source changed
//                                 since the last review; note a stale review
//
// Hashes are git blob hashes of the file contents (the first 12 hex), computed
// here so CI and worktrees need no git history.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const DOC = 'docs/philosophy/lumi-brief.md'
const OUT = 'src/core/ai/brief.ts'
const STALE_DAYS = 30

const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--reviewed') ? 'reviewed' : 'write'

const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const blobHash = (p) => {
  const buf = readFileSync(join(ROOT, p))
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex').slice(0, 12)
}

function between(text, name) {
  const m = text.match(new RegExp(`<!-- ${name}:start -->\\n([\\s\\S]*?)\\n<!-- ${name}:end -->`))
  if (!m) fail(`${DOC} has no <!-- ${name}:start --> … <!-- ${name}:end --> block.`)
  return m[1]
}

function fail(msg) {
  console.error(`✗ lumi brief: ${msg}`)
  process.exit(1)
}

const SOURCE_ROW = /^\| `([^`]+)` \| `([0-9a-f]{12})` \|$/

function parseSources(doc) {
  return between(doc, 'sources')
    .split('\n')
    .map((line) => line.match(SOURCE_ROW))
    .filter(Boolean)
    .map(([, path, hash]) => ({ path, hash }))
}

function generated(doc) {
  const text = between(doc, 'brief').trim()
  const escaped = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  return `/**
 * Lumi's brief: the philosophy she carries. GENERATED from ${DOC} by
 * \`npm run brief\`; edit the doc, not this file (\`npm run check\` compares them).
 * Part of her cached prompt prefix (persona.ts): byte-stable, nothing per-user.
 */
export const LUMI_BRIEF = \`${escaped}\`;
`
}

let doc = read(DOC)
const sources = parseSources(doc)
if (sources.length === 0) fail(`no sources found in ${DOC} (rows look like | \`path\` | \`<12 hex>\` |).`)
for (const s of sources) if (!existsSync(join(ROOT, s.path))) fail(`source ${s.path} no longer exists. Point the row at what replaced it, then review.`)

if (mode === 'reviewed') {
  const today = new Date().toISOString().slice(0, 10)
  const rows = sources.map((s) => `| \`${s.path}\` | \`${blobHash(s.path)}\` |`).join('\n')
  doc = doc
    .replace(/<!-- sources:start -->\n[\s\S]*?\n<!-- sources:end -->/, `<!-- sources:start -->\n| Source | Hash when reviewed |\n|---|---|\n${rows}\n<!-- sources:end -->`)
    .replace(/^\*\*Last reviewed:\*\* \d{4}-\d{2}-\d{2}$/m, `**Last reviewed:** ${today}`)
  writeFileSync(join(ROOT, DOC), doc)
  console.log(`lumi brief: reviewed ${today}, ${sources.length} source hashes stamped. Add a change-log line to ${DOC}.`)
}

if (mode === 'write' || mode === 'reviewed') {
  writeFileSync(join(ROOT, OUT), generated(doc))
  console.log(`lumi brief: wrote ${OUT}`)
  process.exit(0)
}

// --check
const problems = []
if (!existsSync(join(ROOT, OUT)) || read(OUT) !== generated(doc)) {
  problems.push(`${OUT} doesn't match ${DOC}.\n  Fix: npm run brief (and commit both)`)
}
const moved = sources.filter((s) => blobHash(s.path) !== s.hash).map((s) => s.path)
if (moved.length) {
  problems.push(
    `the canon Lumi's brief is drawn from changed since its last review:\n${moved.map((p) => `    ${p}`).join('\n')}\n` +
      `  Fix: read what changed (git log -p -- <file>), update the brief if it changes what Lumi should understand,\n` +
      `  then npm run brief -- --reviewed and add a change-log line (${DOC} → Reviewing it).`,
  )
}
if (problems.length) fail(problems.join('\n\n'))

const last = doc.match(/^\*\*Last reviewed:\*\* (\d{4}-\d{2}-\d{2})$/m)?.[1]
const age = last ? Math.floor((Date.now() - Date.parse(last)) / 86_400_000) : Infinity
if (age > STALE_DAYS) {
  console.log(`note: Lumi's brief was last reviewed ${last ?? 'never'} (over ${STALE_DAYS} days). Reread it against the canon and her recent conversations (${DOC} → Reviewing it).`)
}
console.log(`✓ lumi brief: in sync with ${sources.length} sources`)
