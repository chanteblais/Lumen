# Today — a path, not a pile

*Spec, 2026-09-12. Source: Chanté's Today-page philosophy brief and the `mockups/` Today mockup. Status: **built** — Lists (minimum) and Today v1 in M3; the capacity prompt, *Not this* with reasons and re-entry in M4 (2026-09-12); *Start with Lumi* opening a focus session in M5 (2026-09-12). Current behaviour: `features.md` → Today.*

*The canon for this page is [`product/today-garden.md`](product/today-garden.md), Chanté's Garden document (2026-09-13): what Today is trying to become. This spec is the page as built and how it got there. Where the two differ: [open questions](living/open-questions.md) 5, 16, 20, 22, 26 and 27.*

## The one question Today answers
**What should I be doing right now?**

Today is not a task list with a "today" filter and not a dashboard. Its job is to make the user's cognitive load *lower* after opening it than before. Traditional apps show everything the user has committed to and leave the interpreting and deciding to them; Today does the interpreting and proposes one thing.

## Principles
1. **The Library holds everything. Today holds only what matters now.** The broader structure (School, Work, Personal, Later, …) lives in the lists the Library keeps. Today curates a manageable path through the day from that context: deadlines, fixed commitments, stated priorities, list order, estimated effort, unfinished work, dependencies, previous conversations, what's been avoided, time available, and today's capacity. Curated, not accumulated. *(As built, 2026-09-13: Lists became the **Library** on 2026-09-13, and its room has no list view; the same day the lists came back as the **Lists** sheet from the nav (`features.md` → Lists), where they can be browsed, ticked, moved and let go. The planner sees only some of the signals named here: How the plan is built → Inputs.)*
2. **One thing dominates.** At almost any moment there is one visually dominant task — *Right now* — and everything else is visually subordinate. Opening Today while overwhelmed should communicate within about a second: *this is the thing we're doing.*
3. **A path, not a pile.** Right now → After that → Later. The further from "right now", the less attention it demands, and the more it can be collapsed. The user always knows Lumi is keeping track of the rest so they don't have to hold it.
4. **"Everything else can wait."** Naming what *doesn't* matter yet is real prioritisation information, not motivational copy. "You've got practicum at 5. Nothing else is especially time-sensitive." "These three are enough for today." Lumi closes open loops.
5. **Lumi proposes; the user decides.** Changing direction is effortless and never a failure. *Not this* on the current task means "this doesn't fit my current state." Lumi responds conversationally — "Fair. What's getting in the way?" — with quick answers: Too big · Too tired · Don't know how · Don't feel like it · Something else is more important · Just nope. Then Lumi breaks it down, swaps it, starts body-double mode, defers it, asks one useful question, or simply accepts. Resistance adapts the plan; it is never recorded as failure.
6. **Capacity shapes the plan.** "How much have we got today? Not much · Normal-ish · Lots." Materially changes the path — a low day might be *one important thing, one easy win, the fixed commitment, everything else can wait.* Capacity is context Lumi uses, not a metric the user tracks.
7. **Starting matters more than planning.** The primary action is **Start with Lumi**, which begins the initiation/body-double interaction. Lumi decides what's needed — a tiny first action, clarification, a breakdown, a timer, quiet company, or conversation — and asks one thing at a time: "Is the document open?" → "Open it. I'll wait."
8. **Re-entry is effortless.** After days away, no backlog. "Hey, it's been a minute. Want me to figure out what's still relevant?" Old plans are quietly reassessed. Returning is a normal state.
9. **No productivity guilt.** No streaks, scores, red overdue counters, completion percentages as pressure, "you missed…", failure states for abandoned sessions, guilt notifications, celebratory overload, or inspirational quotes ("A calmer mind creates a brighter tomorrow" is exactly what not to write). Warmth comes from Lumi's relationship with the user, not copy on the walls.
10. **Visual philosophy.** Calm, clean, ordered, spacious, intentional, quiet. Generous negative space, strong hierarchy; the current task may take substantial room *because* it's the only thing to think about. Secondary information stays quiet and collapsible. Lumi is a small animated presence, not a scene. No coffee cups, books, plants, lifestyle photography. Personality from typography, restrained antique/editorial detail, subtle celestial marks, Lumi, micro-interactions, and conversational copy. *(2026-09-12: Today is now set in a painted greenhouse — the painting is the place the page sits in, behind it, not imagery on it; inside the working UI the rule stands. The mockup's filter tabs, category plants, step counts, add button and quote plate were not carried over. `design-system.md` → Today: the garden.)*

**Core design test, per component:** *does seeing this right now help the user take their next action?* If not — hide, defer, collapse, or move it. **For the page:** *does it hand the overwhelmed user another system to manage, or does Lumi take some of the managing away?* Always the latter.

## Anatomy (V1)
Top to bottom, on the right of the garden, in three layers each quieter than the last (2026-09-13, Chanté's ask; it was one paper panel with the closing line on a green slip beneath): Lumi's words set on the painting (greeting, day line, capacity), the one Right now card, and a faint slip with After that, Later and the closing line. Lumi stands in the room. In the shell:
- **Greeting line** (deterministic, `core/ai/greeting.ts`): "Good morning, Chanté."
- **Lumi's day line** (from the plan, one or two sentences, in voice): "You've got practicum at 5. Nothing else is especially time-sensitive." On the painting, like the clock; no portrait beside it — she is in the room.
- **Capacity prompt** — only when today has no capacity report (from here or from chat), it hasn't been skipped today, and there is a path to shape: *How much have we got today?* Not much · Normal-ish · Lots · Skip. Answering re-cuts the plan, unless the answer matches what the plan already assumed. Asked at most once per day, never blocking. Part of Lumi's words under the day line; the answers are quiet words, not buttons.
- **RIGHT NOW** — the dominant card, the only full paper on the page, no kicker inside: the title (display serif, large), a quiet marginal note beneath it in small caps (list · ~minutes; `.pill`, no box), the first step in one line (*First* · …), **Start with Lumi** (primary), then three quiet words: *Not this*, *Break it down* (opens chat with that intent), *Done*. No circle in front of the title — the card invites starting, not ticking. One card. No carousel, no "1 of 3". With nothing to choose from: *Nothing queued.* and one line.
- **AFTER THAT** — up to three rows (one on a low day), each: title · list · ~minutes (the last two as one marginal note). Complete circle. Nothing else. Whatever the plan leaves off isn't shown at all — no collapsed line, no number; the closing line (*Everything else can wait*) is the only sign there's more. *(This spec planned a wordless collapse here — "A few more, when you get there" — and [`living/decisions.md`](living/decisions.md) → *Never a count of what's undone* still gives it as how collapses read. It was never built; whether Today wants one is Chanté's call.)*
- **LATER** — fixed-time commitments only (things with a `due_at` at a time today; a date alone — 00:00 local — is a day, not an appointment, so it stays a candidate for the path and the planner sees it as *due today*, 2026-09-13): "Practicum · 5:00 pm". Reads as the shape of the day, not a list.
- **Everything else can wait.** One closing line from the plan when there are open intentions not on the path — the last word on the slip.
- **Lumi** — the corner companion already present in the shell. Tap her for a speech bubble and say a thing ("add take out compost") without leaving the page; the path refreshes once she's done. Nothing else.

That's the page. When *Right now* is closed — *Done* here, done in chat, anywhere — the path advances in code, not the model (`core/domain/plan-sync.ts` → `advancePlan`): After-that's first row becomes Right now with a plain fixed first step (*Pick it up where it opens.*), and nothing else changes — the day line and the closing line stay as cut, and nothing is said. When the path runs out while other things are still open, the next open re-cuts it (`first_items`, below). *(This spec promised a one-line acknowledgement in Lumi's voice here; it isn't built. The Garden canon — `product/today-garden.md` §23 — wants completion acknowledged proportionately, sometimes just "Done.", so it is intended rather than cut; left for Chanté to decide.)*

### Cut from the mockup, and why
| Mockup element | Decision | Why |
|---|---|---|
| "Your Day" calendar timeline (10:00 Focus time … 7:00 Free) | **Post-V1.** Later shows only fixed-time intentions | Needs calendar integration (explicitly out of V1). Without real events it's fiction |
| Focus timer widget (25 min ± / Start) | **Not on Today.** Timer appears in the session bar once *Start with Lumi* begins a session (M5) | A second "start" control competes with the one that matters; a timer sitting idle is a small pressure |
| Quick capture (Add a task · Task/Note/Idea) | **Not in V1.** Chat is capture; Lumi files it | A second input surface with a type picker is a system to manage. Revisit if chat-capture proves too slow in daily use |
| "1 of 3" carousel on Right now | **Cut.** *Not this* is the only way to change the current task | A carousel invites scanning options — exactly what one-thing-dominates prevents |
| Today / This Week / Someday tabs | **The Library's job.** Today has no tabs | Horizon-switching is planning, not starting |
| Search, settings icons in the header | **Settings stays in nav; search post-V1** | Nothing to search yet |
| "Other items (2)" | **Cut.** Nothing past the path is shown; the closing line says the rest can wait (a wordless collapse, "A few more, when you get there", was planned and not built — Anatomy → After that) | A count of undone things — see `ef-burden-log.md` |
| "Small steps still move the world." (sidebar) | **Keep as the sidebar aside** if it stays the *only* line of its kind | Borderline inspirational; the brief's own rule says warmth comes from Lumi, not copy. One aside is the ceiling |

## Lists (the pile)
*In the nav as the **Library** since 2026-09-13 (`/library`, `product/spaces.md` §3); the lists inside it are still lists, and this spec keeps the name. The same day the list view came off the page — the Library is only its painted room for now — so the rows below describe the data and the view as it was, not what the page shows. Later that day the lists came back as **Lists**, a sheet from the nav over the page you're on (`features.md` → Lists): the mockup's per-list counts, Overdue, sort and filter stayed out, and Add goes through Lumi, so the interaction-model concerns below still hold.*

Introduced by this brief as a first-class section: the user's broader structure, in named lists (School · Work · Personal · Later by default; user-editable). Rows: title, optional next action, optional estimate, optional due date. Lumi files new intentions into a list conversationally; the user can move/reorder. Lists is where planning-brain lives so Today doesn't have to. Full spec when it's built (M3 minimum: list assignment + a plain per-list view; reorder and drag later). It reverses the 2026-09-11 "not built" verdict on the Lists mockup: the *interaction model* concerns stand (no per-column counts, no due-date on every row unless set, one "Add" affordance, not five), the *section* is in.

## How the plan is built
`core/ai/plan.ts` → `buildDayPlan(inputs) → DayPlan`. Curation is judgement, so the **model proposes** (structured output) and **code applies guardrails**, the same pattern as beliefs.

Inputs as built (`describeInputs` in `plan.ts`, from one snapshot via `planInputs` in `today-plan.ts`): the person's name; local weekday and time, and the part of the day; today's capacity report and its flags, or "not stated; assume normal"; how long since they were last here (the gap this sitting began after), with "keep it light" after a week or more; the fixed-time intentions today, by title and time, to leave out; up to 40 candidates, each with id, title, list and estimate, flagged with *declined today* (and the reason), *untouched for two weeks+* (derived stale), the next action, the due date and the first 80 characters of the note; on an `asked` re-cut, the ask in their words and Lumi's pick; and up to 12 beliefs of kind strategy, pattern, anti-pattern or preference.

**Planned, not wired:** time left in the day (only the clock time is given), avoidance signals beyond today (touched repeatedly, declined on earlier days, never started — only *untouched two weeks+* reaches the planner), and a recent-conversation summary. Beliefs may carry some of this once reflection writes it (an `anti_pattern` such as "intentions touched repeatedly, never entered a session").

Output (`DayPlanJson` in `db/schema.ts`; the date and capacity live on the `day_plans` row, not in the plan):
```ts
type DayPlanJson = {
  dayLine: string;                              // "You've got practicum at 5. Nothing else is time-sensitive."
  rightNow: { intentionId; firstStep } | null;  // null only when nothing is open, or all of it was declined today
  afterThat: { intentionId }[];                 // ≤ 3
  later: { intentionId }[];                     // fixed-time today, code-derived
  restCanWait: boolean;                         // open intentions exist beyond the path
  closingLine?: string;                         // "These three are enough for today." Only when restCanWait
};
```
Guardrails (`clampPlan`, pure, tested): ids must be open candidates, no repeats; Right now must not be declined today (unless Lumi pinned it from an ask, below); if the model gives no usable Right now, the most recently touched open, undeclined candidate is used, with its next action or *The smallest first piece of it, nothing more.*; After that ≤ 3 (≤ 1 on a low day); Later is exactly the fixed-time set; counts ("three things") are stripped from both lines. The voice rules live in the planner prompt; code doesn't check them. With nothing open (or everything declined today) there is no model call, just a fixed day line. Cut when a local day has no plan yet (`new_day`) or its plan has run out (`first_items`), and re-cut only on the triggers below. Advanced, not regenerated, when anything on the path is closed.

Persisted in `day_plans` so the path is **stable across reloads** — the one thing must not change every time the page opens.

**Cut before it's needed.** Generation is primed in the background when the app is opened (home page) and after every chat turn, so Today normally finds the plan already there instead of waiting several seconds on the model. If the day's plan was cut with nothing to choose from (or everything on it has been ticked off) and intentions have since arrived — brain-dump in chat, then Today — it is re-cut once (`reason: first_items`). A plan with a Right now is never touched by this.

**Re-cut only on purpose (M4).** The one thing moves on four triggers and no others (`recutTodaysPlan` in `core/ai/today-plan.ts`): a capacity answer, from Today's prompt or chat (`capacity`; skipped when it matches what the plan assumed), a *Not this* answer (`declined`), letting things go during the coming-back pass (`reentry`), and an ask in chat for a different shape of day (`asked`, below). Chat-side triggers are applied once after the reply streams.

**Asked in chat (`asked`, 2026-09-12).** "I need an easy task", "what should I do now", "quick wins", a replan: Lumi picks the thing in her reply and calls `reshape_today` with the ask in the user's words and the id (and first step) of what she picked. After the reply, the path is re-cut with the ask as a planner input — the ask outranks the default order, the day line may answer it in a few words — and `clampPlan` pins Lumi's pick as Right now so Today shows what she just said. The pin wins over a decline earlier today (the ask is the user's later word). If she names nothing, the planner chooses within the ask. In the same turn an ask wins over a capacity or decline re-cut; both still reach the planner from the snapshot. The ask is kept on the `plan.generated` event, not on the row. Nothing on Today asks for or shows the ask.

## Domain additions (proposed; migration when built)
| Change | Why |
|---|---|
| `intentions.list` text null | Lists membership (free label, user-editable list names) |
| `intentions.estimate_minutes` int null | "~40 min" pills; Lumi infers when unstated; `effort_hint` stays as the coarse fallback |
| `day_plans` (id, user_id, local_date, capacity, plan jsonb, generated_at, reason: 'new_day'\|'first_items'\|'capacity'\|'declined'\|'asked'\|'advanced') | Stable path per day; history of how the day was re-cut |
| events: `plan.generated {reason}`, `plan.advanced`, `intention.declined {reason}`, `capacity.asked` | *Not this* reasons are the richest learning signal in the product — "too big" three times on the same kind of task is an `anti_pattern` belief waiting to be written |

## Handoffs into chat
- **Start with Lumi** → `/` with a structured user message (`{ kind: "start_intention", intentionId }` in metadata; visible text "Let's start: *Finish discussion post*"). The route tells Lumi this was the button (a *Just now* line with the title, the path's first step and the estimate): it is the start itself, so she opens the focus session at once (`start_focus_session`, M5) and says one line — the session bar appears above the composer; tapping it again while that session runs gets one line and no second session. See `features.md` → Chat → Focus Together.
- **Not this** → the six quick answers appear in place on the card under "Fair. What's getting in the way?" (plus a quiet *Keep it*); the tapped answer posts as a `{ kind: "declined", intentionId, reason }` message ("Not this one: *title* — too big."); Lumi replies to the reason; the plan regenerates with it. Built M4.
- **Break it down** → chat with `{ kind: "break_down", intentionId }`.
Each is a real user message in the one transcript (decision #11 in `architecture.md`).

## Milestone re-cut
- **M3 — Intentions, beliefs, Lists (minimum), Today v1:** tools + ledger lines as planned, plus `list`/`estimate_minutes`, a plain Lists page, and Today rendering a generated `DayPlan` with Right now / After that / Later and *Start with Lumi* → chat handoff. No capacity prompt yet; *Not this* posts to chat but the plan only regenerates on the next day or when asked.
- **M4 — Capacity, Not this, re-entry:** capacity prompt + regeneration; declined reasons feed the plan and beliefs; the re-entry pass rebuilds the plan after a gap.
- **M5 — Focus Together (built 2026-09-12):** *Start with Lumi* can open a session; session bar with elapsed-of-planned; check-ins.
- **M6/M7** unchanged.

## Open questions for Chanté
1. ~~**The product name?**~~ Answered: first Lumen, then **Coherence** (2026-09-12, `decisions.md`); the character stays Lumi.
2. ~~**Nav.**~~ Answered: Chat (now Home) · Today · Lists · Insights · Settings shipped in M3. The intended model has since become four rooms: **Home · Garden · Library · Study**, with Today becoming the Garden (2026-09-12, [`living/decisions.md`](living/decisions.md)). Where Lists and Insights go is [open](living/open-questions.md).
3. ~~**Should Today become the landing page?**~~ Answered: no. Home, the conversation, stays the landing (2026-09-12), and the rooms decision keeps it so.

## Reconciliation boundaries — 2026-09-13

This implementation spec is preserved. The complete [Garden](product/today-garden.md) adds scoped exclusions (§111–115), negotiated attention and user priority (§83–88), and meaningful outcomes beyond completion (§131–139). Today's **Later** heading means fixed-time landmarks; it is not interchangeable with a list named Later or “Not today.” [Shared terminology](product/shared-model.md) defines those distinctions. Adaptive triggers and mobile presence remain open questions 26 and 27. Historical promises above are not evidence of implementation.
