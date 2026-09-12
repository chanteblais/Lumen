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
- Decided 2026-09-12: V1 nav is **Chat · Today · Lists · Settings**; Chat stays the homepage (`today.md` → Decisions). Library and Insights leave the nav when Lists lands (M3).

**Lumi in the corner** (`components/shell/LumiCompanion.tsx`): full figure standing on the bottom-right edge of every page — breathing, blinking, and now and then a slow sway — one pose, small movements. Decorative only — no clicks, no state. Still under reduced-motion.

---

## Auth

Protected-first (`src/proxy.ts`): every route requires sign-in except `/sign-in` and `/sign-up`. `requireUser()` (`src/lib/auth.ts`) resolves the Clerk session to the internal `users` row — created lazily on first visit with the Clerk first name and the browser timezone (cookie `lumen_tz`, set by `TimezoneCapture` in the layout; a first visit refreshes once so "today" is right). `recordVisit()` bumps `last_seen_at` and returns the previous value for the greeting. No onboarding screen: signing in *is* onboarding.

## Pages

### Chat (`/`) — the soft landing

**Who:** Signed-in users.
**What:** The conversation with Lumi. The only surface that matters in V1.

- **Greeting card** — two lines from `core/ai/greeting.ts` (deterministic, no model call): recognition ("Good to see you, Chanté.") + somewhere to begin. Variants: default ("What are we working with today?"), long gap (≥7 days: "It's been a minute…"), abandoned session ("Looks like we left a session open on…").
- **Quick starts** — Help me choose · Break it down · Body double · Just talk, plus "another way in" (sends "I don't know where to start."). Each chip sends its own label as the user message — the user sees exactly what they tapped — and the persona knows what each means. Shown until you've said something *this sitting* (no message in the last six hours — `isInSitting`, same threshold as the visit rules), then the card compacts; they return next time you come back.
- **Ledger lines** (`components/chat/Ledger.tsx`) — under a reply, a quiet ✦ line per thing Lumi did: *Noted · title · list*, *Done · title*, *Let go · title*, *Remembered · …*, *Today · not much*. Rendered from tool parts.
- **Conversation** (`components/chat/Conversation.tsx`, `useChat`) — the transcript below the greeting card. User lines right-aligned on paper-deep; Lumi lines with a 36px avatar. A fine rule with "Yesterday" / "3 days ago" separates messages more than six hours apart. While Lumi is thinking, three slow dots. Errors render as one line in Lumi's voice ("I lost the thread for a second. Say that again?"). The last 30 messages load on page open; the client sends only the new message and the server holds the transcript.
- **Composer** — pinned to the bottom of the viewport; the transcript above scrolls in its own region (`.chat-page` / `.chat-scroll` / `.composer-dock`), so the input is always in reach and the layout is identical on first load, after a turn, and after navigating away and back. Auto-growing textarea, `+`, send. Enter sends, Shift+Enter newlines; disabled while a turn streams.
- **Voice** (`useVoiceInput`, `components/chat/voice/`) — the mic link under the composer toggles listening; the composer border turns brass and the placeholder says "Listening…". Transcribed text lands in the textarea (appended to anything already typed) for the user to read and send — nothing is sent automatically. Two engines behind the one button, chosen automatically: the browser's **Web Speech API** (Chrome, Safari, Edge), or **Whisper running locally** in a worker (Brave, Firefox — Brave exposes the API but ships no speech service behind it, so every session failed with `network`). The local engine asks for the mic, then loads the model while already capturing, so nothing said during the wait is lost; states are *Getting voice ready…* (first tap downloads ~90 MB once; afterwards under two seconds) → *Listening…* (text refreshes every ~4 s) → *Writing that down…* (one final pass, under a second). Audio never leaves the device. A silent take says "I didn't hear anything from ‹mic name›. Is that the right mic?" rather than inventing words — the name is there because macOS may have picked a nearby iPhone. The Web Speech engine treats the tap as intent and outlives the browser's own session ends: a plain end restarts quietly and keeps the transcript; a session that ends instantly twice gives up with one line. Microphone blocked, no network, ~8s of silence (`no-speech`), or another tab/app taking the mic (`aborted`) → one line in Lumi's voice under the composer, never a silent switch-off. Every recognition error is `console.warn`ed as `[voice]`; `localStorage.lumen.voice = "local" | "speech"` forces an engine for testing. The microphone is the browser's default input device (Chrome: `chrome://settings/content/microphone`; macOS may offer a nearby iPhone as a Continuity mic) — the page cannot choose one, and we don't add a picker.
- **Tool links** — Add file · Voice · Tools. M0: visual. Voice lands in M7; Add file and Tools are placeholders (may be cut).
- **Status:** M0 built 2026-09-11 (static). M1: greeting uses the signed-in first name and the real visit gap. M2 (2026-09-12): live conversation with `claude-opus-5`, persisted; no tools yet — Lumi says so if asked to remember or track something. Avatar is Lumi's head (neutral) from `mockups/lumi.png` as of 2026-09-11.

### Today (`/today`) — spec: `today.md` — **built M3 (2026-09-12)**

**Who:** Signed-in.
**What:** Answers *what should I be doing right now?* Greeting by time of day, Lumi's one-line read of the day, one dominant **Right now** card (title, list + estimate pills, the first physical step, **Start with Lumi**, **Not this**, *Break it down*), up to three **After that** rows, **Later** (fixed-time commitments only), and "everything else can wait." The plan is generated once per day — primed in the background when the app is opened or a chat turn ends, so the page usually finds it ready; otherwise generated on first open, streamed in under Suspense with a skeleton — persisted, and stable across reloads (an empty plan is re-cut once intentions exist); ticking the circle on any row completes it and advances the path. **Start with Lumi / Not this / Break it down** are links into Chat that send a visible message ("Let's start: *title*") with the intention id in metadata. M4 adds the capacity prompt and *Not this* regeneration with reasons.

### Lists (`/lists`) — spec: `today.md` → Lists — **built M3 (2026-09-12), minimum**

**Who:** Signed-in.
**What:** The pile. Open intentions grouped by list (School · Work · Personal · Later by default; `users.preferences.lists`), two columns; each row is a complete circle, the title, the next action if any, and estimate/due pills. No per-list counts. One **Add something** chip → Chat with the composer prefilled ("Add to my list: "). Moving between lists and renaming lists happen in conversation for now; drag/reorder later.

### Settings (`/settings`)

Placeholder. M1: name, timezone. M6: session defaults. **"What Lumi knows"** (`/knows`, M6) — beliefs grouped by kind, confidence as words, correct/delete inline.

---

## Supporting Features

### Intentions (M3)
"Intention", not task: something the user meant to do. Created, updated, completed and dropped by Lumi through tools (`docs/architecture.md` → Tools) or ticked on Today/Lists. Fields: title, next action, note, list, estimate, due. Status open/done/dropped; stale (14 days untouched) is derived. Every change is an event.

### Beliefs — the understanding layer (M3 tools; reflection in M5/M6)
`memory_notes` with kind · confidence · evidence. Lumi calls `remember` for durable things the user says (`user_said`) or notices (`lumi_inferred`, modest confidence), and `confirm/contradict/revise/forget` as evidence arrives; `core/domain/memory.ts` applies the ops with guardrails (caps, user-said beliefs untouchable by Lumi, retire below 0.2). Injected into every turn's context with confidence and "tentative" markers. "What Lumi knows" page in M6.

### Capacity (M3 tool; Today prompt in M4)
`report_capacity` when the user says how much they've got. Today's capacity is the latest report in the local day; it shapes the plan (≤1 after-that on a low day).
