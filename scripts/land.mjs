#!/usr/bin/env node
// Land a branch on main without checking main out anywhere
// (docs/branching.md → Landing on main).
//
//   npm run land -- <branch> [-m "subject"] [-m "paragraph"]…
//
// Git lets a branch be checked out in only one worktree, so every
// `git checkout main && git merge` left main held by whichever checkout merged
// last, and the next session to merge was blocked. This builds the same
// --no-ff merge commit from refs alone and moves main with a compare-and-swap:
//   1. refuses if any worktree has main checked out (moving the ref under it
//      would leave its files out of step) — and names it;
//   2. refuses unless the branch already contains main (merge main into the
//      branch first, re-run `npm run check` there), so the landing is conflict-free;
//   3. writes the merged tree (`git merge-tree --write-tree`), the merge commit
//      (`git commit-tree`, parents main then the branch) and moves main only
//      if it still points where it did (`git update-ref <new> <old>`).
// It never touches a working tree. `npm run check`, the click-through and the
// docs audit come before it; pushing comes after, on approval.

import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const tryGit = (...args) => {
  try {
    return { ok: true, out: git(...args) };
  } catch (error) {
    return { ok: false, out: `${error.stdout ?? ""}${error.stderr ?? ""}`.trim() };
  }
};
const fail = (lines) => {
  console.error(["✗ land: " + lines[0], ...lines.slice(1).map((l) => "  " + l)].join("\n"));
  process.exit(1);
};

const args = process.argv.slice(2);
const messages = [];
let branch;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-m") messages.push(args[++i] ?? "");
  else if (!branch) branch = args[i];
  else fail([`unexpected argument "${args[i]}"`, 'usage: npm run land -- <branch> [-m "subject"] [-m "paragraph"]…']);
}
if (!branch) fail(["which branch?", 'usage: npm run land -- <branch> [-m "subject"] [-m "paragraph"]…']);
if (branch === "main") fail(["main can't land on itself"]);

const branchSha = tryGit("rev-parse", "--verify", "--quiet", `refs/heads/${branch}^{commit}`);
if (!branchSha.ok) fail([`no local branch "${branch}"`]);
const mainSha = git("rev-parse", "--verify", "refs/heads/main^{commit}");

// 1. Nobody may have main checked out.
const holders = [];
let path;
for (const line of git("worktree", "list", "--porcelain").split("\n")) {
  if (line.startsWith("worktree ")) path = line.slice("worktree ".length);
  if (line === "branch refs/heads/main") holders.push(path);
}
if (holders.length) {
  fail([
    `main is checked out in ${holders.join(", ")} — moving it would leave that checkout's files out of step.`,
    "Nobody parks on main (docs/branching.md). If that checkout is idle, release it — its files stay as they are:",
    ...holders.map((p) => `  git -C ${p} switch --detach`),
    "If a session is working there, ask it to release main, then run this again.",
  ]);
}

// 2. The branch must already contain main.
if (!tryGit("merge-base", "--is-ancestor", mainSha, branchSha.out).ok) {
  fail([
    `${branch} doesn't contain the latest main (${mainSha.slice(0, 7)}).`,
    "In the branch's checkout: git merge main, resolve anything, npm run check, then run this again.",
  ]);
}
if (mainSha === branchSha.out || tryGit("merge-base", "--is-ancestor", branchSha.out, mainSha).ok) {
  fail([`${branch} has nothing main doesn't already have.`]);
}

// 3. Build the merge and move main only if it hasn't moved.
const tree = tryGit("merge-tree", "--write-tree", mainSha, branchSha.out);
if (!tree.ok) fail(["the merge would conflict (it shouldn't, once the branch contains main):", tree.out]);
const treeSha = tree.out.split("\n")[0];

const subject = messages.length ? messages : [`Merge branch '${branch}'`];
const commitArgs = ["commit-tree", treeSha, "-p", mainSha, "-p", branchSha.out];
for (const m of subject) commitArgs.push("-m", m);
const mergeSha = git(...commitArgs);

const moved = tryGit("update-ref", "-m", `land: ${branch}`, "refs/heads/main", mergeSha, mainSha);
if (!moved.ok) {
  fail([
    "main moved while landing — nothing was changed. Merge main into the branch again and re-run.",
    moved.out,
  ]);
}

console.log(`✓ landed ${branch} on main: ${git("log", "--oneline", "-1", mergeSha)}`);
console.log(`  next: once its worktree is gone or detached, delete the branch: git merge-base --is-ancestor ${branch} main && git branch -D ${branch}`);
console.log("  (not -d: it judges merged against the HEAD of the checkout it runs in, and a parked checkout trails main);");
console.log("  push main on approval — check `git log --first-parent origin/main..main` for what rides along.");
