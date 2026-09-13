# Coherence — Project Canon

*The entry point to the canon. Before substantial product, UX, AI-behaviour or design work, read this, then the documents it points to for that kind of work. It is a map: each line points to where the reasoning lives. The foundation is the [Product Vision](docs/philosophy/product-vision.md) (§ numbers below refer to it).*

---

## What Coherence is

> A context-aware companion and personal organization system that helps a person understand what matters, begin when beginning is difficult, stay with something when useful, and find their way back when they lose the thread. (§20)

**The problem (§1–2).** Most productivity systems require exactly the executive functions they are meant to support: capturing, categorising, prioritising, reviewing, noticing staleness, coming back. Coherence starts from the opposite assumption: *a productivity system should reduce the executive-function burden required to maintain the productivity system itself.* The goal is coherence between **intention → priority → capacity → attention → action**, not more output.

**The test (§21).** Before any feature, workflow, notification, screen, AI behaviour or metric: does it reduce or increase the burden of using Coherence? Does it help the user orient, preserve their authority, fit their capacity, and make starting and returning easier? Does it help them engage with their life, or only with the app? Treat power that comes with more maintenance with suspicion.

## Principles — constraints, not tone

1. **Hold more so the user can hold less.** Lumi carries the organisational burden and the user keeps authority. Automate administration, never agency. (§4)
2. **Lumi proposes. The user corrects. Lumi learns.** An inferred priority is never presented as objective truth. (§5)
3. **Show what the current decision needs,** not everything available. Propose a path; don't hand over a pile. (§11)
4. **Initiation is its own problem.** Cross the smallest meaningful threshold instead of producing a plan. (§6)
5. **Presence, often quiet.** "We're doing this together", without constant talk. (§7)
6. **Re-entry and continuity are first-class.** Coming back restores coherence and never exposes accumulated failure. "Where were we?" works at every scale. (§8, §17)
7. **Resistance is information.** *Not this* makes Lumi curious, not insistent. (§9)
8. **Capacity is context.** A low day becomes smaller: not redder, not more overdue. (§10)
9. **Appropriate forward movement, not maximum output.** Sometimes the coherent action is to stop. (§3)
10. **Accountability without punishment.** No streaks, red counts, scores or failure states. Lumi can still be direct about a pattern. (§12)
11. **Warmth from relationship, not slogans.** (§13)
12. **Easier the better it knows you.** Personalisation removes configuration; it doesn't add it. (§16)
13. **Support a life, not become one.** Success is the user leaving to do the thing. (§18)

## Lumi

She/her. The companion: a presence that makes it easier to begin and to keep going (§7). Not a generic chatbot, a motivational coach or an authority. Calm, warm, observant, concise, lightly playful, capable of gentle challenge. A small hooded figure with glowing eyes, brass medallions and a lantern. She is on every page and lives in Home.

## The spaces

Places that embody cognitive activities (§14). Each answers one question (Chanté, 2026-09-12).

| Room | Question | What happens there (§14) | In the app now |
|---|---|---|---|
| **Home** | *Here I am.* | Arriving, talking, reflecting, returning. Lumi's home; asks nothing of you | `/`, the painted room, the conversation. Also hosts focus sessions |
| **Garden** (Today) | *What matters today?* | Tending what deserves attention now: *what needs tending?*, not *what remains incomplete?* (§15) | `/today`, the path. The garden painting is on unmerged `ux/today-garden` |
| **Library** (Lists) | *Where have I been?* | Organising and retrieving what the system is holding; richer as history grows | `/lists`, plain. Insights (mail) has no room yet |
| **Study** (Focus) | *What am I doing now?* | Giving attention to one thing | Not a place yet; sessions run on Home |

The places may grow more established, richer and more familiar, but growth should represent relationship, continuity and accumulated life, **not points** (§14). Settings is a utility, not a room.

**Rewards: unresolved.** In conversation on 2026-09-12 Chanté described earning *coherence* for completing tasks and showing up, spent on plants and things for Lumi. The vision says *"inhabited, not gamified … the user is not earning decorations for completing tasks"* (§14). Until that is reconciled ([open question 14](docs/living/open-questions.md)), build neither.

## Design direction

The direction is moving from *an antique book with no decorative imagery* to **inhabited, painted places**: isometric paintings behind the spaces, with Lumi animated within them. Pleasant enough to return to, never an attention trap (§18). The shipped interface still speaks the book's language (serif type, ivory paper, fine rules), laid over the paintings. How much of it survives is open question 13. So far the painting sits behind and the type leads.

---

## The canonical documents

| Document | Holds | Status |
|---|---|---|
| [`docs/philosophy/product-vision.md`](docs/philosophy/product-vision.md) | The problem, the relationship with the user, the stable principles | **Foundational** |
| `docs/philosophy/experience-principles.md` | How the principles become interaction rules | To come. Interim: [`today.md`](docs/today.md) §Principles, [`design-philosophy.md`](docs/design-philosophy.md) §3 |
| `docs/philosophy/lumi.md` | Who Lumi is, her voice, her role | To come. Interim: [`product.md`](docs/product.md) → Lumi's voice; [`art-direction.md`](docs/art-direction.md) §2, §5 |
| `docs/product/ai-and-information-architecture.md` | How the AI understands and acts, and why | To come. Interim: [`architecture.md`](docs/architecture.md) (the how) |
| `docs/product/spaces.md` | The rooms and what belongs in each | To come. Interim: the table above |
| `docs/product/today-garden.md` | The Garden | To come. Interim: [`today.md`](docs/today.md) |
| `docs/product/lists-library.md` | The Library | To come |
| `docs/product/focus-study.md` | The Study | To come. Interim: [`features.md`](docs/features.md) → Focus Together |
| `docs/design/visual-language.md` | The look of the places and the interface | To come. Interim: [`art-direction.md`](docs/art-direction.md), [`design-system.md`](docs/design-system.md); `design-philosophy.md` is partly superseded |
| `docs/design/motion-and-interaction.md` | How Lumi and the interface move | To come. Interim: [`art-direction.md`](docs/art-direction.md) §4–5, [`animation-pipeline.md`](docs/animation-pipeline.md) |
| [`docs/living/decisions.md`](docs/living/decisions.md) | Product decisions, with rationale and what they replaced | Live |
| [`docs/living/open-questions.md`](docs/living/open-questions.md) | What isn't decided | Live |
| [`docs/living/ideas.md`](docs/living/ideas.md) | Possibilities, with statuses | Live |
| `docs/living/brand-strategy.md` | Brand | To come |

How the code works, and how to work in the repo, is indexed in [`docs/README.md`](docs/README.md).

## What to read for which work

| Work | Read |
|---|---|
| A new feature, a UX change, navigation, information architecture | Vision §14, §21 → the spaces above → the room's doc → decisions → open questions → [`ef-burden-log.md`](docs/ef-burden-log.md) |
| Lumi's behaviour, AI, memory, proactivity, notifications | Vision §4–7, §12, §16–18 → Lumi → AI & information architecture → decisions |
| Prioritisation, planning, the Garden | Vision §3, §5, §10–11, §15 → Garden doc → decisions |
| Rewards, gamification, engagement, growth of the places | Vision §12, §14, §18 → open question 14 before anything else |
| Re-entry, onboarding, overdue things, session state | Vision §8, §17 → decisions (*never a count*, *a session's end is a fact*) |
| Visual design, paintings, animation | Vision §13–14, §18 → visual language, motion → [`art-direction.md`](docs/art-direction.md) → [`animation-pipeline.md`](docs/animation-pipeline.md) |
| Pure implementation with no change in behaviour | `CLAUDE.md`, [`architecture.md`](docs/architecture.md), [`domain.md`](docs/domain.md); the canon only if behaviour moves |

## How the canon works

- **Code says what the product does; the canon says what it is trying to become.** Neither silently overrides the other. When they disagree, name it and settle it with Chanté: change the code, correct the doc, or record an open question. Don't pick whichever is easier to build.
- **The vision is foundational.** Don't rewrite it because one implementation or one conversation differs. Surface the contradiction first and let Chanté decide.
- **Status matters.** Only the vision, the decisions and the settled parts of canonical documents are requirements. Ideas stay ideas until accepted. Open questions stay open until decided. A passing idea in conversation is not canon.
- **Keep the reasoning.** A decision records why, what it implies and what it replaced. When direction changes, write *previous approach → why it changed → current approach* instead of deleting the history.
- **Plans for substantial product work carry a short *Canon alignment*:** the principles involved, how the design serves them, the tensions, and which docs change. Skip it for small tasks.
- **When the product moves,** update the affected canonical doc, then the decision log, then the open questions. Update this file only when the high-level model changed.
- **Watch for drift:** the Garden becoming a task dashboard; the Library needing grooming; Lumi turning into a generic chatbot or an authority; metrics added because apps have them; motivational copy; paintings becoming clutter; points standing in for growth; engagement over action. Flag drift. Don't refactor large areas without discussing first.
- **Prune now and then.** When a doc or passage becomes clearly irrelevant, move it to `docs/archive/` with a line on what replaced it. Documents get reorganised as the canon grows, with care while other branches are editing them.
