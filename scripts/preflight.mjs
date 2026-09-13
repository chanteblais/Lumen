#!/usr/bin/env node
// Preflight (docs/dev-hygiene.md → Guards). Runs before `npm run check` and
// `npm run dev` (npm's precheck / predev), so a checkout that isn't ready stops
// in a second with the fix named, instead of minutes later as a confusing tsc,
// Turbopack or Clerk error. When a trap in that doc can be caught cheaply, add
// the check here, and say in its message what to run.
//
// Failures exit 1. Notes print and carry on. Env checks are skipped in CI.

import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, lstatSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const EVENT = process.env.npm_lifecycle_event ?? ''
const failures = []
const notes = []

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))

// 1. node_modules: present, a real directory, and matching the lockfile.
//    A merge that adds or bumps a package leaves the old install behind, and
//    tsc then reports "Cannot find module" as if the code were wrong.
//    A fresh worktree has none: it gets a copy-on-write clone of another
//    checkout's install for the same package-lock.json (about a second and no
//    extra disk, against ~12 s and ~1 GB for `npm ci`).
const nm = join(ROOT, 'node_modules')
if (!existsSync(nm)) {
  const cloned = cloneInstall()
  if (cloned) notes.push(cloned)
  else failures.push('node_modules is missing (a fresh worktree has none), and no other checkout has an install for this package-lock.json to clone.\n  Fix: npm ci')
}
if (existsSync(nm)) {
  if (lstatSync(nm).isSymbolicLink()) {
    failures.push("node_modules is a symlink: Turbopack refuses one that points outside the project, and it follows another checkout's installs.\n  Fix: rm node_modules && npm run preflight (clones a matching install, or says npm ci)")
  } else if (existsSync(join(ROOT, 'package-lock.json'))) {
    const drift = driftOf(ROOT)
    if (drift.length) {
      failures.push(`node_modules doesn't match package-lock.json (usually a merge or pull that changed packages):\n    ${drift.join('\n    ')}\n  Fix: npm ci`)
    }
  }
}

// 2. Generated route types pointing at routes that no longer exist (a page
//    renamed or removed). tsconfig includes .next/types and .next/dev/types,
//    and `next typegen` rewrites only the first, so a stale dev copy fails the
//    typecheck. They are generated and Next writes them again: remove them.
for (const dir of ['.next/types', '.next/dev/types']) {
  const validator = join(ROOT, dir, 'validator.ts')
  if (!existsSync(validator)) continue
  const gone = [...new Set([...readFileSync(validator, 'utf8').matchAll(/import\("(\.[^"]+)\.js"\)/g)].map((m) => resolve(dirname(validator), m[1])))]
    .filter((base) => !['.tsx', '.ts', '.jsx', '.js'].some((ext) => existsSync(base + ext)))
  if (gone.length) {
    rmSync(join(ROOT, dir), { recursive: true, force: true })
    notes.push(`removed stale generated types in ${dir} (they pointed at ${gone.map((g) => relative(ROOT, g)).join(', ')}); Next writes them again`)
  }
}

// 3. .env.local: untracked, so a fresh worktree has none (it gets a copy of the
//    shared checkout's), and one copied before a merge can lack a key the merge
//    made necessary. Required keys are the uncommented KEY= lines in
//    .env.example. Names only; values never printed.
//    `next dev` without them fails at the first request, so they fail `dev`;
//    `check` doesn't need them, so there they are a note.
if (!process.env.CI) {
  const envProblem = (msg) => (EVENT === 'predev' ? failures.push(msg) : notes.push(msg.replace(/\n\s+/g, ' — ')))
  const fromMain = mainCheckout()
  const copyHint = fromMain && fromMain !== ROOT ? `from ${fromMain}/.env.local` : 'from the main checkout'
  const local = join(ROOT, '.env.local')
  if (!existsSync(local) && fromMain && fromMain !== ROOT && existsSync(join(fromMain, '.env.local'))) {
    copyFileSync(join(fromMain, '.env.local'), local)
    notes.push(`copied .env.local from ${fromMain} (a fresh worktree has none)`)
  }
  if (!existsSync(local)) {
    envProblem(`.env.local is missing.\n  Fix: cp ${fromMain && fromMain !== ROOT ? `${fromMain}/.env.local` : '<main checkout>/.env.local'} .env.local`)
  } else if (existsSync(join(ROOT, '.env.example'))) {
    const set = keys(readFileSync(local, 'utf8'), true)
    const required = keys(readFileSync(join(ROOT, '.env.example'), 'utf8'), false)
    // Lumi's model key follows LUMI_MODEL (src/core/ai/model.ts): OpenAI unless it names Anthropic.
    if ((set.get('LUMI_MODEL') ?? '').startsWith('anthropic:')) {
      required.delete('OPENAI_API_KEY')
      required.add('ANTHROPIC_API_KEY')
    }
    const missing = [...required].filter((k) => !set.get(k))
    if (missing.length) envProblem(`.env.local has no value for ${missing.join(', ')} (required by .env.example).\n  Fix: copy ${missing.length > 1 ? 'them' : 'it'} ${copyHint}`)
  }
}

for (const n of notes) console.log(`preflight: ${n}`)
if (failures.length) {
  console.error("✗ preflight failed — this checkout isn't ready (docs/dev-hygiene.md → Traps):")
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log('preflight: installs match the lockfile, generated types current — ok')

/** Top-level packages whose installed version differs from the lockfile's, in `dir`'s node_modules. */
function driftOf(dir) {
  const lock = readJson(join(dir, 'package-lock.json'))
  const pkg = readJson(join(dir, 'package.json'))
  const drift = []
  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    const want = lock.packages?.[`node_modules/${name}`]?.version
    const manifest = join(dir, 'node_modules', name, 'package.json')
    const have = existsSync(manifest) ? readJson(manifest).version : undefined
    if (!have) drift.push(`${name}: not installed`)
    else if (want && have !== want) drift.push(`${name}: ${have} installed, the lockfile wants ${want}`)
  }
  return drift
}

/**
 * Clones node_modules from another checkout of this repo whose package-lock.json is
 * byte-identical and whose install matches it. Copy-on-write (APFS): one clonefile(2)
 * of the whole tree (~1 s), else `cp -cR` (~10 s), into a temp name renamed into place,
 * so an interrupted clone never leaves a half node_modules. Returns a note, or
 * undefined when there's no source or the filesystem can't clone (then: npm ci).
 */
function cloneInstall() {
  if (!existsSync(join(ROOT, 'package-lock.json'))) return undefined
  const lock = readFileSync(join(ROOT, 'package-lock.json'))
  const source = checkouts().find((dir) => {
    if (dir === ROOT) return false
    try {
      const theirs = join(dir, 'node_modules')
      return existsSync(theirs) && !lstatSync(theirs).isSymbolicLink() && readFileSync(join(dir, 'package-lock.json')).equals(lock) && driftOf(dir).length === 0
    } catch {
      return false
    }
  })
  if (!source) return undefined
  const from = join(source, 'node_modules')
  const tmp = join(ROOT, `.node_modules-clone-${process.pid}`)
  const clonefile = 'import ctypes, sys; sys.exit(ctypes.CDLL(None).clonefile(sys.argv[1].encode(), sys.argv[2].encode(), 0) != 0)'
  const started = Date.now()
  for (const [how, cmd, args] of [['clonefile', 'python3', ['-c', clonefile, from, tmp]], ['cp -cR', 'cp', ['-cR', from, tmp]]]) {
    rmSync(tmp, { recursive: true, force: true })
    try {
      execFileSync(cmd, args, { stdio: 'ignore' })
      renameSync(tmp, nm)
    } catch {
      continue
    }
    return `cloned node_modules from ${source} (${how}, copy-on-write, ${((Date.now() - started) / 1000).toFixed(1)} s): same package-lock.json, so no npm ci`
  }
  rmSync(tmp, { recursive: true, force: true })
  return undefined
}

/** Every checkout of this repo (the shared one first), from `git worktree list`. */
function checkouts() {
  try {
    return execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter((line) => line.startsWith('worktree '))
      .map((line) => line.slice('worktree '.length))
  } catch {
    return []
  }
}

/** KEY=value lines. With `values`, a Map of key → value; without, the Set of keys (uncommented lines only). */
function keys(text, values) {
  const found = new Map()
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) found.set(m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2'))
  }
  return values ? found : new Set(found.keys())
}

function mainCheckout() {
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return dirname(common)
  } catch {
    return undefined
  }
}
