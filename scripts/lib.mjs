// Shared by the repo scripts (docs/dev-hygiene.md → Guards): the repo root and
// one exec wrapper, so every script finds paths and runs git the same way.
//
// ROOT is this checkout's root, from the script's own location, through
// fileURLToPath — never `new URL(…).pathname`, which leaves a space as %20 and
// silently misses every path under it. (Scripts that mean "the checkout I'm run
// from" — worktrees.mjs's `here` — ask git instead.)

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')

/**
 * Runs `cmd args` and returns its trimmed stdout; throws on a non-zero exit.
 * `options` go to execFileSync as given (utf8 unless overridden). With no
 * `stdio`, Node echoes the child's stderr to ours as well as capturing it.
 */
export function exec(cmd, args, options = {}) {
  return (execFileSync(cmd, args, { encoding: 'utf8', ...options }) ?? '').trim()
}

/** `exec` that never throws: `{ ok: true, out }` or `{ ok: false, out: stdout + stderr }`. */
export function attempt(cmd, args, options = {}) {
  try {
    return { ok: true, out: exec(cmd, args, options) }
  } catch (error) {
    return { ok: false, out: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() }
  }
}

/** Quiet options for a script that reads git's output itself: no stdin, stderr captured, a big buffer. */
export const QUIET = { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }
