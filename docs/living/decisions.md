# Product decisions

*Decisions that constrain how Coherence behaves, kept with their reasoning so later work can change the implementation without breaking the reason. Newest first. Implementation choices (how a sheet is cut, which table holds what) belong in the engineering log, [`docs/decisions.md`](../decisions.md).*

**Each entry:** Decision · Rationale · Implications · Principle · Replaces. A superseded entry stays where it is, marked, with a link to what replaced it. Where a rationale is Claude's reading and not Chanté's words, it says so.

---

## 2026-09-12 · Four rooms, each answering one question

**Decision.** Coherence is organised as places, each answering one question:
- **Home**: *Here I am.*
- **Garden**: *What matters today?*
- **Library**: *Where have I been?*
- **Study**: *What am I doing now?*

**Rationale.** *(Claude's reading, to confirm.)* A question per place tells the user what the place is for without learning an interface, and gives each place a test for what belongs in it. Pages named after mechanisms (Chat, Lists, Insights) described the software, not the user's moment. The Home rename made the same move first: "Chat" named the mechanism, "Home" the place.

**Implications.**
- **Home asks nothing of you.** It is Lumi's home, calm, the open conversation with her. Anything on Home that asks for something needs a reason to stay or a different room (open question 1).
- **Today becomes the Garden:** cultivating, planting, nurturing, growing. *A path, not a pile* (below) still governs what the Garden shows.
- The Library and the Study are to be designed. Where Lists, Insights and focus sessions belong is open (questions 2–4).
- A new feature starts by asking which room's question it answers. If it answers none, that is a warning sign.
- The code still has *Home · Today · Lists · Insights · Settings*.

**Principle.** One thing at a time; less load after opening than before.
**Replaces.** The V1 nav *Home · Today · Lists · Insights · Settings* as the intended model ([`features.md`](../features.md) → Navigation).

## 2026-09-12 · Rewards only ever give: you earn coherence

**Decision.** Coherence gamifies. The user earns *coherence* for completing tasks and for just showing up, and spends it on plants or little things for Lumi that she engages with. It is always positive and has no negative consequences.

**Rationale.** From Chanté's notes: recognise the behaviours ADHD brains rarely get credit for (showing up, beginning, returning), and "recognize consistency without turning absence into loss." *(Claude's reading:)* the earlier ban on gamification guarded against streaks, scores and guilt. A reward that can only be given, never taken, keeps that protection while adding warmth and a reason to return that isn't a to-do list.

**Implications.**
- Nothing decays, wilts, empties or is lost. A garden that suffers in a hard week is a streak in disguise.
- No streak counters. Absence costs nothing, and returning is welcomed.
- Showing up earns on its own, so being rewarded doesn't depend on being productive.
- Spending is optional: nothing in the app requires buying anything to keep working. Whether bought things need care is open (question 7). If they do, neglect can't cost anything.
- Every reward mechanic gets an [`ef-burden-log.md`](../ef-burden-log.md) row: a balance is a number and a shop is a choice.

**Principle.** No guilt, no loss; re-entry is first-class; the one question.
**Replaces.** "Explicitly not in V1: … gamification, streaks" ([`product.md`](../product.md)) and "We are never: … gamified" ([`design-philosophy.md`](../design-philosophy.md) §3). Streaks stay out.

## 2026-09-12 · The design direction is a painted, animated world

**Decision.** Coherence moves toward much more imagery and animation: painted isometric places behind the spaces, and Lumi animated within them.

**Rationale.** Chanté's direction. [`art-direction.md`](../art-direction.md) §3 names what the world gives that the book couldn't: warmth, a reason to come back that isn't a to-do list, and room for Lumi to be company instead of an icon. That is the body-doubling promise made visible.

**Implications.**
- "No decorative imagery" and "Lumi only as a small avatar" no longer hold.
- Imagery still answers to the one question. So far the painting sits behind and the type leads, on Home and on the Garden.
- The rules a painted world must keep are *proposed* in `art-direction.md` §3, not decided.
- `design-philosophy.md` and `product.md` → Visual direction are out of date until `docs/design/visual-language.md` replaces them.

**Principle.** The one question; quiet.
**Replaces.** "Antique book × modern editorial interface … No decorative imagery" (`product.md`) and the order of permission in `design-philosophy.md` §2, where imagery wasn't on the list. The path here: printer's ornaments as the only decoration (the graphics pass) → a painted room behind Home → a painted garden behind Today → the world as the direction (all 2026-09-12).

## 2026-09-12 · The product is Coherence; Lumi is she

**Decision.** The product is **Coherence** (formerly Lumen). The companion is **Lumi**, she/her, in the medallion costume. Rooms are isometric.
**Replaces.** Lumen, and Lumi as "he". Details and what was renamed are in the engineering log.

---

## Foundations from the first build (2026-09-11 → 12)

Distilled from the engineering log, [`product.md`](../product.md) and [`today.md`](../today.md). All still in force.

### The one question overrides convention · 2026-09-11

**Decision.** Every design and implementation choice is checked against *does this reduce the user's executive-function burden, or accidentally create more of it?*, ahead of conventional productivity patterns.
**Rationale.** Productivity systems accrete maintenance until the system is the obstacle. *You don't have to be productive enough to use your productivity system.*
**Implications.** Anything that asks the user to set, keep, rate, confirm or remember something, or shows a count of undone things, gets an EF-burden-log row before it is built. Derived beats asked.

### A companion, not a task manager; the conversation is capture · 2026-09-11

**Decision.** The primary interface is a conversation with Lumi. She files, updates and closes things through tools; there is no second capture surface.
**Rationale.** A form with fields and a type picker is a system to manage. Saying it once, in your own words, is the lowest-effort input.
**Implications.** Lists' one *Add* opens the conversation. Lumi in the corner can be told things from any page.
**Replaces.** Quick capture from the Today mockup (deferred, to revisit if chat capture proves slow in daily use).

### Today is a path, not a pile · 2026-09-12

**Decision.** Today visually prioritises one current action rather than displaying the complete daily task list.
**Rationale.** Showing many equally weighted tasks transfers prioritisation burden back to the user, which conflicts with reducing executive-function overhead.
**Implications.** Everything else is progressively disclosed as *After that* (≤ 3) and *Later* (fixed times only), or lives elsewhere. "Everything else can wait" is real prioritisation information. The path is stable across reloads and re-cut only on purpose. It still holds inside the Garden.
**Principle.** One thing at a time.

### Lumi proposes; the user decides · 2026-09-12

**Decision.** Lumi's plan is a proposal. *Not this* changes it in one tap, with a reason, and is never recorded as failure. A request in the user's own words ("something easy") outranks Lumi's order.
**Rationale.** Authority stays with the user. Resistance says something about their state, which makes it the richest learning signal the product has.
**Implications.** No carousel of alternatives; *Not this* is the one way to change the current thing. Reasons feed Lumi's beliefs, not a record.

### Never a count of what's undone; coming back is a greeting · 2026-09-11

**Decision.** No overdue counts, badges, unread counts or "1 of 3". Returning after a gap is met with an offer to help work out what's still relevant.
**Rationale.** A count is a bill, and the returning user is the most fragile one.
**Implications.** Collapses without numbers ("A few more, when you get there"). Lumi does the going-through during re-entry. Staleness is derived and never shown as a number.
**Principle.** Re-entry is first-class; no guilt.

### Derived, not maintained · 2026-09-11

**Decision.** Lumi's understanding of the user (beliefs, with confidence and evidence) comes from what they say and what happens. The user never rates, tags or configures what behaviour can reveal. Tone is learned, not set.
**Implications.** No settings for things behaviour can reveal. The planned *What Lumi knows* page is for correcting, not curating.

### Quiet by default · 2026-09-11

**Decision.** Lumi speaks unprompted only at check-ins the user agreed to. The greeting and the check-ins are deterministic.
**Rationale.** Silence is part of body doubling. An unprompted message is a small demand.
**Implications.** Any future notification must clear this bar (open question 9).

### A session's end is a fact, not a request · 2026-09-12

**Decision.** Focus sessions start only through Lumi. *Done* and *End* close a session in code, with no "did you finish?". A session left open is offered back once and never treated as a failure.
**Rationale.** Three asks up front, none during: the body double doesn't interrogate.
**Implications.** No timer controls to configure. No stats, streaks or session history.

### Mail is a look, not an inbox · 2026-09-12

**Decision.** Lumi reads recent mail read-only and asks one question per thing she noticed, with two answers: *Still needs doing* or *Let it go*.
**Rationale.** A second inbox would be a second system to manage.
**Implications.** No unread or "needs reply" counts, no refresh button, no sync, no stored mail.
