# Voice Eval Log

Scripted scenarios run against Lumi's persona (`src/core/ai/persona.ts`), what was off, and what changed. Newest first. The scenario list is the nine situations in `product.md` plus anything that came up in real use.

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
