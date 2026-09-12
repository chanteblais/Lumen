# QA Log

Running record of QA sweeps: what was tested, what was fixed, and — most useful for the next tester — what is *known and deliberate* so it doesn't get re-reported, plus where the remaining risk lives. Newest sweep first.

Format per sweep: `## Sweep <date> — <scope> (branch)` → `### Fixed` · `### Known and deliberate` · `### Open` · `### Highest-value manual tests`.

---

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
- ~~Rali avatar is a monogram, not the hooded figure.~~ Fixed 2026-09-11: sprite sheet in `public/rali-sprites.png`.
- The Next dev indicator ("N" bottom-left) is dev-only.

### Open
- Mobile layout (<768px) not visually verified — Chrome refused to resize below its minimum window width. Check in DevTools device mode.

### Highest-value manual tests
- Landing page at 1440 and 390 wide; nav highlight on each route; composer grows with multi-line input.
