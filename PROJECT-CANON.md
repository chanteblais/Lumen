# Coherence — Project Canon

*The entry point to the canon. Before substantial product, UX, AI-behaviour or design work, read this, then the documents it points to for that kind of work. It is a map: each line here points to where the reasoning lives.*

*Status, 2026-09-12: the canon is being assembled. The foundational Product Vision hasn't been added yet. Until each canonical document exists, the interim sources named below stand in for it. Where an interim source disagrees with [`docs/living/decisions.md`](docs/living/decisions.md), the decision wins.*

---

## What Coherence is

An AI companion for **task initiation, momentum, re-entry and body doubling** — for people for whom starting, choosing and coming back are the hard part. **Not a task manager.** You talk to Lumi; she keeps track, proposes the next thing, and keeps you company while you do it.

**The problem.** Productivity tools hand the user a system to run: lists to groom, priorities to set, overdue counts to face. When executive function is the scarce resource, running the system *is* the obstacle, so the tool gets abandoned, and coming back means facing what piled up. Coherence takes the managing away: *you don't have to be productive enough to use your productivity system.*

**The question that overrides everything:**

> Does this reduce the user's executive-function burden, or accidentally create more of it?

In practice: the user should carry less cognitive load after opening a page than before opening it.

## Principles — constraints, not tone

1. **One thing at a time.** A surface proposes one next action; the rest is progressively disclosed, not listed at equal weight.
2. **Lumi proposes; the user remains the authority.** Declining is never a failure. Resistance is information about the user's state.
3. **Derived, not maintained.** Anything the user would have to keep current is inferred from behaviour or not shown. The user never rates or tags anything.
4. **Re-entry is a first-class problem.** Coming back after a gap is met with a greeting, never a report. Design persistence, overdue things, notifications and session state for the person who returns.
5. **No guilt, no loss.** No counts of undone things, no streaks, no red, no "you missed". Rewards only ever give.
6. **Initiation over planning.** Find the smallest step across the threshold. Capacity decides how much the day holds.
7. **Quiet, and then out of the way.** Lumi speaks when spoken to and at check-ins the user agreed to. Success is the user leaving to act, not staying to engage.

## Lumi

She/her. The companion: a good body double, not a motivational speaker or a generic chatbot. Calm, warm, observant, concise, lightly playful, capable of gentle challenge. A small hooded figure with glowing eyes, brass medallions and a lantern. She is on every page and lives in Home.

## The spaces

Each room answers one question (decided 2026-09-12).

| Room | Its question | What it is | In the app now |
|---|---|---|---|
| **Home** | *Here I am.* | Lumi's home. Calm, asks nothing of you: the open conversation with her. | `/`, set in the painted room. Still asks a few things and hosts focus sessions (open question 1) |
| **Garden** | *What matters today?* | Where you cultivate: plant, nurture, grow. One thing now, a short path, everything else can wait. | `/today`. The garden painting is on the unmerged `ux/today-garden` branch |
| **Library** | *Where have I been?* | To be designed | Not built. Where Lists and Insights belong is open (questions 3–4) |
| **Study** | *What am I doing now?* | To be designed | Not built. Focus sessions currently live on Home (question 2) |

Settings is a utility, not a room.

**Rewards.** You earn *coherence* for showing up and for completing things, and spend it on plants and small things for Lumi that she engages with. It is always positive: nothing is lost, withers or is taken away.

## Design direction

The direction is moving from *an antique book with no decorative imagery* to **a painted, animated world**: isometric painted places behind the spaces, with Lumi animated within them. The shipped interface still speaks the book's language (serif type, ivory paper, fine rules), laid over the paintings. How much of the book survives is an open question (13). So far the painting sits behind and the type leads.

---

## The canonical documents

| Document | Holds | Status |
|---|---|---|
| `docs/philosophy/product-vision.md` | Why Coherence exists; the foundational philosophy | **To come** (Chanté) |
| `docs/philosophy/experience-principles.md` | The principles above, with their reasoning | To come. Interim: [`product.md`](docs/product.md), [`today.md`](docs/today.md) §Principles, [`design-philosophy.md`](docs/design-philosophy.md) §3 |
| `docs/philosophy/lumi.md` | Who Lumi is, her voice, her role | To come. Interim: [`product.md`](docs/product.md) → Lumi's voice; [`art-direction.md`](docs/art-direction.md) §2, §5 |
| `docs/product/ai-and-information-architecture.md` | How the AI understands and acts, and why | To come. Interim: [`architecture.md`](docs/architecture.md) (the how) |
| `docs/product/spaces.md` | The rooms and what belongs in each | To come. Interim: the table above |
| `docs/product/today-garden.md` | The Garden | To come. Interim: [`today.md`](docs/today.md) |
| `docs/product/lists-library.md` | The Library | To come |
| `docs/product/focus-study.md` | The Study | To come. Interim: [`features.md`](docs/features.md) → Focus Together |
| `docs/design/visual-language.md` | The look of the world and the interface | To come. Interim: [`art-direction.md`](docs/art-direction.md), [`design-system.md`](docs/design-system.md); `design-philosophy.md` is partly superseded |
| `docs/design/motion-and-interaction.md` | How Lumi and the interface move | To come. Interim: [`art-direction.md`](docs/art-direction.md) §4–5, [`animation-pipeline.md`](docs/animation-pipeline.md) |
| [`docs/living/decisions.md`](docs/living/decisions.md) | Product decisions, with rationale and what they replaced | Live |
| [`docs/living/open-questions.md`](docs/living/open-questions.md) | What isn't decided | Live |
| [`docs/living/ideas.md`](docs/living/ideas.md) | Possibilities, with statuses | Live |
| `docs/living/brand-strategy.md` | Brand | To come |

How the code works, and how to work in the repo, is indexed in [`docs/README.md`](docs/README.md).

## What to read for which work

| Work | Read |
|---|---|
| A new feature, a UX change, navigation, information architecture | The spaces above → the room's doc → decisions → open questions → [`ef-burden-log.md`](docs/ef-burden-log.md) |
| Lumi's behaviour, AI, memory, proactivity, notifications | Product vision → Lumi → AI & information architecture → decisions |
| Prioritisation, planning, the Garden | Garden doc → decisions (*path, not a pile*; *Lumi proposes*) |
| Rewards, gamification, engagement | Rewards above → decisions → open questions 6–8 → ideas → the EF-burden log |
| Re-entry, onboarding, overdue things, session state | Product vision → decisions (*never a count*, *a session's end is a fact*) |
| Visual design, paintings, animation | Visual language, motion → [`art-direction.md`](docs/art-direction.md) → [`animation-pipeline.md`](docs/animation-pipeline.md) |
| Pure implementation with no change in behaviour | `CLAUDE.md`, [`architecture.md`](docs/architecture.md), [`domain.md`](docs/domain.md); the canon only if behaviour moves |

## How the canon works

- **Code says what the product does; the canon says what it is trying to become.** Neither silently overrides the other. When they disagree, name it and settle it with Chanté: change the code, correct the doc, or record an open question. Don't pick whichever is easier to build.
- **Status matters.** Only decisions, and the settled parts of canonical documents, are requirements. Ideas stay ideas until accepted. Open questions stay open until decided. A passing idea in conversation is not canon.
- **Keep the reasoning.** A decision records why, what it implies and what it replaced. When direction changes, write *previous approach → why it changed → current approach* instead of deleting the history.
- **Plans for substantial product work carry a short *Canon alignment*:** the principles involved, how the design serves them, the tensions, and which docs change. Skip it for small tasks.
- **When the product moves,** update the affected canonical doc, then the decision log, then the open questions. Update this file only when the high-level model changed. Surface a contradiction of a foundational principle before editing the principle.
- **Watch for drift:** the Garden becoming a task dashboard; lists needing grooming; Lumi turning into a generic chatbot or an authority; metrics added because apps have them; motivational copy; paintings becoming clutter; rewards standing in for real growth; engagement over action. Flag drift. Don't refactor large areas without discussing first.
- **Prune now and then.** When a doc or passage becomes clearly irrelevant, move it to `docs/archive/` with a line on what replaced it. Documents get reorganised as the canon grows, with care while other branches are editing them.
