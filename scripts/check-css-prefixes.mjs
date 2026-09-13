#!/usr/bin/env node
// Vendor-prefix audit of the compiled stylesheet. Runs src/app/globals.css
// through the real pipeline (@tailwindcss/postcss with lightningcss, the same
// targets a build uses) and fails when a rule keeps `-webkit-<prop>` but lost
// the unprefixed `<prop>`.
//
// Why: lightningcss treats `-webkit-P` written *after* `P` in one rule as the
// winner and drops `P`. Chrome then gets no `backdrop-filter` at all, and every
// glass surface stops blurring without an error anywhere (docs/dev-hygiene.md →
// Traps, 2026-09-13). Write the unprefixed property only; the pipeline adds the
// prefix Safari needs.
//
// A false failure means a property that only exists prefixed: add it to
// WEBKIT_ONLY with the reason.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'

const ROOT = new URL('..', import.meta.url).pathname
const ENTRY = join(ROOT, 'src/app/globals.css')

// Prefixed properties with no unprefixed twin in the rules that use them.
const WEBKIT_ONLY = new Set([
  'font-smoothing', // non-standard, macOS only
  'tap-highlight-color', // non-standard, mobile WebKit only
  'text-size-adjust', // Tailwind preflight sets the prefixed form alone
  'appearance', // preflight's ::-webkit-search-* rules are WebKit-only selectors
])

const result = await postcss([tailwind({ base: ROOT, optimize: { minify: false } })]).process(
  readFileSync(ENTRY, 'utf8'),
  { from: ENTRY },
)

const failures = []
// Innermost blocks: a selector (or at-rule prelude) and declarations with no nested braces.
for (const [, prelude, body] of result.css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
  const props = new Set([...body.matchAll(/(?:^|;)\s*(-?[a-z-]+)\s*:/g)].map((m) => m[1]))
  for (const prop of props) {
    if (!prop.startsWith('-webkit-')) continue
    const bare = prop.slice('-webkit-'.length)
    if (WEBKIT_ONLY.has(bare) || props.has(bare)) continue
    failures.push(`${prelude.trim()} { ${prop} } — no \`${bare}\``)
  }
}

if (failures.length) {
  console.error('✗ css-prefix audit failed: the compiled CSS kept only the prefixed form')
  for (const f of failures) console.error('  ' + f)
  console.error('  Fix: in the source rule, write the unprefixed property only (drop the -webkit- line); the pipeline adds the prefix.')
  process.exit(1)
}
console.log('css-prefixes: every -webkit- declaration kept its unprefixed twin — ok')
