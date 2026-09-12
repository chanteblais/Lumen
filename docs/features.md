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

---

## Pages

### Chat (`/`) — the soft landing

**Who:** Everyone (signed-in from M1).
**What:** The conversation with Rali. The only surface that matters in V1.

- **Greeting card** — two lines from `core/ai/greeting.ts` (deterministic, no model call): recognition ("Good to see you, Chanté.") + somewhere to begin. Variants: default ("What are we working with today?"), long gap (≥7 days: "It's been a minute…"), abandoned session ("Looks like we left a session open on…").
- **Quick starts** — Help me choose · Break it down · Body double · Just talk, plus "another way in". M0: static. M2: each sends a canned first message.
- **Composer** — auto-growing textarea, `+`, send. M0: visual only. M2: streams a turn via `POST /api/chat`.
- **Tool links** — Add file · Voice · Tools. M0: visual. Voice lands in M7; Add file and Tools are placeholders (may be cut).
- **Status:** M0 built 2026-09-11 (static).

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
