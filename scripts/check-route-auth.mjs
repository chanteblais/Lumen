#!/usr/bin/env node
// Static auth audit (pattern inherited from Glåüm). API routes run with the
// database service credentials, so a handler that forgets its gate is
// privileged-by-default.
//
//   npm run check:routes            audits this checkout
//   node scripts/check-route-auth.mjs <root>   audits another tree (a fixture)
//
// What it checks:
//   - every src/app/**/route.{ts,tsx,js,mjs}: each exported HTTP method handler
//     (`export async function GET`, `export const POST = …`) must show a gate in
//     its own body, with comments and string contents ignored. A handler it
//     can't see (`export { x as GET }`, `export * from`) fails: declare it in the file.
//   - no file under src/ starts with a "use server" directive: a server action
//     is a public POST endpoint, and this app's client code calls API routes
//     instead (docs/architecture.md → API routes).
//   - src/app must exist: a missing directory fails rather than passing vacuously.
//
// Heuristic by design. A false failure means a handler uses a new gate helper:
// add its pattern to GATES rather than allowlisting the route.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from './lib.mjs'

export const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

export const GATES = [
  { name: 'requireUser()', re: /\brequireUser\s*\(/ },
  { name: 'requireVisit()', re: /\brequireVisit\s*\(/ },
  { name: 'cron secret', re: /\bCRON_SECRET\b/ },
]

// Intentionally public handlers: 'src/app/…/route.ts' (every handler in the file)
// or 'src/app/…/route.ts GET' (one). Add one ONLY with a comment saying why it's
// public and the date that was reviewed.
const PUBLIC_ROUTES = new Set([
  // (none)
])

const ROUTE_FILE = /^route\.(ts|tsx|js|mjs)$/
const SOURCE_FILE = /\.(ts|tsx|js|jsx|mjs)$/

/**
 * The source with comments replaced by spaces (newlines kept, so offsets hold).
 * With `blankStrings`, the contents of string, template and regex literals are
 * blanked too, so a brace or a gate name inside one can't mislead the parse.
 */
export function stripComments(src, { blankStrings = false } = {}) {
  const blank = (s) => s.replace(/[^\n]/g, ' ')
  let out = ''
  let prev = '' // the last significant code character, to tell a regex from a division
  let i = 0
  while (i < src.length) {
    const c = src[i]
    const d = src[i + 1]
    if (c === '/' && d === '/') {
      const end = src.indexOf('\n', i)
      const stop = end === -1 ? src.length : end
      out += blank(src.slice(i, stop))
      i = stop
      continue
    }
    if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2)
      const stop = end === -1 ? src.length : end + 2
      out += blank(src.slice(i, stop))
      i = stop
      continue
    }
    const regexStart = c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev))
    if (c === '"' || c === "'" || c === '`' || regexStart) {
      let j = i + 1
      let inClass = false
      while (j < src.length) {
        const ch = src[j]
        if (ch === '\\') {
          j += 2
          continue
        }
        if (ch === '\n' && c !== '`') break
        if (regexStart) {
          if (ch === '[') inClass = true
          else if (ch === ']') inClass = false
          else if (ch === '/' && !inClass) break
        } else if (ch === c) break
        j++
      }
      const stop = Math.min(j + 1, src.length)
      const inner = src.slice(i + 1, Math.max(i + 1, stop - 1))
      out += blankStrings ? c + blank(inner) + (stop - 1 > i ? src[stop - 1] : '') : src.slice(i, stop)
      prev = 'a'
      i = stop
      continue
    }
    out += c
    if (!/\s/.test(c)) prev = c
    i++
  }
  return out
}

/** A file whose directive prologue holds "use server" (comments already stripped). */
export function hasUseServerDirective(code) {
  return /^(?:#![^\n]*\n)?\s*(?:(['"])[^'"\n]*\1\s*;?\s*)*?(['"])use server\2/.test(code)
}

/** Index of the bracket closing the one at `open` (strings already blanked). */
function matching(code, open) {
  const pairs = { '(': ')', '[': ']', '{': '}' }
  const stack = []
  for (let i = open; i < code.length; i++) {
    const c = code[i]
    if (pairs[c]) stack.push(pairs[c])
    else if (c === ')' || c === ']' || c === '}') {
      stack.pop()
      if (!stack.length) return i
    }
  }
  return code.length - 1
}

/** After a function's parameter list: the `{` opening its body, skipping a return type; -1 for a bodiless signature. */
function bodyStart(code, i) {
  let angle = 0
  let prev = ')'
  for (; i < code.length; i++) {
    const c = code[i]
    if (/\s/.test(c)) continue
    if (c === '<') angle++
    else if (c === '>' && code[i - 1] !== '=') angle--
    else if (c === '(' || c === '[') {
      i = matching(code, i)
      prev = ')'
      continue
    } else if (c === '{') {
      if (angle === 0 && !':|&<,('.includes(prev)) return i
      i = matching(code, i) // an object type
      prev = '}'
      continue
    } else if (c === ';' && angle === 0) return -1
    prev = c
  }
  return -1
}

/** End of an `export const X = …` statement: `;` at depth 0, or a newline before the next top-level statement. */
function statementEnd(code, i) {
  for (; i < code.length; i++) {
    const c = code[i]
    if (c === '(' || c === '[' || c === '{') {
      i = matching(code, i)
      continue
    }
    if (c === ';') return i
    if (c === '\n' && /^\s*(?:export|import|const|let|var|function|async\s+function|class|type|interface)\b/.test(code.slice(i + 1, i + 200))) return i
  }
  return code.length
}

/**
 * Audits one route file's source: each exported HTTP method handler with the
 * gate found in its own body (or null), and problems the audit can't see past.
 */
export function auditRouteSource(src) {
  const code = stripComments(src, { blankStrings: true })
  const bodies = new Map() // name → [body, …]; a bodiless overload signature is ''
  const add = (name, body) => bodies.set(name, [...(bodies.get(name) ?? []), body])
  const problems = []

  for (const m of code.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*(?:<[^>(]*>)?\s*\(/g)) {
    if (!METHODS.includes(m[1])) continue
    const close = matching(code, m.index + m[0].length - 1)
    const open = bodyStart(code, close + 1)
    add(m[1], open === -1 ? '' : code.slice(open, matching(code, open) + 1))
  }
  for (const m of code.matchAll(/\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/g)) {
    if (!METHODS.includes(m[1])) continue
    const start = m.index + m[0].length
    add(m[1], code.slice(start, statementEnd(code, start)))
  }
  if (/\bexport\s+(?:const|let|var)\s*[{[]/.test(code)) {
    problems.push("a destructured export (`export const { GET } = …`): the audit can't see the handlers' bodies — declare each one in this file")
  }
  for (const m of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const spec of m[1].split(',')) {
      const exported = spec.trim().split(/\s+as\s+/).pop()?.trim()
      if (METHODS.includes(exported)) problems.push(`${exported}: exported through \`export { … }\`, so the audit can't see its body — declare it as \`export async function ${exported}\``)
    }
  }
  if (/\bexport\s*\*/.test(code)) problems.push("`export * from …`: the audit can't see what it exports — declare each handler in this file")

  const handlers = []
  for (const [name, list] of bodies) {
    const withBody = list.filter(Boolean)
    for (const body of withBody.length ? withBody : list) {
      handlers.push({ name, gate: GATES.find((g) => g.re.test(body))?.name ?? null })
    }
  }
  return { handlers, problems }
}

function walk(dir, match) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'node_modules') out.push(...walk(p, match))
    } else if (match(name)) out.push(p)
  }
  return out
}

/** Runs the audit over `root`; returns { routes, handlers, failures }. */
export function audit(root) {
  const appDir = join(root, 'src/app')
  if (!existsSync(appDir)) return { routes: 0, handlers: 0, failures: [`${appDir} doesn't exist — nothing to audit, which is not a pass (run from the repo, or pass its root)`] }
  const failures = []
  const routes = walk(appDir, (name) => ROUTE_FILE.test(name))
  let handlerCount = 0
  for (const file of routes) {
    const rel = relative(root, file)
    const { handlers, problems } = auditRouteSource(readFileSync(file, 'utf8'))
    handlerCount += handlers.length
    if (PUBLIC_ROUTES.has(rel)) continue
    for (const p of problems) failures.push(`${rel}: ${p}`)
    if (!handlers.length && !problems.length) failures.push(`${rel}: no exported HTTP method handler found (${METHODS.join(', ')}) — the audit can't tell what it serves`)
    for (const h of handlers) {
      if (!h.gate && !PUBLIC_ROUTES.has(`${rel} ${h.name}`)) failures.push(`${rel} ${h.name}: no gate in its own body (${GATES.map((g) => g.name).join(', ')})`)
    }
  }
  for (const file of walk(join(root, 'src'), (name) => SOURCE_FILE.test(name))) {
    if (hasUseServerDirective(stripComments(readFileSync(file, 'utf8')))) {
      failures.push(`${relative(root, file)}: a top-level "use server" file — every export is a public POST endpoint. Use an API route with requireUser() instead (docs/architecture.md → API routes)`)
    }
  }
  return { routes: routes.length, handlers: handlerCount, failures }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = process.argv[2] ? resolve(process.argv[2]) : ROOT
  const { routes, handlers, failures } = audit(root)
  if (failures.length) {
    console.error('✗ route-auth audit failed:')
    for (const f of failures) console.error('  ' + f)
    process.exit(1)
  }
  console.log(`route-auth: ${handlers} handler(s) in ${routes} route file(s) gated, no "use server" files — ok`)
}
