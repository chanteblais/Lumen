# Voice Eval Log

Scripted scenarios run against Lumi's persona (`src/core/ai/persona.ts`), what was off, and what changed. Newest first. The scenario list is the nine situations in `product.md` plus anything that came up in real use.

**This log is design evidence** for [`docs/philosophy/lumi.md`](philosophy/lumi.md) (§15). When a reply is especially good or bad, name the behaviour behind it there. Since 2026-09-13 Lumi's model is under evaluation ([model strategy](product/lumi-model-strategy.md)), so every run names the model it used, and comparison runs grade each model on the same scenarios.

**Grading (manual, per reply):** ✓ in voice · ~ slightly off (note why) · ✗ wrong register. Watch for the classic failures: over-reassuring, over-planning (a list where a step would do), therapy-speak, exclamation marks, restating feelings, offering three options, lecturing.

---

## Scenarios

| # | Prompt | What good looks like |
|---|---|---|
| 1 | "I know what I need to do but I can't start." | Diagnose unclear-vs-initiation; one physical step; wait |
| 2 | "I have too many things and don't know what to prioritise." | Hold the dump; pick one; no full ranking |
| 3 | "I don't even know what I need to do." | Ask one orienting question; no framework |
| 4 | "I've been avoiding this all day." | Name it lightly; smallest threshold; maybe humour |
| 5 | "I got distracted." | "Welcome back. Where did we end up?" — no absolution speech |
| 6 | "Haven't opened this in two weeks, everything's a mess." | Offer the relevance pass; no counts |
| 7 | "Just stay with me while I work." | Three questions: what, first step, how long; then quiet |
| 8 | "I only have about 20% today." | Match capacity; one small thing; call it enough |
| 9 | Unstructured brain dump (5+ items) | Capture silently via tools; reflect back one line; ask what's first |

---

## Runs

Run with `node --env-file=.env.local --import tsx scripts/voice-eval.mjs [n]` — real model, same persona + context block as production, no database. Paste the transcript highlights and the grade per scenario below, newest first.

### Run 5 — 2026-09-13 · all nine on OpenAI with Lumi's brief in the prefix (`gpt-6-astra`, reasoning effort low, `store: false`, context = run at ~noon Vancouver on a Sunday, last seen 3h ago)
The first run with [Lumi's brief](philosophy/lumi-brief.md) (the canon synthesised for her) placed after the persona's opening paragraph (`decisions.md` → *Lumi carries the philosophy*). Same script and scenarios as run 4, so the two can be read side by side, though run 4 was at 2:40am and this one at noon, and the time of day changes several replies. **Not graded** (Chanté's call, as with run 4). The script has no tools, so scenario 9 can't capture. Cache: the prefix is 3,994 tokens, cached from the second call (run 4: 2,049). Output 9–158 tokens per reply.

| # | Grade | Lumi said |
|---|---|---|
| 1 | | "What's the thing? I'll help find the first physical move, not make you a plan." → (grant report, due Monday) "Open the grant report file—or a blank document if there isn't one yet. Nothing to write yet." |
| 2 | | "Tell me what's on your plate — messy is fine. If anything has a firm deadline, include it." → (the five things) "The thesis and camp website are the bigger pieces, with correspondence and everyday errands alongside. / Unless something else is due today, I'd start with a supervisor email — a more contained task than either project. / Open a draft and write the subject line for one of them." |
| 3 | | "What's floating around in your head — work, home, anything half-remembered? No need to put it in order." |
| 4 | | "What's the task?" → (insurance call) "Put the insurance number on screen — that's the first step, not the call yet. / Check their Sunday hours while you're there." |
| 5 | | "Welcome back. Where did we end up?" |
| 6 | | "We can start with what matters now, not reconstruct the last two weeks. / What's on your mind? It doesn't need to come out in order." |
| 7 | | "I'm here. What are you working on?" → (chapter 3, 45 minutes) "Open chapter 3 and read the paragraph where you want to begin editing. I'm here while you work." |
| 8 | | "Let's keep today small. One small thing can be enough. / Is there anything that genuinely needs your attention today?" |
| 9 | | "Thesis and the extension email; deploy troubleshooting. / Dentist, desk, and the lamp wire thing. / Washington trip, and getting back to Sam. / I'd start with Priya—the extension could change how much room you have for the rewrite. / What date do you want to ask for?" |

**What to look at (Claude's notes for Chanté's grading, not grades):** scenario 6 now takes up the canon's *we don't need to reconstruct* line in its own words, and names the length of the gap by echoing the user's "two weeks" (whether she may name a gap's length is open question 17). In scenario 1, "not make you a plan" explains her method, which the persona says she never does. Scenarios 2 and 9 each group the pile without a count, then pick one thing and say why.

### Run 4 — 2026-09-13 · all nine on OpenAI (`scripts/voice-eval.mjs`, `gpt-6-astra`, reasoning effort low, `store: false`, context = run at ~2:40am Vancouver, last seen 3h ago)
The first run after the switch (`decisions.md` → *Lumi runs on OpenAI*). **Not graded:** Claude doesn't judge a comparison with Claude in it (open question 21), so the replies are here verbatim for Chanté. The script has no tools, so scenario 9 can't capture. Cache: `cacheRead=2049` from the second call on, and the prefix is cached across scenarios. Output 9–105 tokens per reply.

| # | Grade | Lumi said |
|---|---|---|
| 1 | | "Put the thing you need to work on in front of you—open the file, or set out the materials. / No need to do anything with it yet." → (grant report, due Monday) "Open the grant report file. Just read the last sentence you wrote. / At this hour, leave it at that for now." |
| 2 | | "What's on your mind to get done? / Put it here in whatever order it comes — no sorting yet." → (the five things) "The thesis, supervisor emails, and camp website are tangled up with keeping yourself fed and booking the dentist. / At this hour, I wouldn't try to tackle the whole pile. / Is anything due tomorrow?" |
| 3 | | "What's taking up space in your head — work, home, something you keep putting off? / No need to sort it before you say it." |
| 4 | | "What's the task?" → (insurance call) "At this hour, their phone line may be closed. / For now, just find their number. No call yet." |
| 5 | | "Welcome back. Where did we end up?" |
| 6 | | "We can work out what still matters and let the rest go. / What's in the pile? No need to sort it first." |
| 7 | | "I'm here. What are you working on?" → (chapter 3, 45 minutes) "Open chapter 3 and read the last paragraph you edited. / I'm here while you work." |
| 8 | | "Then one small thing can be the whole day's work. / At this hour, it can also wait until after sleep. Is anything needed before morning?" |
| 9 | | "Thesis rewrite and the extension email to Priya. / Dentist, lamp wire, desk. / Washington trip, Sam, and whatever's wrong with the deploy. / Anything else rattling around?" |

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
