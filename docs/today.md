# Today — a path, not a pile

*Spec, 2026-09-12. Source: Chanté's Today-page philosophy brief and the `mockups/` Today mockup. Status: **built** — Lists (minimum) and Today v1 in M3; the capacity prompt, *Not this* with reasons and re-entry in M4 (2026-09-12). *Start with Lumi* opening a session is M5. Current behaviour: `features.md` → Today.*

## The one question Today answers
**What should I be doing right now?**

Today is not a task list with a "today" filter and not a dashboard. Its job is to make the user's cognitive load *lower* after opening it than before. Traditional apps show everything the user has committed to and leave the interpreting and deciding to them; Today does the interpreting and proposes one thing.

## Principles
1. **Lists holds everything. Today holds only what matters now.** The broader structure (School, Work, Personal, Later, …) lives in Lists. Today curates a manageable path through the day from that context: deadlines, fixed commitments, stated priorities, list order, estimated effort, unfinished work, dependencies, previous conversations, what's been avoided, time available, and today's capacity. Curated, not accumulated.
2. **One thing dominates.** At almost any moment there is one visually dominant task — *Right now* — and everything else is visually subordinate. Opening Today while overwhelmed should communicate within about a second: *this is the thing we're doing.*
3. **A path, not a pile.** Right now → After that → Later. The further from "right now", the less attention it demands, and the more it can be collapsed. The user always knows Lumi is keeping track of the rest so they don't have to hold it.
4. **"Everything else can wait."** Naming what *doesn't* matter yet is real prioritisation information, not motivational copy. "You've got practicum at 5. Nothing else is especially time-sensitive." "These three are enough for today." Lumi closes open loops.
5. **Lumi proposes; the user decides.** Changing direction is effortless and never a failure. *Not this* on the current task means "this doesn't fit my current state." Lumi responds conversationally — "Fair. What's getting in the way?" — with quick answers: Too big · Too tired · Don't know how · Don't feel like it · Something else is more important · Just nope. Then Lumi breaks it down, swaps it, starts body-double mode, defers it, asks one useful question, or simply accepts. Resistance adapts the plan; it is never recorded as failure.
6. **Capacity shapes the plan.** "How much have we got today? Not much · Normal-ish · Lots." Materially changes the path — a low day might be *one important thing, one easy win, the fixed commitment, everything else can wait.* Capacity is context Lumi uses, not a metric the user tracks.
7. **Starting matters more than planning.** The primary action is **Start with Lumi**, which begins the initiation/body-double interaction. Lumi decides what's needed — a tiny first action, clarification, a breakdown, a timer, quiet company, or conversation — and asks one thing at a time: "Is the document open?" → "Open it. I'll wait."
8. **Re-entry is effortless.** After days away, no backlog. "Hey, it's been a minute. Want me to figure out what's still relevant?" Old plans are quietly reassessed. Returning is a normal state.
9. **No productivity guilt.** No streaks, scores, red overdue counters, completion percentages as pressure, "you missed…", failure states for abandoned sessions, guilt notifications, celebratory overload, or inspirational quotes ("A calmer mind creates a brighter tomorrow" is exactly what not to write). Warmth comes from Lumi's relationship with the user, not copy on the walls.
10. **Visual philosophy.** Calm, clean, ordered, spacious, intentional, quiet. Generous negative space, strong hierarchy; the current task may take substantial room *because* it's the only thing to think about. Secondary information stays quiet and collapsible. Lumi is a small animated presence, not a scene. No coffee cups, books, plants, lifestyle photography. Personality from typography, restrained antique/editorial detail, subtle celestial marks, Lumi, micro-interactions, and conversational copy.

**Core design test, per component:** *does seeing this right now help the user take their next action?* If not — hide, defer, collapse, or move it. **For the page:** *does it hand the overwhelmed user another system to manage, or does Lumi take some of the managing away?* Always the latter.

## Anatomy (V1)
Top to bottom, on paper, in the shell:
- **Greeting line** (deterministic, `core/ai/greeting.ts`): "Good morning, Chanté."
- **Lumi's day line** (from the plan, one or two sentences, in voice): "You've got practicum at 5. Nothing else is especially time-sensitive." Lumi's bust beside it, small.
- **Capacity prompt** — only when today has no capacity report and the plan hasn't been accepted yet: *How much have we got today?* Not much · Normal-ish · Lots · (skip). Answering regenerates the plan. Asked at most once per day, dismissable, never blocking.
- **RIGHT NOW** — the dominant card: title (display serif, large), quiet pills (list · ~minutes), the next action in one line, **Start with Lumi** (primary), **Not this** (secondary). Quiet links beneath: *Break it down* (opens chat with that intent). One card. No carousel, no "1 of 3".
- **AFTER THAT** — up to three rows, each: title · list pill · ~minutes. Complete/reopen circle. Nothing else. If the plan holds more, a single collapsed line — *A few more, when you get there* — no number.
- **LATER** — fixed-time commitments only (things with a `due_at` today): "Practicum · 5:00 pm". Reads as the shape of the day, not a list.
- **Everything else can wait.** One closing line from the plan when there are open intentions not on the path.
- **Lumi** — the corner companion already present in the shell. Tap her for a speech bubble and say a thing ("add take out compost") without leaving the page; the path refreshes once she's done. Nothing else.

That's the page. When *Right now* is completed, the path advances (code, not the model): After-that's first row becomes Right now with a one-line acknowledgement in Lumi's voice; the day line updates only if the plan says something changes.

### Cut from the mockup, and why
| Mockup element | Decision | Why |
|---|---|---|
| "Your Day" calendar timeline (10:00 Focus time … 7:00 Free) | **Post-V1.** Later shows only fixed-time intentions | Needs calendar integration (explicitly out of V1). Without real events it's fiction |
| Focus timer widget (25 min ± / Start) | **Not on Today.** Timer appears in the session bar once *Start with Lumi* begins a session (M5) | A second "start" control competes with the one that matters; a timer sitting idle is a small pressure |
| Quick capture (Add a task · Task/Note/Idea) | **Not in V1.** Chat is capture; Lumi files it | A second input surface with a type picker is a system to manage. Revisit if chat-capture proves too slow in daily use |
| "1 of 3" carousel on Right now | **Cut.** *Not this* is the only way to change the current task | A carousel invites scanning options — exactly what one-thing-dominates prevents |
| Today / This Week / Someday tabs | **Lists' job.** Today has no tabs | Horizon-switching is planning, not starting |
| Search, settings icons in the header | **Settings stays in nav; search post-V1** | Nothing to search yet |
| "Other items (2)" | **Replaced** by a wordless collapse ("A few more, when you get there") | A count of undone things — see `ef-burden-log.md` |
| "Small steps still move the world." (sidebar) | **Keep as the sidebar aside** if it stays the *only* line of its kind | Borderline inspirational; the brief's own rule says warmth comes from Lumi, not copy. One aside is the ceiling |

## Lists (the pile)
Introduced by this brief as a first-class section: the user's broader structure, in named lists (School · Work · Personal · Later by default; user-editable). Rows: title, optional next action, optional estimate, optional due date. Lumi files new intentions into a list conversationally; the user can move/reorder. Lists is where planning-brain lives so Today doesn't have to. Full spec when it's built (M3 minimum: list assignment + a plain per-list view; reorder and drag later). It reverses the 2026-09-11 "not built" verdict on the Lists mockup: the *interaction model* concerns stand (no per-column counts, no due-date on every row unless set, one "Add" affordance, not five), the *section* is in.

## How the plan is built
`core/ai/plan.ts` → `buildDayPlan(inputs) → DayPlan`. Curation is judgement, so the **model proposes** (structured output) and **code applies guardrails**, the same pattern as beliefs.

Inputs (all already in the domain, or added below): open intentions with list, estimate, due_at, last_touched_at; today's capacity report; time now and time left in the day (user timezone); fixed-time intentions today; avoidance signals from `events` (touched repeatedly, declined before, never started); recent conversation summary; relevant beliefs (strategies, patterns, preferences).

Output:
```ts
type DayPlan = {
  localDate: string;
  capacity?: "low" | "normal" | "high";
  dayLine: string;                 // "You've got practicum at 5. Nothing else is time-sensitive."
  rightNow: { intentionId; firstStep: string };
  afterThat: { intentionId }[];    // ≤ 3
  later: { intentionId }[];        // fixed-time today, by time
  restCanWait: boolean;            // open intentions exist beyond the path
  closingLine?: string;            // "These three are enough for today."
};
```
Guardrails: Right now must be open and not declined today; After that ≤ 3 (≤ 1 on a low day); Later is exactly the fixed-time set, code-derived; no counts in any line; lines pass the voice rules. Regenerated when: a new local day starts; capacity is reported or changed; *Not this* (with the reason as input); the user asks in chat ("replan", "what should I do now"). Advanced (not regenerated) when Right now is completed.

Persisted in `day_plans` so the path is **stable across reloads** — the one thing must not change every time the page opens.

**Cut before it's needed.** Generation is primed in the background when the app is opened (home page) and after every chat turn, so Today normally finds the plan already there instead of waiting several seconds on the model. If the day's plan was cut with nothing to choose from (or everything on it has been ticked off) and intentions have since arrived — brain-dump in chat, then Today — it is re-cut once (`reason: first_items`). A plan with a Right now is never touched by this.

**Re-cut only on purpose (M4).** The one thing moves on three triggers and no others: a capacity answer (`capacity`; skipped when it matches what the plan assumed), a *Not this* answer (`declined`), and letting things go during the coming-back pass (`reentry`). Chat-side triggers are applied once after the reply streams.

**Asked in chat (`asked`, 2026-09-12).** "I need an easy task", "what should I do now", "quick wins", a replan: Lumi picks the thing in her reply and calls `reshape_today` with the ask in the user's words and the id (and first step) of what she picked. After the reply, the path is re-cut with the ask as a planner input — the ask outranks the default order, the day line may answer it in a few words — and `clampPlan` pins Lumi's pick as Right now so Today shows what she just said. The pin wins over a decline earlier today (the ask is the user's later word). If she names nothing, the planner chooses within the ask. In the same turn an ask wins over a capacity or decline re-cut; both still reach the planner from the snapshot. The ask is kept on the `plan.generated` event, not on the row. Nothing on Today asks for or shows the ask.

## Domain additions (proposed; migration when built)
| Change | Why |
|---|---|
| `intentions.list` text null | Lists membership (free label, user-editable list names) |
| `intentions.estimate_minutes` int null | "~40 min" pills; Lumi infers when unstated; `effort_hint` stays as the coarse fallback |
| `day_plans` (id, user_id, local_date, capacity, plan jsonb, generated_at, reason: 'new_day'\|'first_items'\|'capacity'\|'declined'\|'asked'\|'advanced') | Stable path per day; history of how the day was re-cut |
| events: `plan.generated {reason}`, `plan.advanced`, `intention.declined {reason}`, `capacity.asked` | *Not this* reasons are the richest learning signal in the product — "too big" three times on the same kind of task is an `anti_pattern` belief waiting to be written |

## Handoffs into chat
- **Start with Lumi** → `/` with a structured user message (`{ kind: "start_intention", intentionId }` in metadata; visible text "Let's start: *Finish discussion post*"). Lumi runs initiation and may open a focus session (M5).
- **Not this** → the six quick answers appear in place on the card under "Fair. What's getting in the way?" (plus a quiet *Keep it*); the tapped answer posts as a `{ kind: "declined", intentionId, reason }` message ("Not this one: *title* — too big."); Lumi replies to the reason; the plan regenerates with it. Built M4.
- **Break it down** → chat with `{ kind: "break_down", intentionId }`.
Each is a real user message in the one transcript (decision #11 in `architecture.md`).

## Milestone re-cut
- **M3 — Intentions, beliefs, Lists (minimum), Today v1:** tools + ledger lines as planned, plus `list`/`estimate_minutes`, a plain Lists page, and Today rendering a generated `DayPlan` with Right now / After that / Later and *Start with Lumi* → chat handoff. No capacity prompt yet; *Not this* posts to chat but the plan only regenerates on the next day or when asked.
- **M4 — Capacity, Not this, re-entry:** capacity prompt + regeneration; declined reasons feed the plan and beliefs; the re-entry pass rebuilds the plan after a gap.
- **M5 — Focus Together:** *Start with Lumi* can open a session; session bar with the timer; check-ins.
- **M6/M7** unchanged.

## Open questions for Chanté
1. **The product is "Lumen" now?** The brief and mockup say Lumen; the wordmark, `<title>`, docs and repo still say Lumi. If yes, it's a rename pass (cheap now, expensive after launch). The character stays Lumi either way.
2. **Nav:** the mockup shows Today · Lists · Focus · Chat · Insights · Archive. Proposal: **Today · Lists · Chat · Settings** in V1 (Focus lives inside Chat/sessions; Insights and Archive post-V1), Today first as the landing page once it exists — Chat remains the landing until M3 ships.
3. **Should Today become the landing page** at M3, with the conversation one click away? The brief implies yes.
