# Feature Map

Every page and feature: who it's for, what it does, key states. Grows with each milestone; keep entries current in the same commit as the code.

---

## Navigation

Sidebar (`components/shell/Sidebar.tsx`), numbered, present on every page:

```
Lumi   01 Chat · 02 Today · 03 Library · 04 Insights · 05 Settings
```

- Active route highlighted via `aria-current="page"`.
- Mobile (<768px): sidebar collapses to a top strip with the wordmark and nav names.
- Nav carries **no counts, no badges, no dots** — by design (`design-philosophy.md` §3.2).
- Decided 2026-09-12: V1 nav is **Chat · Today · Lists · Settings**; Chat stays the homepage (`today.md` → Decisions). Library and Insights leave the nav when Lists lands (M3). **Insights returns the same day** with a real job — what Lumi noticed in the mail — so the nav is **Chat · Today · Lists · Insights · Settings**.

**Lumi in the corner** (`components/shell/LumiCompanion.tsx`): full figure standing on the bottom-right edge of every page — breathing, blinking, and now and then a slow sway or a glance down at her foot and a playful scuff of it — one pose, small movements. Still under reduced-motion. **Tap her and a speech bubble opens** (`CompanionBubble.tsx`): one text box (*Tell Lumi…*), Enter sends, so you can say "add take out compost" from Today or Lists without leaving the page. The message goes through `/api/chat` like any other, so it lands in the main conversation; what you said slides in as a bubble of its own, Lumi blinks, and the box reads *Lumi's on it…* until her reply and the ledger of what she did show beneath; the page underneath refreshes once the turn has landed. Escape, a click elsewhere or a tap on her closes it; nothing is kept. On Chat, tapping her just focuses the composer. Hidden with her under 768px. In development only, a strip of small buttons above her (sway · foot · blink) cues each variation on demand so it can be checked without waiting for the schedule, and folds away behind a small handle when not wanted; it never ships.

---

## Auth

Protected-first (`src/proxy.ts`): every route requires sign-in except `/sign-in` and `/sign-up`. `requireUser()` (`src/lib/auth.ts`) resolves the Clerk session to the internal `users` row — created lazily on first visit with the Clerk first name and the browser timezone (cookie `lumen_tz`, set by `TimezoneCapture` in the layout; a first visit refreshes once so "today" is right). `recordVisit()` bumps `last_seen_at` and returns the previous value for the greeting. No onboarding screen: signing in *is* onboarding.

## Pages

### Chat (`/`) — the soft landing

**Who:** Signed-in users.
**What:** The conversation with Lumi. The only surface that matters in V1.

- **Greeting** (`components/chat/Greeting.tsx`, a chapter opening on bare paper — headpiece, portrait, title line, second line, chips; no box — see `design-system.md`) — two lines from `core/ai/greeting.ts` (deterministic, no model call): recognition ("Good to see you, Chanté.") + somewhere to begin. The blank question ("What are we working with today?") is asked **once** — only while there is no conversation to pick up. After that the second line continues from the last thing said, by *when* it was in the user's own calendar, never by what is undone: same day → "Welcome back, Chanté." / "Where did we end up?" (within five minutes: "Still here."); yesterday → "Picking up from yesterday. What's first today?"; two to six days → "It's been a few days. Where did we leave things?"; a week or more (by visit *or* by conversation) → "It's been a minute. Want me to help figure out what's still relevant?"; abandoned session ("Looks like we left a session open on…", M5) comes first. The visit gap is the one this *sitting* began after (M4: derived from the newest `app.opened`), so opening Today first and then Chat still gets the re-entry line; it stays until you've said something this sitting.
- **Coming back** (M4) — on a re-entry sitting the context block tells Lumi the greeting offered the pass, on every turn of the visit; saying "yes" (or asking) runs it: the stale intentions by name in one short pass, drops in one go, one suggested next step, never a count. Letting things go re-cuts Today's path (`reason: reentry`).
- **Not this, answered** (M4) — the six quick answers from Today arrive as one visible message ("Not this one: *title* — too big.") with the reason in metadata; the route records `intention.declined`, the context block carries the reason under *Just now*, and Lumi answers the reason (persona → Not this: smallest piece · easiest win · one clarifying question · no persuasion · what instead · "Fair."). The path is re-cut around it after the reply, without narration.
- **Lumi knows what you just did on the pages** (2026-09-12, Chanté's ask: she ticked something off by mistake, asked Lumi to add it back, and Lumi asked what it was) — every turn's context block carries *Recent changes*: the last 36 hours of intention changes wherever they happened, each with who did it (*they ticked "X" done on Today or Lists* vs *you marked "X" done*), the id, and where the thing stands now; *Recently done* carries ids too. The persona says: "the one I just checked off" is in there — act on it, don't ask. The new `reopen_intention` tool puts a done or dropped thing back (ledger line *Back on the list · title*) instead of creating a duplicate. Nothing to maintain: the events already existed.
- **Asking reshapes Today** (2026-09-12, Chanté's ask: "I need an easy task" got an easy task in chat, but Today stayed as it was) — when the user asks for a different shape of day ("something easy", "quick wins", "what should I do now", a replan), Lumi picks the thing in her reply and calls `reshape_today` with the ask and her pick; after the reply, Today's path is re-cut around the ask (`reason: asked`) with her pick pinned as Right now, so the page shows what she just said (ledger line *Reshaped Today · something easy*). The pin wins over a decline earlier today. Not narrated; nothing new to maintain — the ask is words the user already typed.
- **Quick starts** — Help me choose · Break it down · Body double · Just talk, plus "another way in" (sends "I don't know where to start."). Each chip sends its own label as the user message — the user sees exactly what they tapped — and the persona knows what each means. Shown until you've said something *this sitting* (no message in the last thirty minutes — `isInSitting`, the same gap that starts a visit in the events), then the greeting compacts to a running head; they return next time you come back.
- **Ledger lines** (`components/chat/Ledger.tsx`) — under a reply, a quiet ✦ line per thing Lumi did: *Noted · title · list*, *Done · title*, *Back on the list · title*, *Let go · title*, *Remembered · …*, *Today · not much*. Rendered from tool parts.
- **Every open feels fresh** (M4, Chanté's ask) — the transcript is in two parts: everything that was there when the page opened, then the greeting (a chapter head: headpiece ornament, portrait, title line), then what you say now. The page opens scrolled to the greeting, so Chat reads as new each time you come to it, and the earlier conversation is one scroll up, untouched. From your first message on, it follows the newest line like any chat. The greeting is full (with quick starts) after thirty minutes of quiet, compact within a sitting. The date rules between messages keep their six-hour window.
- **Conversation** (`components/chat/Conversation.tsx`, `useChat`) — the transcript around the greeting. User lines right-aligned on paper-deep; Lumi lines with a 36px avatar. A fine rule with "Yesterday" / "3 days ago" separates messages more than six hours apart. A reply's text blocks (a line, then a tool call, then another line) render as separate paragraphs, not run together. While Lumi is thinking, three slow dots. Errors render as one line in Lumi's voice ("I lost the thread for a second. Say that again?"). The last 30 messages load on page open; the client sends only the new message and the server holds the transcript.
- **Composer** — pinned to the bottom of the viewport; the transcript above scrolls in its own region (`.chat-page` / `.chat-scroll` / `.composer-dock`), so the input is always in reach and the layout is identical on first load, after a turn, and after navigating away and back. Auto-growing textarea, `+`, send. Enter sends, Shift+Enter newlines; disabled while a turn streams.
- **Voice** (`useVoiceInput`, `components/chat/voice/`) — the mic link under the composer toggles listening; the composer border turns brass and the placeholder says "Listening…". Transcribed text lands in the textarea (appended to anything already typed) for the user to read and send — nothing is sent automatically. Two engines behind the one button, chosen automatically: the browser's **Web Speech API** (Chrome, Safari, Edge), or **Whisper running locally** in a worker (Brave, Firefox — Brave exposes the API but ships no speech service behind it, so every session failed with `network`). The local engine asks for the mic, then loads the model while already capturing, so nothing said during the wait is lost; states are *Getting voice ready…* (first tap downloads ~90 MB once; afterwards under two seconds) → *Listening…* (text refreshes every ~4 s) → *Writing that down…* (one final pass, under a second). Audio never leaves the device. A silent take says "I didn't hear anything from ‹mic name›. Is that the right mic?" rather than inventing words — the name is there because macOS may have picked a nearby iPhone. The Web Speech engine treats the tap as intent and outlives the browser's own session ends: a plain end restarts quietly and keeps the transcript; a session that ends instantly twice gives up with one line. Microphone blocked, no network, ~8s of silence (`no-speech`), or another tab/app taking the mic (`aborted`) → one line in Lumi's voice under the composer, never a silent switch-off. Every recognition error is `console.warn`ed as `[voice]`; `localStorage.lumen.voice = "local" | "speech"` forces an engine for testing. The microphone is the browser's default input device (Chrome: `chrome://settings/content/microphone`; macOS may offer a nearby iPhone as a Continuity mic) — the page cannot choose one, and we don't add a picker.
- **Tool links** — Add file · Voice · Tools. M0: visual. Voice lands in M7; Add file and Tools are placeholders (may be cut).
- **Status:** M0 built 2026-09-11 (static). M1: greeting uses the signed-in first name and the real visit gap. M2 (2026-09-12): live conversation with `claude-opus-5`, persisted; no tools yet — Lumi says so if asked to remember or track something. Avatar is Lumi's head (neutral) from `mockups/lumi.png` as of 2026-09-11.

### Today (`/today`) — spec: `today.md` — **built M3 (2026-09-12); capacity + Not this M4 (2026-09-12)**

**Who:** Signed-in.
**What:** Answers *what should I be doing right now?* Greeting by time of day, Lumi's one-line read of the day, one dominant **Right now** card (title, list + estimate pills, the first physical step, **Start with Lumi**, **Not this**, *Break it down*), up to three **After that** rows, **Later** (fixed-time commitments only), and "everything else can wait." The plan is generated once per day — primed in the background when the app is opened or a chat turn ends, so the page usually finds it ready; otherwise generated on first open, streamed in under Suspense with a skeleton — persisted, and stable across reloads (an empty plan is re-cut once intentions exist); ticking the circle on any row completes it and advances the path. Asking in Chat for a different shape ("something easy") re-cuts the path around the ask after Lumi's reply, with the thing she named as Right now. **Start with Lumi / Break it down** are links into Chat that send a visible message ("Let's start: *title*") with the intention id in metadata.

- **Capacity prompt** (`components/today/CapacityPrompt.tsx`, M4) — one quiet line above the card, *How much have we got today?* — Not much · Normal-ish · Lots · Skip. Shown only when today has no capacity report (from here or from chat), hasn't been skipped today, and there is a path to shape. Answering posts to `/api/capacity`, shows "Shaping the day around that…" while the path is re-cut (a few seconds), and the page refreshes with the new Right now; *Normal-ish* on a plan that already assumed normal changes nothing. Skip records `capacity.asked` and the line goes away for the day. Never blocking, never a metric.
- **Not this** (`components/today/RightNowActions.tsx`, M4) — tapping it swaps the button row for Lumi's fixed question, *Fair. What's getting in the way?*, and six chips: Too big · Too tired · Don't know how · Don't feel like it · Something else is more important · Just nope, plus a quiet *Keep it* to close. A chip hands off into Chat (`/?decline=<id>&reason=<key>`) as one visible message with the reason; Lumi replies to it and the path is re-cut around the answer (the declined thing is never Right now again today). Resistance adapts the plan; nothing is recorded as failure.
- A page open counts as a visit (`recordVisit`), so a sitting can begin on Today.

### Lists (`/lists`) — spec: `today.md` → Lists — **built M3 (2026-09-12), minimum**

**Who:** Signed-in.
**What:** The pile. Open intentions grouped by list (School · Work · Personal · Later by default; `users.preferences.lists`), two columns; each row is a complete circle, the title, the next action if any, and estimate/due pills. No per-list counts. One **Add something** chip → Chat with the composer prefilled ("Add to my list: "). Moving between lists and renaming lists happen in conversation for now; drag/reorder later.

### Insights (`/insights`) — **built 2026-09-12** (`feat/email-insights`, migration `0002`)

**Who:** Signed-in, with Google connected.
**What:** Lumi has looked through your recent mail and asks one question: **Do any of these still need doing?** Each thing she noticed is a card — what might need doing in your terms ("Reply to Priya about the draft"), her one line on why ("Priya asked for it by Friday"), and a quiet label with sender · subject · when (and the date, if the mail named one). Two answers: **Still needs doing** (it lands on your list, with the mail's subject in the note, in the list Lumi guessed) and **Let it go**. Answered cards show *On your list.* / *Let go.* and are gone on the next open. When there is nothing: "Nothing in your recent mail that needs you." and a tailpiece. Under the question, one label: *Just looked.* / *Last looked 20 minutes ago.* — never how many messages, never how many things.

- **Connecting** — without Google: "I can look through your recent mail for things that might need doing." + "Read-only. I keep a line per thing I notice — never the mail itself." + **Connect Google** (`lib/auth-mail.tsx`: Clerk's Google connection asking for the read-only Gmail scope, back here after). Google connected without the mail scope: "Google's connected, but not the mail part yet." + **Allow mail**. Connection let go by Google: the chip again, with a line saying so. Disconnecting is the account button → Connected accounts (Clerk's panel).
- **Looking** happens on open, only when the last look is older than 30 minutes, streamed under Suspense ("Having a look through your recent mail…"); a few seconds the first time (up to 30 messages, one model call), usually nothing after. The first look covers the last 7 days; later looks pick up where the last one stopped. Promotions and social are skipped. Nothing is stored but the cards.
- **In chat**, the same things are in Lumi's context (*Their mail*), so "anything in my email I need to handle?" gets an answer from what she noticed, and "did Priya reply?" makes her look (`look_at_email`). Keeping or letting go in chat is the same as on the page (ledger: *Noted · …* / *Let go · …*).
- Not here, by design: the mail itself, unread counts, a "needs reply" list, a refresh button (open the page again after half an hour), snooze, categories.

### Settings (`/settings`)

Placeholder. M1: name, timezone. M6: session defaults. **"What Lumi knows"** (`/knows`, M6) — beliefs grouped by kind, confidence as words, correct/delete inline.

---

## Supporting Features

### Intentions (M3)
"Intention", not task: something the user meant to do. Created, updated, completed, reopened and dropped by Lumi through tools (`docs/architecture.md` → Tools) or ticked/unticked on Today/Lists; either way Lumi sees it in her next turn's *Recent changes*, with who did it. Fields: title, next action, note, list, estimate, due. Status open/done/dropped; stale (14 days untouched) is derived. Every change is an event.

### Beliefs — the understanding layer (M3 tools; reflection in M5/M6)
`memory_notes` with kind · confidence · evidence. Lumi calls `remember` for durable things the user says (`user_said`) or notices (`lumi_inferred`, modest confidence), and `confirm/contradict/revise/forget` as evidence arrives; `core/domain/memory.ts` applies the ops with guardrails (caps, user-said beliefs untouchable by Lumi, retire below 0.2). Injected into every turn's context with confidence and "tentative" markers. "What Lumi knows" page in M6.

### Capacity (M3 tool; Today prompt M4)
`report_capacity` when the user says how much they've got, or the prompt on Today (once a day, skippable). Today's capacity is the latest report in the local day; it shapes the plan (≤1 after-that on a low day) and either source re-cuts the path once — from chat, after the reply, in the route's `after()`. The persona is told not to ask when a capacity is already in the context.

### Leads — what Lumi noticed (2026-09-12)
A lead is something Lumi noticed that might need doing (in the mail, for now) that the user hasn't confirmed — see `docs/domain.md` → `leads`. Model proposes, `clampLeads` guards (`core/ai/leads.ts`), the user answers once on Insights or in chat. Kept → an intention with the lead's title, why, list and due; let go → resolved, no reason asked. A message never produces a lead twice; a title already on the list, or kept/let go in the last month, is never suggested again. `docs/architecture.md` → §9.

### Re-entry (M4)
A sitting that begins after ≥ 7 days away (derived from `app.opened`, `core/domain/users.ts`) is a re-entry: greeting offer on Chat, the coming-back pass in conversation (persona → Coming back), stale intentions flagged in the context block and in the planner's inputs, the planner told to keep the path short and fresh, and a re-cut when the pass lets things go. Nothing on any page shows how long it's been or how much is undone.
