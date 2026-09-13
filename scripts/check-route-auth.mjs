#!/usr/bin/env node
// Static auth audit (pattern inherited from Glåüm). Every src/app/api/**/route.ts
// must show evidence of a gate. API routes run with the database service
// credentials, so a route that forgets its gate is privileged-by-default.
//
// Heuristic and file-level by design. A false failure means the route uses a
// new gate helper: add its pattern to GATES rather than allowlisting the route.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const API_DIR = join(ROOT, 'src/app/api')

const GATES = [
  { name: 'requireUser()', re: /\brequireUser\s*\(/ },
  { name: 'requireVisit()', re: /\brequireVisit\s*\(/ },
  { name: 'cron secret', re: /CRON_SECRET/ },
]

// Intentionally public routes, relative to the repo root. Add one ONLY with a
// comment saying why it's public and the date that was reviewed.
const PUBLIC_ROUTES = new Set([
  // (none)
])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name === 'route.ts') out.push(p)
  }
  return out
}

if (!existsSync(API_DIR)) {
  console.log('route-auth: no API routes yet — ok')
  process.exit(0)
}

const failures = []
const routes = walk(API_DIR)
for (const file of routes) {
  const rel = relative(ROOT, file)
  if (PUBLIC_ROUTES.has(rel)) continue
  const src = readFileSync(file, 'utf8')
  const gate = GATES.find((g) => g.re.test(src))
  if (!gate) failures.push(`${rel}: no recognized gate (${GATES.map((g) => g.name).join(', ')})`)
}

if (failures.length) {
  console.error('✗ route-auth audit failed:')
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(`route-auth: ${routes.length} route(s) gated — ok`)
