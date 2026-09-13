# QA Log

Running record of QA sweeps: what was tested, what was fixed, and — most useful for the next tester — what is *known and deliberate* so it doesn't get re-reported, plus where the remaining risk lives. Newest sweep first.

Format per sweep: `## Sweep <date> — <scope> (branch)` → `### Fixed` · `### Known and deliberate` · `### Open` · `### Highest-value manual tests`.

---

## Sweep 2026-09-13 (2) — page load: fewer round trips, and fresh on Back and on return (`fix/page-load-round-trips`, worktree, port 3006)

Chanté chose fewer waits over loading screens, "but make sure we reload when anything changes".

### Verified (dev server, signed in, from Vancouver against us-east-2; three warm runs each, same method as the sweep below)
- **Library** 0.32s → **0.17s**. **Today** first byte 0.35s → **0.24s** (complete 0.67s → 0.53s). **Home** 0.85s → **0.51s**. Each page still carried its content (Home's composer and greeting, Today's Right now card, the Library's scene); no errors in the server log.
- **The visit query returns the previous visit.** `UPDATE users … FROM users AS before … RETURNING before.last_seen_at`, run in a rolled-back transaction: the returned previous equalled the row's value before the update, the new stamp was now.
- **Back re-reads.** Library → Today by the nav link, then Back: the Library was shown and a fresh `/library?_rsc` request followed.
- `npm run check`: types, lint, 89 tests, route-auth (accepts `requireVisit()`), CSS prefixes.

### Known and deliberate
- **No cookie or token copy of the user.** Folding the lookup into the visit write took the round trip away without keeping a copy that could go stale.
- **Returning to a tab re-reads after a minute away, not every time.** Flicking between tabs doesn't cost a server render and a visit each time.
- The first request ever still takes the old two-step path (create the row, then stamp it).

### Open
- The refresh on returning to a tab isn't exercised by the automation tab (it is always hidden); read, not clicked.

### Highest-value manual tests
- On Today, open Home, tell Lumi you've done Today's Right now thing, press Back: Today shows the path without it (a moment after it appears).
- Leave a tab on the Library, use the companion bubble in another tab, come back after a minute: the page is re-read.
- A first visit after 30+ minutes away: Home still greets you as coming back.

## Sweep 2026-09-13 — page load: the database pool and the function region (`fix/db-pool-stall`, worktree)

Chanté: "the page loading is quite slow." Measured from her machine against the real pooler (scripts in the session scratchpad, not committed).

### Fixed
- **Queries over the pool size hung.** With every connection of a warm pool busy, `postgres` pipelines the next query onto a busy connection, and Supabase's transaction pooler (6543) never answers it. A warm pool of 5 given 6 parallel queries stalled in every trial with a 50ms query (75s+ when left), and in 3 of 4 with `select 1`; a cold pool (connections still opening) never stalled, and the session pooler (5432) never stalled. `max_pipeline: 1` still pipelines one query and still stalled. The snapshot (Today, and Home's background plan prime) sends 7 at once, and resolving a session 2 more. Now `max_pipeline: 0` and `max: 10`: 9 of 9 trials fine, including 16 queries on 10 connections and 14 chained sequences, the overflow waiting ~0.1–0.2s.
- **Functions ran in `iad1` (Virginia), the database is in us-east-2 (Ohio).** `vercel.json` → `regions: ["cle1"]` (Cleveland), from the next production deploy.

### Known and deliberate
- A page still makes 2–4 queries one after another before it renders (`requireUser`, `recordVisit`, then the page's own). Parallelising them or moving the visit write off the response is proposed to Chanté, not done: the visit write feeds the sitting that Home and Today read.
- Every page is rebuilt on every visit (`force-dynamic`, `staleTimes.dynamic` 0). Also proposed, not done.

### Open
- Lumi's sheet (`lumi-free.webp`, 866 KB) — Chanté is working on it.

### Highest-value manual tests
- Open Home, then Today straight away (Home's background prime and Today's snapshot overlap on the pool): Today shows its card without a long pause.
- Leave the app for 5+ minutes, come back to Today: one slow first page (the pool reopens), then quick.

## Sweep 2026-09-12 (8) — M5 Focus Together + session reflection (`feat/m5-focus-together`, worktree, port 3007)

### Verified (live, against the real database; `check_in_minutes` set to 1 for the sweep and restored to 15 after; the sweep's sessions, their events, and the two beliefs it created were removed afterwards)
- **Start → bar.** "Stay with me while I work on the lineage section? First step… Say 4 minutes." → Lumi called `start_focus_session` (goal, first step, `approach: read the last paragraph first`, the intention's id, 5 min) and said one line; ledger *Together · Intellectual lineage section of practicum paper · 5 min*; the bar appeared above the composer with *0 of 5 min* and End. Dev log: `tools=start_focus_session`.
- **Check-in → Yep.** At minute 1 the card appeared (*Still with it?* · Yep · Stuck · Got distracted · Done). Yep closed it with no message and no model call; `session.check_in {response: ok, minute: 1}` in events.
- **Check-in → Got distracted.** At minute 2: "Got distracted." landed as a user message, Lumi answered in one line, session still running; `session.check_in {distracted, minute: 2}`. Dev log: `session_event=distracted`, 25 output tokens.
- **Card steps aside.** Typing a message ("remember this: reading the last paragraph first…") while the card was up dismissed it; Lumi stored the strategy belief.
- **Check-in → Done.** At minute 5: session closed as `completed` in the route (`session.ended {completed, actual_minutes: 5}`), Lumi one line + one question, bar gone. `after()` ran reflection: `reflection.ran {session_end, ops: 1}`, the strategy belief's `evidence_for` moved, `users.last_reflected_at` set. Dev log: `session_event=done reflect=pending` then `[reflect] … ops=1`.
- **End on the bar.** Second session ("Kendra reply", no approach) → End → "Let's stop here." → closed `stopped_early`, `actual_minutes: 0`, Lumi one line, bar gone.
- **Abandoned session.** Third session (5 min) left open with no taps; reloading Chat eleven minutes later swept it (`session.ended {abandoned, actual_minutes: null}`), showed no bar, and greeted with "Good to see you, Chanté. / Looks like we left a session open on “Kendra reply.” Pick it back up, or let it go?" Saying "pick it back up" → Lumi started it again with the same goal and first step (see the line below the Fixed list).
- Unit: 76 tests (check-in timing and copy, session-from-transcript, abandonment threshold, context lines for running/last session and each tap, strategy matching across wordings, deterministic session ops, reflection clamps, the model-step threshold).

### Fixed
- **Reflection double-counted.** Lumi confirmed the strategy herself in the reply to Done (`by: lumi`) and reflection confirmed it again (`by: reflection`) — evidence 2 from one session. Beliefs touched during the session are now off limits to reflection.
- **Reflection over-reached on an 11-second session.** The stopped-early "Kendra reply" run confirmed the last-paragraph strategy (which it never used) and created a strategy at 0.25 from nothing. Now: a strategy gets evidence only from a session that used it (approach or first step — code-enforced), and a session that ended within a couple of minutes without finishing skips the model step.
- **Approach ↔ belief matching missed inflections** ("read the last paragraph first" vs "Reading the last paragraph first…"). Matching is now on lightly stemmed content words.
- **`reflection.ran` was stamped with the run's start time**, so it appeared before the ops it counted. Stamped at the end now.
- **"Pick it back up" didn't.** With the abandoned session's start still visible in the transcript, Lumi answered "Already running." The context block now leads with "No focus session is running now — even if the transcript above shows one being started" and spells out that a yes means `start_focus_session` again with the same goal and first step.
- **A short session heard nothing at its end.** Chanté's own first session (compost, 5 min) with the default 15-minute interval would have had its first check-in at minute 15. The planned end now counts as a check-in when it comes before the next interval.
- **Start with Lumi didn't reliably start.** Chanté's own test (compost, 5 min): the first tap opened a session, but with the old timer nothing asked her anything at 5 min; she tapped again from Today and Lumi only talked ("Still running…", correct but invisible from Today); after the sweep closed it as abandoned her next tap got "Something's looping on your end. Want me to close it and start fresh…?" — the route never told Lumi the message was a button, so the repeated "Let's start" lines read as a loop. The route now hands the context block a *Just now* line for `start_intention` (title, Today's first step, estimate, "this is the start itself — call start_focus_session"), with the running-on-this / running-on-another cases spelled out. Verified by replaying the exact turn server-side against her account with the real tools (`scripts/_sim-start.mjs` pattern, not committed): Lumi called `start_focus_session` ("Fresh one running. Tie the bag — I'm here.").
- **Abandoned sessions were never reflected on** (the sweep isn't a chat turn). The Chat page and the next chat turn now hand a just-abandoned session to reflection, which runs once per session.

### Known and deliberate
- A session's planned minutes are what Lumi passed (she rounded "4 minutes" up to the tool's minimum of 5).
- After Done, Lumi may ask one question ("Is the section itself finished, or just this stretch?") — it decides whether she completes the intention; the persona allows exactly that one.
- Starting a session while one runs closes the old one as `stopped_early` (and reflects on it); there is no "are you sure".
- The check-in timer lives in the tab: a backgrounded tab fires late, a closed tab not at all; the server's only view is the abandonment sweep. Fine for V1.
- Message metadata (`session_event`, `declined`, …) is not persisted; a reloaded transcript shows the visible words only. The events table holds what happened.
- The Next dev overlay showed "1 issue" during the sweep: a transient HMR error between two edits of `reflect.ts`, gone on reload.
- Lumi may call `end_focus_session` on a session that is already closed (she did, on the abandoned one, before starting fresh); the tool answers `no session running` and nothing else happens.
- The browser test was cut short: another session's Google sign-in switched the shared automation browser to a second account, which created a second `users` row (`62d0a68a…`, "Chanté", 12:17Z, one two-message conversation). Left in place — it is a real sign-in, not test data. The Today Right now card does not show that a session is running (Chat only, by decision); a second *Start with Lumi* tap therefore looks like nothing happened until Chat opens — worth a UX-review row.
- Deleting the sweep's rows is the one exception to append-only, for test data only.

### Open
- The 20-minute done-when session was run as a 5-minute one at a 1-minute interval; a real-length session with the default 15-minute interval is the manual test below.
- The planned-end check-in (fix above) is covered by unit tests only: it landed while Chanté's own 5-minute session was already running, the tab that had it open kept its earlier timer (Fast Refresh did not reschedule it), and starting a fresh short session would have closed hers. Manual test 1 below covers it.
- Whether the abandoned greeting should also fire when a session goes quiet in a *still-open* tab (currently the sweep only runs on a request).

### Highest-value manual tests
1. From Today, *Start with Lumi* on the Right now card → Lumi settles the three things from what she already knows → a 45-minute session with the 15-minute check-ins; Yep twice, Done once.
2. Leave a session open, close the tab, come back after twice its length → greeting offers it back; say "pick it back up" → a new session with the same goal.
3. Say "I'm done" in words during a session → `end_focus_session` → ledger *Session closed · goal*.

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
