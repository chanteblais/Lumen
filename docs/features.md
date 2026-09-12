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
- Open question (2026-09-11): the Lists mockup shows an icon nav with **Focus** in place of Library. Decide before M5.

**Lumi in the corner** (`components/shell/LumiCompanion.tsx`): full figure standing on the bottom-right edge of every page — breathing, blinking, and now and then perking up, tilting, waving or leaning. Decorative only — no clicks, no state. Still under reduced-motion.

---

## Auth

Protected-first (`src/proxy.ts`): every route requires sign-in except `/sign-in` and `/sign-up`. `requireUser()` (`src/lib/auth.ts`) resolves the Clerk session to the internal `users` row — created lazily on first visit with the Clerk first name and the browser timezone (cookie `rali_tz`, set by `TimezoneCapture` in the layout; a first visit refreshes once so "today" is right). `recordVisit()` bumps `last_seen_at` and returns the previous value for the greeting. No onboarding screen: signing in *is* onboarding.

## Pages

### Chat (`/`) — the soft landing

**Who:** Signed-in users.
**What:** The conversation with Rali. The only surface that matters in V1.

- **Greeting card** — two lines from `core/ai/greeting.ts` (deterministic, no model call): recognition ("Good to see you, Chanté.") + somewhere to begin. Variants: default ("What are we working with today?"), long gap (≥7 days: "It's been a minute…"), abandoned session ("Looks like we left a session open on…").
- **Quick starts** — Help me choose · Break it down · Body double · Just talk, plus "another way in" (sends "I don't know where to start."). Each chip sends its own label as the user message — the user sees exactly what they tapped — and the persona knows what each means. Hidden once the conversation has messages (the card compacts).
- **Conversation** (`components/chat/Conversation.tsx`, `useChat`) — the transcript below the greeting card. User lines right-aligned on paper-deep; Rali lines with a 36px avatar. A fine rule with "Yesterday" / "3 days ago" separates messages more than six hours apart. While Rali is thinking, three slow dots. Errors render as one line in Rali's voice ("I lost the thread for a second. Say that again?"). The last 30 messages load on page open; the client sends only the new message and the server holds the transcript.
- **Composer** — auto-growing textarea, `+`, send. Enter sends, Shift+Enter newlines; disabled while a turn streams.
- **Tool links** — Add file · Voice · Tools. M0: visual. Voice lands in M7; Add file and Tools are placeholders (may be cut).
- **Status:** M0 built 2026-09-11 (static). M1: greeting uses the signed-in first name and the real visit gap. M2 (2026-09-12): live conversation with `claude-opus-5`, persisted; no tools yet — Rali says so if asked to remember or track something. Avatar is Lumi's head (neutral) from `mockups/lumi.png` as of 2026-09-11.

### Today (`/today`)

**Who:** Signed-in.
**What:** A quiet, read-only view of open intentions with their next action. Complete/reopen only. No editing, sorting, counts, or categories. M0: placeholder line. Built in M3.

### Library (`/library`)

Placeholder. Intended for saved strategies ("what actually works for you") — post-V1.

### Insights (`/insights`)

Placeholder. Only ships if it can be framed without scores, streaks, or charts of effort. Post-V1.

### Settings (`/settings`)

Placeholder. M1: name, timezone. M6: session defaults. **"What Rali knows"** (`/knows`, M6) — beliefs grouped by kind, confidence as words, correct/delete inline.

---

## Supporting Features

*(None yet. Coming: Intentions (M3), Understanding layer / beliefs (M3, M5, M6), Focus Together (M5), Voice input (M7).)*
