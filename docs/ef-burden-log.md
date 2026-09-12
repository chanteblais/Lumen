# EF-Burden Log

A **running ledger of every place Lumi asks the user to maintain, decide, categorise, rate, or tidy something** — the raw material for the one question: *does this reduce the user's executive-function burden, or accidentally create more of it?* Mirrors Glåüm's generalizability log: captured from reality as we build, not guessed.

> **Why this exists:** productivity systems accrete maintenance. The only defence is to notice each increment as it appears. Some burden is fine (typing a message). The point is that every increment is *seen* and *chosen*.

## Maintenance protocol — for Claude (automatic, every iteration)

During **any** work on this codebase, whenever you write, propose, or read code or copy that:
- asks the user to **set** something (a status, priority, category, tag, due date, setting, tone),
- asks the user to **keep** something current (a list to groom, an inbox to clear, a session to close),
- asks the user to **rate** or **confirm** something Lumi could infer from behaviour,
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
| 2026-09-12 | Greeting's opening question, `core/ai/greeting.ts` | decide | "What are we working with today?" on every page open — re-declaring the day's work each time you came back | Asked once, while there is nothing to pick up; afterwards the line continues from when we last spoke (same day · yesterday · a few days), derived from the transcript's timestamps — never from what is undone | derived |
| 2026-09-12 | Capacity prompt built, `components/today/CapacityPrompt.tsx` | rate | Three answers + Skip above the Right now card | Shown only when nothing has reported capacity today (chat counts), not yet skipped today, and there is a path to shape; Skip is remembered for the day (`capacity.asked`); *Normal-ish* on an unstated plan changes nothing, so answering never costs a re-cut for no reason. Not shown on an empty day | accepted |
| 2026-09-12 | *Not this* → "Keep it", `components/today/RightNowActions.tsx` | choose | A seventh control beside the six reasons | It is an escape, not a reason: closes the chips without recording anything. Without it, opening the question commits you to answering | accepted |
| 2026-09-12 | Coming-back pass, `core/ai/persona.ts` → Coming back | maintain | Going through stale intentions after a long gap | Lumi does the going-through: names them by shape, drops in one go on one answer, ends with one step. The user's part is a yes and a sentence. Never a count, never one-by-one confirmation | derived |
| 2026-09-11 | Quick-start chips, `components/chat/QuickStarts.tsx` | choose | Four starting points on the landing page | Kept: they are prompts, not modes; nothing happens if ignored. Watch that they never grow beyond four | accepted |
| 2026-09-11 | Composer tool links "Add file / Tools" | choose | Two affordances with no V1 behaviour | Hidden 2026-09-12 (review finding: dead buttons on the main screen). Return only when they do something | removed |
| 2026-09-12 | Voice input, `components/chat/useVoiceInput.ts` | choose | A second way to put words in the box | Kept: transcription lands in the composer for reading, never auto-sends; one tap on, one tap off. The lowest-effort input for the lowest-capacity moment | accepted |
| 2026-09-12 | Voice error lines, `components/chat/useVoiceInput.ts` | confirm | "Is the mic on? Tap Voice to try again" / "Tap Voice to listen here again" after the browser ends a session | The alternative was a button that silently switched off, which the user had to notice and diagnose. One line that names the cause and the single next tap is less burden than a mystery; a plain end restarts without asking at all | accepted |
| 2026-09-11 | `mockups/rali-list.png` — Lists board | maintain, count, set | Per-column counts, due-date on every row, five "Add item", drag-to-prioritise, category columns | **Revised 2026-09-12** by the Today brief: Lists is in as "the pile" so Today can be "the path". The interaction-model objections stand: no per-column counts, no due date unless set, one Add, reorder later. See `today.md` | accepted (scoped) |
| 2026-09-12 | Today mockup — "Other items (2)" | count | A count of items beyond the path | Wordless collapse: "A few more, when you get there" | removed |
| 2026-09-12 | Today mockup — "1 of 3" carousel on Right now | choose | Browse alternative current tasks | *Not this* is the only way to change the current task; a carousel invites scanning | removed |
| 2026-09-12 | Today mockup — quick capture with Task/Note/Idea | set, choose | A second input with a type picker | Chat is capture; Lumi files. Revisit only if chat-capture proves slow in daily use | removed (V1) |
| 2026-09-12 | Today mockup — focus timer widget (25 min ±) | set | A timer to configure on the page | Timer appears only inside a started session (M5); defaults from beliefs/preferences | removed from Today |
| 2026-09-12 | Today mockup — "Your Day" calendar timeline | maintain | Calendar events to keep current | Post-V1 with real calendar integration; until then Later shows fixed-time intentions only | deferred |
| 2026-09-12 | Capacity prompt on Today | rate | "How much have we got today?" three answers + skip | Kept: asked at most once a day, skippable, and it materially changes the plan — the one self-report that earns its tap | accepted |
| 2026-09-12 | *Not this* quick answers | rate | Six reasons for declining the current task | Kept: it's the opposite of pressure — the user corrects Lumi in one tap, and the reason is the best learning signal we have | accepted |
| 2026-09-12 | Lists membership (`intentions.list`) | set | Which list a thing belongs to | Lumi infers on capture; the user only ever corrects. Never a required field | accepted (derived by default) |

| 2026-09-11 | Tone preference | set | A tone picker in Settings | Learned as a `preference` belief; visible/correctable in "What Lumi knows" | derived |
| 2026-09-11 | Focus check-ins | rate | "Still with it?" Yep / Stuck / Distracted / Done at intervals | Kept: it's the body-double contract the user agreed to; "Yep" costs one tap and no reply | accepted |
| 2026-09-12 | Quick-start chip text, `core/ai/persona.ts` | choose | The chip sends its label as the user's message | Considered a hidden canned prompt per chip; rejected — the transcript would show words the user didn't say. The persona interprets the four labels instead | accepted |
| 2026-09-12 | "Another way in" button, `components/chat/QuickStarts.tsx` | choose | Sends "I don't know where to start." | Kept: one tap for the person with the least capacity to type | accepted |
| 2026-09-12 | Lists "Add something" chip, `app/lists/page.tsx` | choose | One affordance to add, which opens Chat prefilled | Kept: one, and it routes through the conversation so Lumi files it | accepted |
| 2026-09-12 | Today "First" line (first step) | — | Shows Lumi's chosen first physical action | Not an ask — but if it ever becomes editable it becomes maintenance. Keep read-only | accepted |
