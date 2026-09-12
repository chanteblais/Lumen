# Feature Map

Every page and feature: who it's for, what it does, key states. Grows with each milestone; keep entries current in the same commit as the code.

---

## Navigation

Sidebar (`components/shell/Sidebar.tsx`), numbered, present on every page:

```
Rali   01 Chat · 02 Today · 03 Library · 04 Insights · 05 Settings
```

- Active route highlighted via `aria-current="page"`.
- Mobile (<768px): sidebar collapses to a top strip with the wordmark and nav names.
- Nav carries **no counts, no badges, no dots** — by design (`design-philosophy.md` §3.2).
- Open question (2026-09-12): the Today mockup shows Today · Lists · Focus · Chat · Insights · Archive. Proposal in `today.md`: **Today · Lists · Chat · Settings** for V1, Today becoming the landing page at M3.

**Lumi in the corner** (`components/shell/LumiCompanion.tsx`): full figure standing on the bottom-right edge of every page — breathing, blinking, and now and then a slow sway — one pose, small movements. Decorative only — no clicks, no state. Still under reduced-motion.

---

## Auth

Protected-first (`src/proxy.ts`): every route requires sign-in except `/sign-in` and `/sign-up`. `requireUser()` (`src/lib/auth.ts`) resolves the Clerk session to the internal `users` row — created lazily on first visit with the Clerk first name and the browser timezone (cookie `rali_tz`, set by `TimezoneCapture` in the layout; a first visit refreshes once so "today" is right). `recordVisit()` bumps `last_seen_at` and returns the previous value for the greeting. No onboarding screen: signing in *is* onboarding.

## Pages

### Chat (`/`) — the soft landing

**Who:** Signed-in users.
**What:** The conversation with Rali. The only surface that matters in V1.

- **Greeting card** — two lines from `core/ai/greeting.ts` (deterministic, no model call): recognition ("Good to see you, Chanté.") + somewhere to begin. Variants: default ("What are we working with today?"), long gap (≥7 days: "It's been a minute…"), abandoned session ("Looks like we left a session open on…").
- **Quick starts** — Help me choose · Break it down · Body double · Just talk, plus "another way in" (sends "I don't know where to start."). Each chip sends its own label as the user message — the user sees exactly what they tapped — and the persona knows what each means. Shown until you've said something *this sitting* (no message in the last six hours — `isInSitting`, same threshold as the visit rules), then the card compacts; they return next time you come back.
- **Conversation** (`components/chat/Conversation.tsx`, `useChat`) — the transcript below the greeting card. User lines right-aligned on paper-deep; Rali lines with a 36px avatar. A fine rule with "Yesterday" / "3 days ago" separates messages more than six hours apart. While Rali is thinking, three slow dots. Errors render as one line in Rali's voice ("I lost the thread for a second. Say that again?"). The last 30 messages load on page open; the client sends only the new message and the server holds the transcript.
- **Composer** — pinned to the bottom of the viewport; the transcript above scrolls in its own region (`.chat-page` / `.chat-scroll` / `.composer-dock`), so the input is always in reach and the layout is identical on first load, after a turn, and after navigating away and back. Auto-growing textarea, `+`, send. Enter sends, Shift+Enter newlines; disabled while a turn streams.
- **Voice** (`useVoiceInput`, Web Speech API) — the mic link under the composer toggles listening; the composer border turns brass and the placeholder says "Listening…". Transcribed text lands in the textarea (appended to anything already typed) for the user to read and send — nothing is sent automatically. Hidden in browsers without `SpeechRecognition` (Firefox). Microphone blocked → one line in Rali's voice under the composer. "Add file" and "Tools" are gone until they do something.
- **Tool links** — Add file · Voice · Tools. M0: visual. Voice lands in M7; Add file and Tools are placeholders (may be cut).
- **Status:** M0 built 2026-09-11 (static). M1: greeting uses the signed-in first name and the real visit gap. M2 (2026-09-12): live conversation with `claude-opus-5`, persisted; no tools yet — Rali says so if asked to remember or track something. Avatar is Lumi's head (neutral) from `mockups/lumi.png` as of 2026-09-11.

### Today (`/today`) — spec: `today.md`

**Who:** Signed-in.
**What:** Answers *what should I be doing right now?* Greeting, Lumi's one-line read of the day, an optional capacity prompt, one dominant **Right now** card with **Start with Lumi** and **Not this**, up to three **After that** rows, **Later** (fixed-time commitments only), and "everything else can wait." Generated as a persisted `DayPlan` (model proposes, code guards), stable across reloads, advanced by code on completion. M0: placeholder line. Built in M3 (path), M4 (capacity + *Not this* regeneration).

### Lists (`/lists`) — spec: `today.md` → Lists

**Who:** Signed-in.
**What:** The pile: the user's broader structure in named lists (School · Work · Personal · Later by default). Lumi files intentions here conversationally; the user can move and reorder. No per-list counts, no due date unless one was set, one Add affordance. Minimum in M3 (assignment + per-list view); reorder later.

### Library (`/library`)

Placeholder. Proposed to leave the V1 nav (2026-09-12) in favour of Lists; the "what works for you" idea folds into *What Lumi knows*.

### Insights (`/insights`)

Placeholder. Only ships if it can be framed without scores, streaks, or charts of effort. Post-V1.

### Settings (`/settings`)

Placeholder. M1: name, timezone. M6: session defaults. **"What Rali knows"** (`/knows`, M6) — beliefs grouped by kind, confidence as words, correct/delete inline.

---

## Supporting Features

*(None yet. Coming: Intentions (M3), Understanding layer / beliefs (M3, M5, M6), Focus Together (M5), Voice input (M7).)*
