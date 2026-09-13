# Voice Eval Log

Scripted scenarios run against Lumi's persona (`src/core/ai/persona.ts`), what was off, and what changed. Newest first. The scenario list is the nine situations in `product.md` plus anything that came up in real use.

**This log is design evidence** for [`docs/philosophy/lumi.md`](philosophy/lumi.md) (§15). When a reply is especially good or bad, name the behaviour behind it there. Since 2026-09-13 Lumi's model is under evaluation ([model strategy](product/lumi-model-strategy.md)), so every run names the model it used, and comparison runs grade each model on the same scenarios.

**Grading (manual, per reply, two marks).** Runs 1–3 predate this and carry one mark.
- **Voice:** ✓ in voice · ~ slightly off · ✗ wrong register.
- **Use:** ✓ makes the next move easier · ~ partly · ✗ adds burden or misses the point. Use asks whether the reply lowers what the user has to carry and keeps their authority: it finds the obstacle, uses what Coherence already holds instead of asking, and puts one decision in front of them. A reply can sound exactly like Lumi and still fail here.
- **n/a (tools):** the right reply also needed an action the script can't take (filing a brain dump, starting a session, reporting capacity). It is marked as unknown, not as a miss.

Note why beside every ~ and ✗.

**The classic failures are signs, not rules:** over-reassuring, over-planning (a list where a step would do), therapy-speak, exclamation marks, restating feelings, offering three options, lecturing, a count, a time reference, explaining herself. Mark one down when it adds burden or costs agency in that reply, not merely for appearing. Mentioning a closed phone line before a call is context; opening with the clock is noise.

**Who graded.** Every graded run names its grader. Claude's grades are a provisional assessment, never Chanté's approval, and say where Claude has a stake: its own prompt change, or a comparison with Claude in it. Having a stake is a reason to grade blind on these criteria, not to abstain. A comparison worth deciding on shuffles the conditions and holds identifying details equal, such as the time of day.

**What this harness can't show:** actions (it has no tools), and judgement across a conversation. Nine replies of one or two turns show whether she sounds right. They don't show whether she uses what she knows, takes a correction, leaves reflection alone or makes the next move easier over several turns (`lumi.md` §17).

---

## Scenarios

| # | Prompt | What good looks like |
|---|---|---|
| 1 | "I know what I need to do but I can't start." | Diagnose unclear-vs-initiation; one physical step; wait |
| 2 | "I have too many things and don't know what to prioritise." | Hold the dump; pick one; no full ranking |
| 3 | "I don't even know what I need to do." | Ask one orienting question; no framework |
| 4 | "I've been avoiding this all day." | Name it lightly; smallest threshold; maybe humour |
| 5 | "I got distracted." | "Welcome back. Where did we end up?" — no absolution speech |
| 6 | "Haven't opened this in two weeks, everything's a mess." | Offer the relevance pass; no counts; time away named only to help them get their bearings, never as debt (decided 2026-09-13) |
| 7 | "Just stay with me while I work." | Three questions: what, first step, how long; then quiet |
| 8 | "I only have about 20% today." | Match capacity; one small thing; call it enough |
| 9 | Unstructured brain dump (5+ items) | Capture silently via tools; reflect back one line; ask what's first |

---

## Runs

Run with `node --env-file=.env.local --import tsx scripts/voice-eval.mjs [n]` — real model, same persona + context block as production, no database. Paste the transcript highlights and the grade per scenario below, newest first.

### Run 6 — 2026-09-13 · scenario 6 on OpenAI after *Lumi may name time away* (`gpt-6-astra`, reasoning effort low, `store: false`, context = ~1:40pm Vancouver, last seen 3h ago)
The persona and the re-entry context line now allow naming time away when it helps orient, never as debt (`decisions.md` → *Lumi may name time away*). Prefix 4,140 tokens, uncached on this single call. The persona on `main` has grown since run 5 (the Library section), so the difference isn't all this change.

**Graded by Claude (Opus 5), provisionally; not blind** (Claude made the change).

| # | Voice | Use | Lumi said |
|---|---|---|---|
| 6 | ✓ | ✓ | "We can start with what matters now, not reconstruct the last two weeks. / What's on your mind? No need to sort it first." |

**Why:** almost the same reply as run 5. The rule *allows* naming time away and doesn't ask for it, so an unchanged reply is consistent with the change; it isn't evidence for it. The script's context has no stale intentions, so the part the rule is about (orienting someone before the relevance pass) can't come up here. A conversation-length scenario with stale items in context would test it (`lumi.md` §17).

### Run 5 — 2026-09-13 · all nine on OpenAI with Lumi's brief in the prefix (`gpt-6-astra`, reasoning effort low, `store: false`, context = run at ~noon Vancouver on a Sunday, last seen 3h ago)
The first run with [Lumi's brief](philosophy/lumi-brief.md) (the canon synthesised for her) placed after the persona's opening paragraph (`decisions.md` → *Lumi carries the philosophy*). Same script and scenarios as run 4, so the two can be read side by side, though run 4 was at 2:40am and this one at noon, and the time of day changes several replies. The script has no tools, so scenario 9 can't capture. Cache: the prefix is 3,994 tokens, cached from the second call (run 4: 2,049). Output 9–158 tokens per reply.

**Graded by Claude (Opus 5), 2026-09-13, provisionally:** an assessment, not Chanté's approval. **Not blind.** Claude wrote the brief this run tests and knew which run was which, and the clock (2:40am vs noon) gives the runs away. So these grades don't settle whether the brief helped. That needs a paired run at the same time of day, graded blind. *Use* marks what the reply could do without tools; *n/a (tools)* marks an action the right reply needed that the script can't take.

| # | Voice | Use | Lumi said |
|---|---|---|---|
| 1 | ~ | ✓ | "What's the thing? I'll help find the first physical move, not make you a plan." → (grant report, due Monday) "Open the grant report file—or a blank document if there isn't one yet. Nothing to write yet." |
| 2 | ✓ | ✓ | "Tell me what's on your plate — messy is fine. If anything has a firm deadline, include it." → (the five things) "The thesis and camp website are the bigger pieces, with correspondence and everyday errands alongside. / Unless something else is due today, I'd start with a supervisor email — a more contained task than either project. / Open a draft and write the subject line for one of them." |
| 3 | ✓ | ✓ | "What's floating around in your head — work, home, anything half-remembered? No need to put it in order." |
| 4 | ✓ | ~ | "What's the task?" → (insurance call) "Put the insurance number on screen — that's the first step, not the call yet. / Check their Sunday hours while you're there." |
| 5 | ✓ | ✓ | "Welcome back. Where did we end up?" |
| 6 | ✓ | ✓ | "We can start with what matters now, not reconstruct the last two weeks. / What's on your mind? It doesn't need to come out in order." |
| 7 | ✓ | ✓ · n/a (tools) | "I'm here. What are you working on?" → (chapter 3, 45 minutes) "Open chapter 3 and read the paragraph where you want to begin editing. I'm here while you work." |
| 8 | ✓ | ✓ · n/a (tools) | "Let's keep today small. One small thing can be enough. / Is there anything that genuinely needs your attention today?" |
| 9 | ✓ | ✓ · n/a (tools) | "Thesis and the extension email; deploy troubleshooting. / Dentist, desk, and the lamp wire thing. / Washington trip, and getting back to Sam. / I'd start with Priya—the extension could change how much room you have for the rewrite. / What date do you want to ask for?" |

**Why:**
- **1, voice ~:** "I'll help find the first physical move, not make you a plan" spends the user's attention announcing the help. "What's the thing?" alone does the job. The second turn is exactly right.
- **4, use ~:** the step is small and concrete, but she skips looking for what makes the call hard to make, which is the point of the scenario; run 1 found it ("not knowing what you'll say"). "Check their Sunday hours" isn't marked down: calling on a Sunday is practical context, and it saves a failed attempt.
- **6:** not marked down for "two weeks". It is the user's own number, and the sentence declines to reconstruct them rather than presenting the gap as debt. "We can start with what matters today" would be cleaner. Whether she names a gap at all is open question 17, where the persona and the model strategy's example disagree. Within the script, asking what's on their mind is right, because the context holds no intentions; in the app, the real test is whether she offers the relevance pass over stale items.
- **7–9, n/a (tools):** the right reply also starts a session (7), reports capacity (8) or files each item (9). The script can't show whether she would.
- **2 and 9:** she groups the pile without a count, picks one thing and says why.

### Run 4 — 2026-09-13 · all nine on OpenAI (`scripts/voice-eval.mjs`, `gpt-6-astra`, reasoning effort low, `store: false`, context = run at ~2:40am Vancouver, last seen 3h ago)
The first run after the switch (`decisions.md` → *Lumi runs on OpenAI*). The script has no tools, so scenario 9 can't capture. Cache: `cacheRead=2049` from the second call on, and the prefix is cached across scenarios. Output 9–105 tokens per reply.

**Graded by Claude (Opus 5), 2026-09-13, provisionally**, beside run 5 and on the same criteria: an assessment, not Chanté's approval, and not blind (see run 5). Left ungraded at first because the comparison has Claude in it. Being involved is a reason to grade blind on consistent criteria, not to abstain (open question 21).

| # | Voice | Use | Lumi said |
|---|---|---|---|
| 1 | ✓ | ~ | "Put the thing you need to work on in front of you—open the file, or set out the materials. / No need to do anything with it yet." → (grant report, due Monday) "Open the grant report file. Just read the last sentence you wrote. / At this hour, leave it at that for now." |
| 2 | ~ | ~ | "What's on your mind to get done? / Put it here in whatever order it comes — no sorting yet." → (the five things) "The thesis, supervisor emails, and camp website are tangled up with keeping yourself fed and booking the dentist. / At this hour, I wouldn't try to tackle the whole pile. / Is anything due tomorrow?" |
| 3 | ✓ | ✓ | "What's taking up space in your head — work, home, something you keep putting off? / No need to sort it before you say it." |
| 4 | ✓ | ~ | "What's the task?" → (insurance call) "At this hour, their phone line may be closed. / For now, just find their number. No call yet." |
| 5 | ✓ | ✓ | "Welcome back. Where did we end up?" |
| 6 | ✓ | ✓ | "We can work out what still matters and let the rest go. / What's in the pile? No need to sort it first." |
| 7 | ✓ | ✓ · n/a (tools) | "I'm here. What are you working on?" → (chapter 3, 45 minutes) "Open chapter 3 and read the last paragraph you edited. / I'm here while you work." |
| 8 | ✓ | ✓ · n/a (tools) | "Then one small thing can be the whole day's work. / At this hour, it can also wait until after sleep. Is anything needed before morning?" |
| 9 | ✓ | ~ · n/a (tools) | "Thesis rewrite and the extension email to Priya. / Dentist, lamp wire, desk. / Washington trip, Sam, and whatever's wrong with the deploy. / Anything else rattling around?" |

**Why:**
- **1, use ~:** the first reply prescribes a generic step before knowing what the thing is, so no diagnosis. The second turn is right, and at 2:40am "leave it at that" is in proportion to reality.
- **2, voice ~ / use ~:** "tangled up with keeping yourself fed" is an odd reading of *groceries*. She declines the whole pile, which fits the hour, but doesn't choose one thing, and ends on a question instead.
- **4, use ~:** the same as run 5. The clock line earns its place here (the office is closed), but she doesn't look for what makes the call hard to make.
- **8:** suggesting sleep at 2:40am is capacity and time used well, not a clock line for its own sake.
- **9, use ~:** holds the pile without a count, then asks for more ("Anything else rattling around?") instead of what's first or a pick.

**Runs 4 and 5 side by side (provisional):** run 5 chooses one thing where run 4 didn't (2, 9), and neither looks for the obstacle in 4. Some of the difference may be the brief, and some the clock: declining the pile at 2:40am is itself a good reply. These two runs can't tell those apart.

### Run 3 — 2026-09-12 (M5 persona: Focus Together section replaces "sessions aren't wired yet") · scenario 7, plus a live session
Prefix grew to 2476 tokens (persona + the two session tools); cached from the second call. Scenario 7 through the script (no tools available there): "Yeah. I'm here. / What are we working on?" → "Chapter 3 edit, 45 minutes. Good. / Where do you open it — top of the chapter, or somewhere you already know is broken?" — three asks, one at a time, no plan. ✓

Live, in the app (port 3007, `feat/m5-focus-together`), the moments the script can't reach:

| Moment | Grade | Lumi said |
|---|---|---|
| "Stay with me while I work on the lineage section? First step… Say 4 minutes." | ✓ | "Open the doc, read the last paragraph. I'm here." — one line, session opened with `approach: read the last paragraph first` |
| Check-in → *Got distracted* | ✓ | "Welcome back. Open the doc again — last paragraph, just read it." |
| Check-in → *Done* | ✓ / ~ | "Good — the last-paragraph trick held again. / Is the section itself finished, or just this stretch?" — the one allowed question (it decides whether to complete the intention); also called `confirm_belief` herself |
| End on the bar | ✓ | "Stopped. That's a real day's work for 20%." — no consolation, ties back to the capacity she knew |

### Run 2 — 2026-09-12 (after tuning) · scenarios 2, 6, 9 rerun
Persona additions: "never count their things back to them" and "use the local time only when it changes what you'd say"; context-block time line carries the same hint. Prefix grew to 1114 tokens; still cached from turn two.

| # | Grade | Notes |
|---|---|---|
| 2 | ✓ | Reflects the *shape* ("one big thing that's actually hard, a couple of small things you're avoiding…"), no count; closes with one question |
| 6 | ✓ | "Messes are allowed" is the mildest reassurance; acceptable. Offers the relevance pass without mentioning the gap |
| 9 | ✓ | Best reply of the set: sorts the dump into three groups without numbers, picks one two-line email, "Everything else keeps." |

### Run 1 — 2026-09-12 · all nine (`scripts/voice-eval.mjs`, `claude-opus-5`, effort low, context = Friday 11pm Vancouver, last seen 3h ago)
Cache: `cacheWrite=1013` on the first call, `cacheRead=1013` on every call after — the persona alone clears Anthropic's minimum cacheable prefix. Output 25–172 tokens per reply.

| # | Grade | Notes |
|---|---|---|
| 1 | ✓ | "What's the thing?" then, given a Friday-night grant report, asks whether it's tonight or bed. Right diagnosis, one question |
| 2 | ~ | Voice right, but reflected the list back as a numbered set and led with the time |
| 3 | ✓ | One orienting question |
| 4 | ~ | Good insight (phone calls: "not knowing what you'll say"), but opened with the clock again |
| 5 | ✓ | Exactly "Welcome back. Where did we end up?" |
| 6 | ✓ | "Welcome back. Nothing's owed." No counts; offers the pass |
| 7 | ✓ | Three things asked, then "45 minutes on chapter 3. I'm here. Go." |
| 8 | ✓ | "20% is what there is. Fine." One thing or stop |
| 9 | ✗ | "That's eight things" — a count, forbidden. Otherwise strong grouping |

Systemic finding: the local-time line in the context block was over-used (six of nine replies opened with the hour). Fixed in run 2.
