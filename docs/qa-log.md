# QA Log

Running record of QA sweeps: what was tested, what was fixed, and — most useful for the next tester — what is *known and deliberate* so it doesn't get re-reported, plus where the remaining risk lives. Newest sweep first.

Format per sweep: `## Sweep <date> — <scope> (branch)` → `### Fixed` · `### Known and deliberate` · `### Open` · `### Highest-value manual tests`.

---

## Sweep 2026-09-12 (4) — Voice stops on its own (`fix/voice-silent-stop`, port 3005)

### Fixed
- **Voice button switched itself off with no message.** `useVoiceInput` swallowed two recognition errors — `no-speech` and `aborted` — and every `end` dropped the listening state. Measured in Chrome 152 with a fake microphone: ~8s of initial silence fires `no-speech` then `end`; starting recognition in a second tab (or another app) fires `aborted` on the first. Both now surface one line in Lumi's voice; a plain `end` while the user still wants to listen restarts the session and keeps the transcript; two instant ends in a row give up with the generic line. Our own `stop()` still ends quietly. Verified through the real UI with an injected fake recognizer for every path (plain end → restart, result accumulates, no-speech, foreign abort, own stop, double quick end, not-allowed).

### Known and deliberate
- Chrome allows one recognition session per browser: tapping Voice in a second tab takes the mic from the first, which now says so. The first tab does not reclaim it.
- After `no-speech` Lumi stops rather than restarting forever: a mic that hears nothing should be noticed, not masked by a breathing icon.
- Not reproduced on Chanté's machine directly — the fix covers the two silent paths the browser can take; if the button still drops, the `[voice]` console warning names the error. Chanté's follow-up: Chrome works; Brave failed every time with "Voice needs a network connection right now" (Brave ships no speech-service keys). Voice is now hidden in Brave (`navigator.brave`), like Firefox.
- Chrome picked Chanté's iPhone as the microphone: macOS Continuity offers a nearby iPhone as an input device and the Web Speech API always uses the browser's default input. Change it under Chrome → Settings → Privacy → Site settings → Microphone, or System Settings → Sound → Input. No in-app picker (one more thing to set).

### Open
- Voice is Chrome/Safari/Edge only while it rides on the browser's cloud recognition. A server-side transcriber (the hook's surface was designed for the swap) would bring Brave and Firefox in.

### Highest-value manual tests
- Allow the mic, tap Voice, say nothing for ten seconds → "I didn't hear anything…" line, button off.
- Tap Voice, talk for a minute or two with pauses → stays listening; text keeps accumulating.
- Tap Voice in two tabs → the first shows the "another tab" line.

## Sweep 2026-09-12 (3) — Today latency (`fix/today-latency`, worktree, port 3006)

Chanté: "the app is quite slow, particularly Today." Measured from her machine: Clerk `currentUser()` ~200ms, a warm query to the Supabase pooler (us-east-2) 65–110ms, a fresh connection ~500ms, the snapshot's five queries on a cold pool ~460ms, first plan generation of the day several seconds — all serial, all before Today could show more than the skeleton.

### Fixed
- **Clerk profile fetched on every server render.** `requireUser` awaited `currentUser()` before looking up the row; the name is only needed to create it. `ensureUser` now takes the name as a lazy function. ~200ms off every page and every chat turn.
- **Plan generation on Today's critical path.** `ensureTodaysPlan` (shared) is primed in `after()` on the home page and after each chat turn, so Today usually finds the plan persisted. An in-flight map stops a prime and a page racing into two generations.
- **Empty plan going stale.** Priming on open means the plan can be cut before the day's first brain-dump; a plan with no Right now / After that is re-cut once intentions exist (`first_items`). Plans that already have a Right now are never regenerated here.
- **Pool cold-started after 20s idle.** `idle_timeout` 20 → 300s.

### Known and deliberate
- Opening Today first, on a new day, with no earlier home/chat visit, still generates on the page (skeleton streams meanwhile). Priming covers the normal entry order.
- On Vercel, `after()` runs in the same invocation after the response; priming adds nothing to the reply time but does extend the function's runtime.
- Dev-mode first hit of a route still pays a Turbopack compile — one-off per route per server start, not an app property.

### Highest-value manual tests
- Sign in → Chat → Today: Today's path appears with no skeleton wait (plan was primed on the Chat open).
- New day (or delete today's `day_plans` rows): open Chat with nothing open → brain-dump three things → Today shows a Right now (plan re-cut as `first_items`, visible in `day_plans.reason`).
- Reload Today twice: same Right now both times.


## Sweep 2026-09-13 — M3 (`feat/m3-intentions`, worktree, port 3007)

### Verified (live, against the real database, test rows removed afterwards)
- Brain dump of four items + a stated preference: one reply in voice, four `create_intention` calls with lists and estimates, one `remember`, one `report_capacity` (inferred from the earlier "20%" in history), ledger lines rendered. Turn took ~17s at effort low with two steps.
- Today: first open generated and persisted the plan (low capacity → one After-that), reload showed the same task; ticking Right now promoted the next item without regenerating.
- Lists: items grouped under Lumi's chosen lists with estimates and next actions.
- Start with Lumi: lands in Chat with the visible handoff message sent and Lumi in initiation mode.

### Fixed
- Promoted Right-now task rendered as already ticked: the circle kept local state across a prop change → keyed by intention id.
- Handoff from Today never sent: `router.replace` re-rendered the page mid-request, and dev StrictMode's double mount aborted the first attempt while a ref blocked the second → `history.replaceState` + a deferred send with cleanup.

### Known and deliberate
- "Practicum paperwork due today at 5pm" just after midnight: Lumi asked which day rather than guessing a due date; no `due_at` set until answered.
- Plan generation takes several seconds the first time each day; the page streams a skeleton meanwhile.

### Open
- Dev console: one React "unique key" warning attributed to `Conversation` ("passed a child from Home"). Every `.map` in the chat components is keyed; source not found yet. Dev-only, no visible effect.

## Sweep 2026-09-12 (2) — M2 review findings (`feat/m2-voice-layout`, worktree)

### Fixed
- **Layout shifted after navigating away and back; composer below the fold.** The page was a normal document that grew with the transcript, so the composer's position depended on content length. Now the shell is viewport-height, the transcript scrolls in its own region, and the composer is docked at the bottom on every load. Verified: Chat → Today → Chat renders identically.
- **Quick-start chips vanished after the first message, so they couldn't be tested.** They now follow the sitting rule (hidden only while there's a message from the last six hours) and return on the next visit.
- **Voice button did nothing.** Was a placeholder for M7; voice input is now live via the Web Speech API. Add file / Tools removed until they do something.

### Known and deliberate
- The corner companion (`LumiCompanion`) is hidden under 768px: with the composer docked at the bottom it would overlap the send button on phones.
- Voice needs the browser's microphone permission; the first click prompts. In browsers without `SpeechRecognition` (Firefox) the button doesn't render at all.
- Transcription is appended to whatever is already typed and never auto-sent.

## Sweep 2026-09-12 — M2 conversation (`feat/m2-conversation`)

### Verified
- One real turn through the UI: streamed reply in voice, user + assistant rows persisted with UUID ids, `cacheRead=1013` on the first UI turn (shares the prefix with the eval run). Reload renders history from the database; card compacts and chips hide once there are messages. Test rows deleted afterwards.
- Voice eval: nine scenarios, two tuning changes, three reruns — `docs/voice-eval-log.md`.

### Known and deliberate
- The client sends only the newest message; two tabs open on the same conversation won't see each other's turns until reload (no live sync in V1).
- `sendReasoning: false` — thinking never reaches the client or the database.
- Quick starts hide after the first message; the "another way in" button sends "I don't know where to start."

### Open
- Abort mid-stream persists whatever text arrived (by design) but the UI has no stop button yet (M7 polish).
- Very long replies aren't clamped; the persona keeps them short in practice.

## Sweep 2026-09-11 — M0 static shell (`feat/m0-shell`)

### Fixed
- `LayoutProps` global type missing under bare `tsc` → `npm run typecheck` now runs `next typegen` first.
- Unescaped apostrophes in placeholder copy (eslint `react/no-unescaped-entities`).

### Known and deliberate
- Chips, composer send, and tool links do nothing (M0 is static).
- Greeting name is a constant (`DEV_NAME`) until M1 auth.
- ~~Lumi avatar is a monogram, not the hooded figure.~~ Fixed 2026-09-11: sprite sheets in `public/lumi-heads.png` / `public/lumi-body.png`.
- The Next dev indicator ("N" bottom-left) is dev-only.

### Open
- Mobile layout (<768px) not visually verified — Chrome refused to resize below its minimum window width. Check in DevTools device mode.

### Highest-value manual tests
- Landing page at 1440 and 390 wide; nav highlight on each route; composer grows with multi-line input.
