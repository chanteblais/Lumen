# Product decisions

*Decisions that constrain how Coherence behaves, kept with their reasoning so later work can change the implementation without breaking the reason. Newest first. Implementation choices (how a sheet is cut, which table holds what) belong in the engineering log, [`docs/decisions.md`](../decisions.md). § numbers refer to the [Product Vision](../philosophy/product-vision.md).*

**Each entry:** Decision · Rationale · Implications · Principle · Replaces. A superseded or contested entry stays where it is, marked, with a link. Where a rationale is Claude's reading and not Chanté's words, it says so.

---

## 2026-09-12 · The Product Vision is foundational

**Decision.** [`docs/philosophy/product-vision.md`](../philosophy/product-vision.md) is the foundation of the canon. When product, UX, AI or technical decisions are ambiguous, its principles take precedence over conventional productivity-software assumptions.
**Rationale.** Coherence deliberately rejects patterns that are individually reasonable (more features, more structure, more engagement). Without a stable written foundation, the product drifts back toward them one reasonable feature at a time.
**Implications.** Every other canonical document answers to the vision. A change that contradicts it is surfaced to Chanté before anything is edited. [`PROJECT-CANON.md`](../../PROJECT-CANON.md) maps it to the rest.
**Replaces.** [`product.md`](../product.md) as the statement of the philosophy. Its voice guide stays until `philosophy/lumi.md` exists.

**Addendum, same day.** [`docs/philosophy/experience-principles.md`](../philosophy/experience-principles.md) joins the vision as canonical: the vision says why, the principles say how. Its *in practice* examples illustrate; they aren't specs. Its *watch for* lists and four tests (one-second, cognitive-load, maintenance, Coherence) apply to every review. It replaces [`design-philosophy.md`](../design-philosophy.md) §3 and [`today.md`](../today.md)'s general principles as the statement of interaction rules.

## 2026-09-12 · Direct manipulation is correction that teaches Lumi

**Decision.** The user can correct Lumi's organisation by hand, and every manual move tells Lumi something. In Lists, a vertical drag says relative priority, a horizontal drag says category, and moving something to *Later* says stop foregrounding it. Correcting is never required: Lumi organises first. (EP§5–6, EP§16)

**Previous approach → why it changed → current approach.**
- **Before (2026-09-11):** the Lists mockup's *drag-to-prioritise* was rejected with its per-column counts and five Add buttons, as maintenance the user would have to keep up ([`ef-burden-log.md`](../ef-burden-log.md)). Reorder was deferred ("later", [`today.md`](../today.md)). Moving things between lists happens in conversation.
- **Why it changed:** the objection was to *required* sorting, where the user keeps order so the system works. EP§6 draws the line in a different place: a correction is cheaper than configuration, and a manual move is valuable "when it expresses judgment rather than administrative maintenance" (EP§16). A drag that also updates Lumi's understanding is the opposite of maintenance.
- **Now:** optional correction by hand, reflected in Lumi's context. Counts, a due date on every row, and more than one Add stay out.

**Implications.**
- Not built. Lists has the tick only, and the planner doesn't treat *Later* as "don't foreground".
- A manual move must reach Lumi as an event and, where it means something durable, a belief. Changes that aren't reflected in AI context are a *watch for* (EP§16, EP§18).
- "Requiring manual sorting Lumi could perform" remains a *watch for*. Nothing may depend on the user dragging.
- The design choices are open question 20.

**Principle.** EP§5, EP§6, EP§16, EP§18.
**Replaces.** The *drag-to-prioritise* rejection in the EF-burden log's Lists-board row, and "reorder and drag later".

## 2026-09-12 · Four places, each answering one question

**Decision.** Coherence is organised as places that embody cognitive activities, each answering one question:
- **Home**: *Here I am.* Arriving, talking, reflecting, returning.
- **Garden** (Today): *What matters today?* Tending what deserves attention now.
- **Library** (Lists): *Where have I been?* Organising and retrieving what the system is holding.
- **Study** (Focus): *What am I doing now?* Giving attention to one thing.

**Rationale.** §14: places can become familiar, Lumi can inhabit them, and they can grow with the user's history, so the product feels inhabited rather than operated. A question per place tells the user what it is for without learning an interface, and gives each place a test for what belongs in it. *(The question-as-test framing is Claude's reading.)* The Home rename made the same move first: "Chat" named the mechanism, "Home" the place.

**Implications.**
- **Home asks nothing of you.** It is Lumi's home, calm, the open conversation. Anything on Home that asks for something needs a reason to stay or a different room (open question 1).
- **Today becomes the Garden:** *what needs tending now?*, not *what remains incomplete?* (§15). *A path, not a pile* (below) still governs what it shows. Not every task becomes a literal plant.
- **Lists lives in the Library,** which grows richer as history accumulates (§14).
- **Focus lives in the Study.** Sessions currently run on Home (open question 2).
- Places grow with relationship, continuity and accumulated life, **not points** (§14).
- A new feature starts by asking which place's question it answers. If it answers none, that is a warning sign.
- The code still has *Home · Today · Lists · Insights · Settings*. Insights has no place yet (question 4). Whether the user sees *Today* or *Garden* is question 15.

**Principle.** §11 (only what the current decision needs), §14.
**Replaces.** The V1 nav *Home · Today · Lists · Insights · Settings* as the intended model ([`features.md`](../features.md) → Navigation).

## 2026-09-12 · Rewards: earning coherence ⚠ contested

> **Status: contested by the Product Vision.** Recorded from Chanté's message on 2026-09-12, before the vision was added. The vision's §14 says *"inhabited, not gamified … The user is not earning decorations for completing tasks … Growth should feel like expansion, not reward"*, and §20 says Coherence is not *"a gamified habit tracker"*. The Experience Principles go further: EP§14, *"Growth reflects history, not achievement"*, lists points, currencies, unlock requirements and completion-based decoration as things to watch for, and EP§20 warns against "rewards intended to bring users back without functional reason". Nothing below is a requirement until Chanté reconciles them ([open question 14](open-questions.md)).

**As described.** Coherence gamifies. The user earns *coherence* for completing tasks and for just showing up, and spends it on plants or little things for Lumi that she engages with. Always positive, with no negative consequences.

**Rationale given.** From Chanté's notes: recognise the behaviours ADHD brains rarely get credit for (showing up, beginning, returning), and "recognize consistency without turning absence into loss."

**What both versions agree on.** Nothing decays, wilts, empties or is lost. No streaks. Absence costs nothing and returning is welcomed (§8, §12). Whatever form growth takes, a hard week never makes the places sadder.

**Replaces, if adopted.** "Explicitly not in V1: … gamification, streaks" ([`product.md`](../product.md)).

## 2026-09-12 · The design direction is inhabited, painted places

**Decision.** Coherence moves toward much more imagery and animation: painted isometric places behind the spaces, and Lumi animated within them.

**Rationale.** §14: the product should feel inhabited, with familiar places Lumi lives in. [`art-direction.md`](../art-direction.md) §3 adds what the painted world gives that the book couldn't: warmth, a reason to come back that isn't a to-do list, and Lumi as company rather than an icon.

**Implications.**
- "No decorative imagery" and "Lumi only as a small avatar" no longer hold.
- The places should be pleasant enough to return to without becoming an attention trap (§18). So far the painting sits behind and the type leads, on Home and on the Garden.
- The rules a painted world must keep are *proposed* in `art-direction.md` §3, not decided.
- `design-philosophy.md` and `product.md` → Visual direction are out of date until `docs/design/visual-language.md` replaces them.

**Principle.** §13–14, §18.
**Replaces.** "Antique book × modern editorial interface … No decorative imagery" (`product.md`) and the order of permission in `design-philosophy.md` §2. The path here: printer's ornaments as the only decoration → a painted room behind Home → a painted garden behind Today → inhabited places as the direction (all 2026-09-12).

## 2026-09-12 · The product is Coherence; Lumi is she

**Decision.** The product is **Coherence** (formerly Lumen). The companion is **Lumi**, she/her, in the medallion costume. Rooms are isometric.
**Rationale.** §19: the name is about reducing fragmentation at every scale, from *what do I do next?* to *what am I trying to move forward in my life?*
**Replaces.** Lumen, and Lumi as "he". What was renamed is in the engineering log.

---

## Foundations from the first build (2026-09-11 → 12)

Distilled from the engineering log, [`product.md`](../product.md) and [`today.md`](../today.md). All still in force, and all consistent with the vision.

### The one question overrides convention · 2026-09-11

**Decision.** Every design and implementation choice is checked against *does this reduce the user's executive-function burden, or accidentally create more of it?*, ahead of conventional productivity patterns.
**Rationale.** Productivity systems require the executive functions they are meant to support (§1).
**Implications.** Anything that asks the user to set, keep, rate, confirm or remember something, or shows a count of undone things, gets an EF-burden-log row before it is built. Derived beats asked.
**Principle.** §1, §21.

### A companion, not a task manager; the conversation is capture · 2026-09-11

**Decision.** The primary interface is a conversation with Lumi. She files, updates and closes things through tools; there is no second capture surface.
**Rationale.** A form with fields and a type picker is a system to manage. Lumi turning natural conversation into structure is exactly §4's example.
**Implications.** Lists' one *Add* opens the conversation. Lumi in the corner can be told things from any page.
**Principle.** §4.
**Replaces.** Quick capture from the Today mockup (deferred, to revisit if chat capture proves slow in daily use).

### Today is a path, not a pile · 2026-09-12

**Decision.** Today visually prioritises one current action rather than displaying the complete daily task list.
**Rationale.** Showing many equally weighted tasks transfers prioritisation burden back to the user, which conflicts with reducing executive-function overhead.
**Implications.** Everything else is progressively disclosed as *After that* (≤ 3) and *Later* (fixed times only), or lives elsewhere. "Everything else can wait" is real prioritisation information. The path is stable across reloads and re-cut only on purpose. It still holds inside the Garden.
**Principle.** §11.

### Lumi proposes; the user decides · 2026-09-12

**Decision.** Lumi's plan is a proposal. *Not this* changes it in one tap, with a reason, and is never recorded as failure. A request in the user's own words ("something easy") outranks Lumi's order.
**Rationale.** Authority stays with the user. Resistance says something about their state, which makes it the richest learning signal the product has.
**Implications.** No carousel of alternatives; *Not this* is the one way to change the current thing. Reasons feed Lumi's beliefs, not a record.
**Principle.** §5, §9.

### Never a count of what's undone; coming back is a greeting · 2026-09-11

**Decision.** No overdue counts, badges, unread counts or "1 of 3". Returning after a gap is met with an offer to help work out what's still relevant.
**Rationale.** A count is a bill, and returning costs most when the user has the least capacity to pay it (§8).
**Implications.** Collapses without numbers ("A few more, when you get there"). Lumi does the going-through during re-entry. Staleness is derived and never shown as a number.
**Principle.** §8, §12.

### Derived, not maintained · 2026-09-11

**Decision.** Lumi's understanding of the user (beliefs, with confidence and evidence) comes from what they say and what happens. The user never rates, tags or configures what behaviour can reveal. Tone is learned, not set.
**Implications.** No settings for things behaviour can reveal. The planned *What Lumi knows* page is for correcting, not curating.
**Principle.** §16.

### Quiet by default · 2026-09-11

**Decision.** Lumi speaks unprompted only at check-ins the user agreed to. The greeting and the check-ins are deterministic.
**Rationale.** Effective presence is often quiet (§7). An unprompted message is a small demand.
**Implications.** Any future notification must clear this bar (open question 9).
**Principle.** §7, §18.

### A session's end is a fact, not a request · 2026-09-12

**Decision.** Focus sessions start only through Lumi. *Done* and *End* close a session in code, with no "did you finish?". A session left open is offered back once and never treated as a failure.
**Rationale.** Three asks up front, none during: the body double doesn't interrogate.
**Implications.** No timer controls to configure. No stats, streaks or session history.
**Principle.** §7, §12.

### Mail is a look, not an inbox · 2026-09-12

**Decision.** Lumi reads recent mail read-only and asks one question per thing she noticed, with two answers: *Still needs doing* or *Let it go*.
**Rationale.** A second inbox would be a second system to manage.
**Implications.** No unread or "needs reply" counts, no refresh button, no sync, no stored mail.
**Principle.** §4, §11.
