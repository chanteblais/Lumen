# QA Log

Running record of QA sweeps: what was tested, what was fixed, and — most useful for the next tester — what is *known and deliberate* so it doesn't get re-reported, plus where the remaining risk lives. Newest sweep first.

Format per sweep: `## Sweep <date> — <scope> (branch)` → `### Fixed` · `### Known and deliberate` · `### Open` · `### Highest-value manual tests`.

---

## Sweep 2026-09-12 (7) — Mail + Insights (`feat/email-insights`, shared checkout, port 3005)

### Verified
- `npm run check` (63 unit tests incl. `clampLeads` and Gmail parsing) and a production build compile every route. Signed-in pages could not be clicked through by Claude (the automation browser has no session); Chanté connected Google end to end and Insights read her mail live.
- Migration `0002_leads` applied by Claude (additive).

### Fixed (setup, not code)
- **Google "This app is blocked" on Connect Google.** Not the app: `.env.local` carried the old *rali* Clerk application's test keys, so every OAuth request went out under Clerk's shared Google client, which Google refuses for Gmail. Also a live key pair had been appended below the test pair (last line wins → "Production keys are only allowed for domain burlyman.ca" on localhost). Fixed with `clerk env pull --app <Lumen>` for the dev keys, the live pair commented out, and the `users` row re-keyed to the new Clerk user in one guarded transaction (the auto-created empty row deleted). See `architecture.md` → Env.
- On the way there, each of these also had to be true and was checked: Google consent screen in Testing with the account as a test user; both Clerk instances' callback URLs on the Google client; custom credentials on for the Development instance (Clerk's free plan briefly disabled one instance's connection when the other was enabled).

### Known and deliberate
- Google's Testing mode expires the refresh token after 7 days: Insights will show the connect chip again about weekly. One tap; not a bug.
- Insights looks at most once per 30 minutes per open; there is no refresh button on purpose (`ef-burden-log.md`).
- A lead's mail body is sent to the model once and never stored; only sender · subject · received-at · Lumi's line are kept.

### Open
- Lead quality (does Lumi pick the right things, phrase them as actions, skip noise) has had one live look; tune `core/ai/leads.ts` rules from real use.
- Chat side (`look_at_email`, `keep_lead`, `dismiss_lead`) verified by types and build only; try "anything in my email I need to handle?" and "did X reply?".

### Highest-value manual tests
- Insights → *Still needs doing* lands the item on Lists with the subject in the note; *Let it go* removes it; both gone on reload.
- After a week: the connect chip returns, one tap restores mail.

## Sweep 2026-09-12 (6) — M4 capacity, Not this, re-entry (`feat/m4-capacity`, worktree, port 3006)

### Verified (live, against the real database; the rows the sweep created were removed afterwards)
- **Not this → reason → Lumi → re-cut.** Tapping *Not this* on the Right now card swapped the buttons for "Fair. What's getting in the way?" and the six chips; *Too tired* landed in Chat as "Not this one: Respond to Kendra — too tired." and Lumi answered the reason in voice ("Too tired at 2 a.m. is just accurate. Nothing here needs tonight. Sleep. Kendra keeps, cat food keeps, the paper keeps."). The dev log showed `recut=declined`; `after()` wrote a `day_plans` row with `reason: declined` whose Right now was no longer Kendra, and Today showed the new path with a new day line on the next open.
- **Capacity prompt.** Hidden on the real page because a `capacity.reported` already existed today (from the earlier "20%" in chat) — correct, derived. With the prompt forced on locally: renders as one quiet line above the card; *Skip* posted to `/api/capacity`, wrote `capacity.asked {skipped: true}`, and the page refreshed. The *Lots* click did not register before the browser tab was taken over by another session (see Open), so the answer path is covered by unit tests only (`recutTodaysPlan`: re-cut + capacity recorded; no re-cut when normal-ish matches an unstated plan).
- Unit: 48 tests (declines vocabulary, capacity state and skip, declines-from-events, sitting/re-entry, `clampPlan` never returning a declined intention, context block re-entry + Just-now lines with no digits, re-cut reasons, planner inputs using the sitting's gap, the thirty-minute sitting).
- **Second pass, after Chanté's "chat feels fresh" ask (2:50 am):** Chat opens on the greeting card with quiet paper beneath it; scrolling up shows the whole evening; a typed message lands under the card and the reply streams in with the view following (no console errors). Today → *Not this* → *Keep it* closes the chips with nothing written; *Not this* → *Too big* lands in Chat, Lumi names the smallest piece and calls `update_intention` (ledger "Updated · Pick up cat food"), Lists shows the new first step, and Today re-cuts with the paper as Right now and cat food in After that. Lists and Settings render. Chanté's own *Not this* → *don't feel like it* earlier in the evening also re-cut correctly with a real first step this time.
- Cache: `cacheRead=0` on every turn tonight because turns were more than five minutes apart (the ephemeral TTL); `cacheWrite` is the persona+tools prefix each time. Not a regression.

### Fixed
- **Chat context said "First time here" on every turn.** The route compared `recordVisit`'s return value with the same field it had just returned. Now compares against `created_at`, and the sitting (newest `app.opened`) carries the real gap through the whole visit.
- **Fallback first step read wrong.** When the model's Right now is rejected (declined, unknown id, or null with candidates), the code-chosen first step was "Open it up and look at where you left off." — seen on "Pick up cat food". Now "The smallest first piece of it, nothing more.", and the planner is told to always pick one thing with a step that fits, even late or on a low day.

### Known and deliberate
- A declined intention can still appear in After that (the model decides; "too tired" is about now). It is never Right now again that day.
- *Normal-ish* on a plan cut without a report does not re-cut — nothing would change; the answer is still recorded.
- The capacity prompt does not show on a day with nothing to plan.
- Deleting the sweep's rows from `events` is the one exception to append-only, for test data only.

### Open
- **Re-entry not exercised live.** Simulating a 14-day gap means moving Chanté's `users.last_seen_at` and writing a fake `app.opened`; left as a manual test (SQL in the review checklist) rather than done to her data.
- The browser tab used for this sweep was navigated to port 3007 mid-test by another session (voice work in `lumen-voice`); Claude-in-Chrome tab groups are apparently shared across sessions. Check the tab's URL before every action.

### Highest-value manual tests
- On a day with no capacity said in chat: open Today → the prompt line shows → *Not much* → "Shaping the day around that…" → the path re-cuts to one thing + at most one After that; reload → same; the prompt is gone.
- Today → *Not this* → *Too big* → Chat: Lumi names a smaller piece (may `update_intention`); back on Today the Right now is something else.
- Re-entry: `update users set last_seen_at = now() - interval '14 days'` → open Chat → "It's been a minute. Want me to help figure out what's still relevant?" → "yes" → Lumi goes through the stale ones by name, drops what you release in one go, ends with one next step; no number anywhere; Today re-cut (`reason: reentry`) if anything was dropped.

## Sweep 2026-09-12 (5) — Voice in Brave (`feat/voice-local-whisper`, worktree, port 3007)

### Fixed
- **Voice never worked in Brave** ("Voice needs a network connection right now" every time). Measured: Brave's `SpeechRecognition.available({processLocally:true})` reports `downloadable` and `install()` sits at `downloading` forever — `brave://components` has no speech (SODA) component, while Chrome installs it in ~9s. No path through the Web Speech API. New local engine (`components/chat/voice/localEngine.ts` + `whisper.worker.ts`): an AudioWorklet captures 16 kHz PCM, a worker runs `whisper-base.en` via `@huggingface/transformers` on WebGPU. Verified with the real engine bundled into a harness in a throwaway Chrome, synthesized speech piped in as the microphone: first tap ~12s (model download), later taps 1.8s to *Listening*; live text every 4s; final pass 0.45s for a 12s take; transcript verbatim. Silent 6s take → "I didn't hear anything" (RMS gate), no invented words. Whisper *does* hallucinate on identical looped audio (19 repeats of one sentence) — a harness artefact, not a speech one; exact-match filter for its classic silence outputs ("you", "Thank you.").
- **Brave showed *Listening…* and the mic indicator but heard nothing** (Chanté). Two causes covered: (1) the `AudioContext` was created after `getUserMedia` resolved — when the permission prompt takes more than a few seconds the user gesture has expired and the context starts suspended, so the worklet gets silence. Now created inside the tap, resumed after the mic arrives, and refused if it still isn't running. (2) The default input device may be the wrong one (macOS offers a nearby iPhone as a Continuity mic): the silent-take line now names the device — *I didn't hear anything from "iPhone Microphone". Is that the right mic?* Re-verified in a throwaway Brave with speech piped in: 2.1s to *Listening*, live text at 4s intervals, verbatim final; silent take → the named line. Also resamples if a browser ignores the requested 16 kHz context rate.
- Web Speech engine re-verified through the same harness after the refactor: plain end restarts, no-speech line, foreign abort line, own stop quiet, two quick ends give up, not-allowed line.

### Known and deliberate
- Local engine re-transcribes the whole take on each live pass; takes are capped at five minutes. Fine for dictating a message, not for an hour of notes.
- The model comes from huggingface.co and the ONNX runtime's WASM from jsdelivr at runtime; the first tap in a browser needs a network connection and patience. No progress bar (one more thing to watch); the label says *Getting voice ready…*.
- Not verified in Chanté's own Brave profile (the Claude Chrome extension stopped responding mid-session and Brave can't be driven). The harness is the real engine code; the Composer wiring is type-checked and mirrors the speech path.

### Highest-value manual tests
- Brave: tap Voice, allow the mic, wait for *Listening…*, talk, tap stop → text appears; second tap is fast.
- Brave: tap Voice and stay silent → "I didn't hear anything" line.
- Chrome: unchanged behaviour (speech engine); `localStorage.setItem("lumen.voice","local")` + reload forces the Whisper path there for comparison.

## Sweep 2026-09-12 (4) — Voice stops on its own (`fix/voice-silent-stop`, port 3005)

### Fixed
- **Voice button switched itself off with no message.** `useVoiceInput` swallowed two recognition errors — `no-speech` and `aborted` — and every `end` dropped the listening state. Measured in Chrome 152 with a fake microphone: ~8s of initial silence fires `no-speech` then `end`; starting recognition in a second tab (or another app) fires `aborted` on the first. Both now surface one line in Lumi's voice; a plain `end` while the user still wants to listen restarts the session and keeps the transcript; two instant ends in a row give up with the generic line. Our own `stop()` still ends quietly. Verified through the real UI with an injected fake recognizer for every path (plain end → restart, result accumulates, no-speech, foreign abort, own stop, double quick end, not-allowed).

### Known and deliberate
- Chrome allows one recognition session per browser: tapping Voice in a second tab takes the mic from the first, which now says so. The first tab does not reclaim it.
- After `no-speech` Lumi stops rather than restarting forever: a mic that hears nothing should be noticed, not masked by a breathing icon.
- Not reproduced on Chanté's machine directly — the fix covers the two silent paths the browser can take; if the button still drops, the `[voice]` console warning names the error. Chanté's follow-up: Chrome works; Brave failed every time with "Voice needs a network connection right now" (Brave ships no speech-service keys). Hidden in Brave for one commit; superseded by sweep (5): the local engine.
- Chrome picked Chanté's iPhone as the microphone: macOS Continuity offers a nearby iPhone as an input device and the Web Speech API always uses the browser's default input. Change it under Chrome → Settings → Privacy → Site settings → Microphone, or System Settings → Sound → Input. No in-app picker (one more thing to set).

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
  → Closed 2026-09-12 in `2ab2f3b`: the kicker element passed from Home across the server/client boundary arrives as a lazy node; keying it silenced the warning.

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
