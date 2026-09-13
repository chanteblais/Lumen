#!/usr/bin/env node
// Worktree census (docs/branching.md → Worktree lifecycle; docs/dev-hygiene.md → Guards).
//
//   npm run worktrees             report every worktree: what it is, and why it stays or that it can go
//   npm run worktrees -- --prune  remove the ones that can go (and their branches, when merged into main)
//
// A worktree can go only when every one of these holds:
//   - it lives under .claude/worktrees (the shared checkout, this checkout and other tools' worktrees stay)
//   - it isn't locked (a Claude session locks a worktree EnterWorktree made; one the desktop app made isn't
//     locked, so the in-use check below is what keeps it while its session runs)
//   - no process has its working directory inside it (a session, a shell, a dev server)
//   - nothing happened in it for an hour (a session may be about to move in)
//   - no uncommitted or untracked changes
//   - its HEAD is already on main (removing it loses no commit)
//   - its ignored files are all disposable: node_modules, .next, build output, a .env.local identical to
//     the shared checkout's, session bookkeeping — not sheet candidates, keys or anything unrecognised
// Removal is plain `git worktree remove` (git refuses anything dirty on its own), then the branch goes with
// `git branch -D` once its tip is proven on main — `-d` would judge against this checkout's HEAD instead.

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { attempt, QUIET } from "./lib.mjs";

// { ok, out } — never throws; stdin ignored, stderr captured, 64 MB buffer.
const run = (cmd, args) => attempt(cmd, args, QUIET);
const git = (...args) => run("git", args);
const prune = process.argv.includes("--prune");
const HOUR = 60 * 60 * 1000;

// Every worktree, the shared checkout first.
const trees = [];
for (const line of git("worktree", "list", "--porcelain").out.split("\n")) {
  if (line.startsWith("worktree ")) trees.push({ path: line.slice("worktree ".length), branch: null, locked: null, prunable: false });
  const t = trees[trees.length - 1];
  if (line.startsWith("HEAD ")) t.head = line.slice("HEAD ".length);
  if (line.startsWith("branch ")) t.branch = line.slice("branch refs/heads/".length);
  if (line.startsWith("locked")) t.locked = line.slice("locked".length).trim() || "locked";
  if (line.startsWith("prunable")) t.prunable = true;
}
const shared = trees[0].path;
const managed = path.join(shared, ".claude", "worktrees") + path.sep;
const here = path.resolve(git("rev-parse", "--show-toplevel").out);
const mainSha = git("rev-parse", "--verify", "refs/heads/main").out;
const sharedEnv = existsSync(path.join(shared, ".env.local")) ? readFileSync(path.join(shared, ".env.local"), "utf8") : null;

// Which process sits in which worktree (by working directory; the longest matching path wins).
const inside = new Map(trees.map((t) => [t.path, new Set()]));
let pid, command;
for (const line of run("lsof", ["-a", "-d", "cwd", "-F", "pcn"]).out.split("\n")) {
  if (line.startsWith("p")) pid = line.slice(1);
  else if (line.startsWith("c")) command = line.slice(1);
  else if (line.startsWith("n")) {
    const cwd = line.slice(1);
    const owner = trees
      .filter((t) => cwd === t.path || cwd.startsWith(t.path + path.sep))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (owner && Number(pid) !== process.pid && Number(pid) !== process.ppid) inside.get(owner.path).add(command);
  }
}

// Ignored entries git would delete along with the worktree, and whether each is disposable.
const DISPOSABLE = new Set(["node_modules/", ".next/", "out/", "build/", "coverage/", ".vercel/", ".claude/", "__pycache__/", "tsconfig.tsbuildinfo", "next-env.d.ts", ".DS_Store"]);
const keepers = (t) =>
  git("-C", t.path, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory").out
    .split("\n")
    .filter(Boolean)
    .filter((entry) => {
      const name = entry.split("/").filter(Boolean).pop() + (entry.endsWith("/") ? "/" : "");
      if (DISPOSABLE.has(entry) || DISPOSABLE.has(name) || /(^|\/)npm-debug\.log/.test(entry)) return false;
      if (entry === ".env.local") return readFileSync(path.join(t.path, entry), "utf8") !== sharedEnv;
      return true;
    });

const lastActive = (t) => {
  const gitDir = git("-C", t.path, "rev-parse", "--path-format=absolute", "--git-dir").out;
  const log = path.join(gitDir, "logs", "HEAD");
  return statSync(existsSync(log) ? log : t.path).mtimeMs;
};

const verdict = (t) => {
  if (t.path === shared) return "the shared checkout";
  if (path.resolve(t.path) === here) return "this checkout";
  if (!t.path.startsWith(managed)) return "not under .claude/worktrees (another tool's)";
  if (t.prunable) return null; // its directory is already gone: git worktree prune
  if (t.locked) return `locked (${t.locked})`;
  const procs = [...inside.get(t.path)];
  if (procs.length) return `in use (${[...new Set(procs)].join(", ")})`;
  if (Date.now() - lastActive(t) < HOUR) return "active in the last hour";
  const dirty = git("-C", t.path, "status", "--porcelain").out.split("\n").filter(Boolean).length;
  if (dirty) return `${dirty} uncommitted or untracked change(s)`;
  if (!git("merge-base", "--is-ancestor", t.head, mainSha).ok) return "has commits that aren't on main";
  const keep = keepers(t);
  if (keep.length) return `ignored files worth keeping: ${keep.slice(0, 4).join(", ")}${keep.length > 4 ? "…" : ""}`;
  return null;
};

let removable = 0;
for (const t of trees) {
  const why = verdict(t);
  const name = t.path.startsWith(managed) ? t.path.slice(managed.length) : t.path;
  const what = t.branch ?? `detached ${t.head.slice(0, 7)}`;
  if (why) {
    console.log(`  keep  ${name}  [${what}] — ${why}`);
    continue;
  }
  removable++;
  if (!prune) {
    console.log(`  can go ${name}  [${what}]${t.prunable ? " — directory already gone" : ""}`);
    continue;
  }
  if (t.prunable) {
    git("worktree", "prune");
    console.log(`  pruned ${name} — its directory was already gone`);
    continue;
  }
  const removed = git("worktree", "remove", t.path);
  if (!removed.ok) {
    console.log(`  kept  ${name} — git refused: ${removed.out}`);
    continue;
  }
  // Not `git branch -d`: it judges "merged" against the HEAD of the checkout this runs from, and the parked
  // shared checkout trails main, so it refused branches that had landed. Ancestry of the branch's tip in main
  // is the proof; with its worktree gone nothing has it out to move it, so -D after the check loses nothing.
  const branchNote = t.branch
    ? git("merge-base", "--is-ancestor", `refs/heads/${t.branch}`, mainSha).ok && git("branch", "-D", t.branch).ok
      ? `, branch ${t.branch} deleted`
      : `, branch ${t.branch} kept`
    : "";
  console.log(`  removed ${name}  [${what}]${branchNote}`);
}
if (!prune && removable) console.log(`\n${removable} can go — npm run worktrees -- --prune removes them.`);
if (!removable) console.log("\nNothing to remove.");
