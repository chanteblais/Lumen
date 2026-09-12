# EF-Burden Log

A **running ledger of every place Rali asks the user to maintain, decide, categorise, rate, or tidy something** — the raw material for the one question: *does this reduce the user's executive-function burden, or accidentally create more of it?* Mirrors Glåüm's generalizability log: captured from reality as we build, not guessed.

> **Why this exists:** productivity systems accrete maintenance. The only defence is to notice each increment as it appears. Some burden is fine (typing a message). The point is that every increment is *seen* and *chosen*.

## Maintenance protocol — for Claude (automatic, every iteration)

During **any** work on this codebase, whenever you write, propose, or read code or copy that:
- asks the user to **set** something (a status, priority, category, tag, due date, setting, tone),
- asks the user to **keep** something current (a list to groom, an inbox to clear, a session to close),
- asks the user to **rate** or **confirm** something Rali could infer from behaviour,
- shows the user a **count** of undone things,
- or requires the user to **remember** to do something in the app for the app to work,

→ **add a row to the table below before you finish the task.** Rules:
- **Log it, then decide.** Options: `accepted` (a deliberate, minimal ask — say why), `derived` (replaced by inference from events/behaviour), `removed`, `open` (needs a decision).
- **Prefer derived over asked.** If behaviour can tell us, don't ask.
- Keep entries terse. One row. Link `file:line` where useful.

## Categories (for the "Type" column)
`set` · `maintain` · `rate` · `count` · `remember` · `choose` (a menu of options where one default would do)

---

## Ledger

| Date | Area / `file` | Type | The ask | Alternative | Status |
|---|---|---|---|---|---|
| 2026-09-11 | Quick-start chips, `components/chat/QuickStarts.tsx` | choose | Four starting points on the landing page | Kept: they are prompts, not modes; nothing happens if ignored. Watch that they never grow beyond four | accepted |
| 2026-09-11 | Composer tool links "Add file / Tools" | choose | Two affordances with no V1 behaviour | Hidden 2026-09-12 (review finding: dead buttons on the main screen). Return only when they do something | removed |
| 2026-09-12 | Voice input, `components/chat/useVoiceInput.ts` | choose | A second way to put words in the box | Kept: transcription lands in the composer for reading, never auto-sends; one tap on, one tap off. The lowest-effort input for the lowest-capacity moment | accepted |
| 2026-09-11 | `mockups/rali-list.png` — Lists board | maintain, count, set | Per-column counts, due-date on every row, five "Add item", drag-to-prioritise, category columns | Today page = derived read-only view; categories only if inferred; no counts | removed (not built) |
| 2026-09-11 | Tone preference | set | A tone picker in Settings | Learned as a `preference` belief; visible/correctable in "What Rali knows" | derived |
| 2026-09-11 | Focus check-ins | rate | "Still with it?" Yep / Stuck / Distracted / Done at intervals | Kept: it's the body-double contract the user agreed to; "Yep" costs one tap and no reply | accepted |
| 2026-09-12 | Quick-start chip text, `core/ai/persona.ts` | choose | The chip sends its label as the user's message | Considered a hidden canned prompt per chip; rejected — the transcript would show words the user didn't say. The persona interprets the four labels instead | accepted |
| 2026-09-12 | "Another way in" button, `components/chat/QuickStarts.tsx` | choose | Sends "I don't know where to start." | Kept: one tap for the person with the least capacity to type | accepted |
