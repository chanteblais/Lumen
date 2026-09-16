# The desk's journal

*Append-only, newest first. One entry per refresh: what went out, how Chanté answered, what the signals moved, the desk's own measures, what the desk changes about itself, and what's carried to Coherence. The measures are the desk's report on itself, never a score shown to her.*

**Entry format.** `## Round N · YYYY-MM-DD · swept to <commit>` → *Went out* · *Her answers* (by choice, with what each became and where) · *Signals* · *Measures* (asks out; share Go with that / Something else / Your call / Not now / Don't bring me these / Hold on; asks older than two rounds) · *The desk changes* · *Carried to Coherence*.

---

## Round 2 · 2026-09-15 · swept to 384b1ea

**What prompted it.** Chanté, reading the desk: *"I'm seeing this in the coherence dashboard, but I think this was already resolved. Is the coherence dashboard updating?"* She was right. The design-notebook ask still read as unlanded while the work had merged to `main` and been pushed the day before. The desk is a rendered page, not a live one: it only changes when a session runs the refresh, and nobody had. The reason it hadn't is worth naming — **the `desk` skill lived on an unlanded branch**, so no ordinary session had it. Landed as `384b1ea` before this round, which is the actual fix for the staleness she noticed.

**The sweep.** `2cf5dc3..origin/main` — four merges: the design notebook (`e805937`), a voice fix, Lumi's function in the persona, and row level security on every table. Plus the canon round 1 admitted it hadn't grepped: `docs/product/*`, `docs/design/*`, `design-system.md`, `architecture.md`, `user-journey.md`. Nothing new for her came out of them; every open item in them points at `living/open-questions.md`, which round 1 had read. That debt is paid.

**Her answers.** All six answered asks were **Go with that**, with no words added. What each became:
- **The desk as the only way questions reach her** → the rule is a standing task in `CLAUDE.md`, with the ask test and the *Moving without you* default written out. The umbrella delegation is in `delegations.md`.
- **What the animation work does next** → the app plays the walk rig before any second object. Recorded in `animation-pipeline.md` (*Next animation*) and `art-direction.md` bet 4.
- **The Library map's five recommendations** → all five accepted in place in the spatial-map README, a product decision in `living/decisions.md`, open question 3 narrowed to the presentation model's remainder, and the naming row in `ef-burden-log.md` moved from *open* to *derived*. Close-ups may now start, `collection_02` first.
- **Clearing finished sessions' leftovers** → a delegation, narrowing the *What goes to Chanté* line in `dev-hygiene.md`. One leftover removed the same round.
- **Lumi's proposed behaviour as claims** → `docs/philosophy/lumi-proposed-claims.md`, thirteen claims, and this round's single ask.
- **Refreshing the Drive briefing** → couldn't be carried out. See below.
- **Lumi's design notebook** (unanswered) → retired, not carried forward: another session tried it with the real model (voice-eval run 2, three live turns on `gpt-6-astra`), landed it and pushed it on 2026-09-14. Everything the ask was waiting for happened.

**Signals.**
- *Go with that* on three `glance` asks (the working rule, the leftovers, the claims page) — two of them were proposed delegations and are now delegations, so that kind of decision stops coming to her. That is the intended path and it fired on the first round.
- No *Something else*, no *Your call*, no *Not now*, no *Hold on*, and not one note. Nothing to learn from where a recommendation missed — the desk has no correction signal yet, which is itself worth watching: a round where everything is agreed to could mean the recommendations are good, or that tapping *Go with that* is simply the cheapest thing to do. Round 3 watches whether any *Something else* ever appears.
- **One ask asked for permission Claude couldn't act on.** *Refresh the Drive briefing* was framed as though a yes unblocked it. It didn't: the Drive connector can't write these documents — `update_file` takes a title and a parent, nothing else — re-verified this round against the connector's own schema. Her yes is real and stands as standing permission; the missing piece is a write path. The item moves to *her hands* with the steps, and `context-package.md` records that the blocker was never her.
- **An ask can go stale under her while she reads it.** The desk knows only what it has swept, so anything landing between rounds is invisible to it.

**Measures.** 7 asks out in round 1 → **1 out in round 2** (1 `sit`). Answered: 6 of 7 (86%); of those answered, 6 *Go with that* (100%), 0 *Something else*, 0 *Your call*, 0 *Not now*, 0 *Don't bring me these*, 0 *Hold on*. Delegations: 5 → 7. Notes written: 0. Asks older than two rounds: none — the one unanswered ask was retired by events rather than carried. Hands: 4 → 5.

**The desk changes.**
- **It sweeps every merge since its last round before it renders**, so an ask whose subject has already landed is retired instead of shown to her. This round's trigger becomes the round's rule.
- **An ask must be something Claude can carry out.** Before one is written, the question is now *whose hands does this need?* If it's a tool or a permission Claude doesn't have, it goes to *your hands* with the steps, not to her as a question she can only answer yes to.
- **The refresh has to be reachable.** The skill living on an unlanded branch is what let a whole day pass with a stale page. Anything the desk depends on lands with the desk.
- One judgement sharpened in passing: a worktree's `.env.local` is only *worth keeping* when it holds a key or value the shared checkout's doesn't. A byte comparison had been keeping a worktree alive over a copy that simply lagged by one key (`scripts/worktrees.mjs`).

**Carried to Coherence.**
- *Something answered elsewhere must stop being open here.* In the app: a thing the user settles in one conversation quietly closes wherever else it was waiting. They should never answer the same question twice because two parts of the system hadn't spoken — which is exactly what happened to her this round, in the tool built to prevent it.
- *Never ask for permission you can't act on.* Lumi doesn't ask the user to approve something she has no way to do. She says what she needs, or asks for the one step only they can take.

---

## Round 1 · 2026-09-14 · swept to 2cf5dc3

**Why the desk exists.** Chanté, 2026-09-14: "I feel like I'm drowning a bit in information with all the different areas of this project. I'd like one central place where I can review the things that need my attention, and quickly give direction. Over time I would like for this project to be more self-directed, requiring fewer micro decisions from me."

**The sweep.** Every doc, log, spatial README, review inbox, memory and branch that could hold something waiting on her, read from `main` at 2cf5dc3. Around sixty threads across about twenty files. Roughly a dozen were already answered somewhere else and still read as open where they were written. About twenty were Claude's to decide under an existing delegation or the docs audit. Around fifteen were hers but not timely: they don't block anything now. That left seven asks and four things only her hands can do.

Not fully swept: the `docs/product/*` and `docs/design/*` canon (other than the routine inbox), `design-system.md`, `architecture.md` and `user-journey.md` were not grepped for questions. Their open questions are in `living/open-questions.md`, which was read. Round 2 sweeps them.

**Went out.** Asks: the desk as the only way questions reach her · what the animation work does next · the Library spatial map's five recommendations · Lumi's design notebook (try, then land) · Lumi's proposed behaviour as one page of claims · refreshing the Drive context package · clearing finished sessions' leftovers. Hands: Google consent screen · OpenAI spend limit · Supabase backups · M7's week of daily use. Moving: stale rows cleared under the docs audit · conversation-eval scenarios before any persona change · Claude's half of pre-production · re-measuring the Library map · *Not today* (gap plan C) on a branch.

**Measures (baseline).** 7 asks out: 3 glance, 3 think, 1 sit. 2 of the 7 are really proposed delegations (the working rule, the leftovers).

**The desk changes.** Two changes, both the same day, from Chanté before any answers came in:
- **It became an experiment with an end.** She asked whether it was mad to hand the app's own usefulness to a dashboard. Claude's recommendation: build the mechanics into the app, not the desk itself, and run the desk as a lab until her M7 week. She agreed.
- **A box for her own words under every ask**, replacing *Something else*, which hid the box behind a tap. She: "I like the main task's suggestion boxes, but I'd also like a text box to input thoughts that aren't covered in the suggestions." What it teaches: the suggested answers are a floor, not a fence. Offering choices without an always-open way to say something else narrows what the person can say. *Carried to Coherence:* wherever Lumi offers chips (*Not this*, the capacity question), plain words should stay one step away, never hidden. What to watch in round 2: whether she uses the capacity choice; whether *Everything else can wait* gets opened (if it's opened often, parked items were mis-sorted, or she needs a way to find things more than a path); whether the recommendations are trusted (*Go with that*) or corrected.

**Carried to Coherence.** What building the desk showed, offered as evidence for the app, not decisions:

1. **Stale open items are most of the noise.** Many of the "waiting on Chanté" markers had been answered elsewhere and kept reading as open where they were written. For Lumi: reconcile, don't only remember. Something settled in one conversation should quietly stop being open everywhere else (open question 24, reconciliation between memory and state).
2. **A question without a recommendation is a task; with one, it's a tap.** For Lumi: when starting is hard, offer the first step as something to say yes to, never *What do you want to do?* (Principles 2 and 5.)
3. **Say what happens on silence.** An unanswered question with no default becomes debt that waits for the person's return. For Lumi: anything she asks carries its default, so coming back never means facing unanswered questions (Principle 7).
4. **Let "you decide" teach, then confirm once.** Repeated *Your call* in one area becomes a proposed delegation, never a silent one. For Lumi: a repeated *you pick* becomes an offer of scoped authority, granted in conversation (the 2026-09-14 autonomy direction, Q10), never a setting.
5. **Much of the weight is not knowing whose call something is.** The ask test settles ownership before anything reaches her. For Lumi: *I'll hold this; you don't need to* is containment the user can trust (Garden: trusted containment).
6. **Effort is a better filter than priority for a tired person.** The desk tags each ask by how much of her it takes, not only how important it is. For Today: the capacity answer could choose *which kind* of first step, as well as how many.
