# Coherence — Project Canon

*The entry point to the canon. Before substantial product, UX, AI-behaviour or design work, read this, then the documents it points to for that kind of work. It is a map: each line points to where the reasoning lives.*

*The foundation is two documents. The [Product Vision](docs/philosophy/product-vision.md) (**V§**) says why Coherence exists. The [Experience Principles](docs/philosophy/experience-principles.md) (**EP§**) say how it should behave because of that.*

---

## What Coherence is

> A context-aware companion and personal organization system that helps a person understand what matters, begin when beginning is difficult, stay with something when useful, and find their way back when they lose the thread. (V§20)

**The problem (V§1–2).** Most productivity systems require exactly the executive functions they are meant to support: capturing, categorising, prioritising, reviewing, noticing staleness, coming back. Coherence starts from the opposite assumption: *a productivity system should reduce the executive-function burden required to maintain the productivity system itself.* The goal is coherence between **intention → priority → capacity → attention → action**, not more output.

## Principles — constraints, not tone

1. **The system does the organising.** Lumi carries the organisational burden and the user keeps authority. Automate administration, never agency. (V§4, EP§1)
2. **Lumi proposes. The user corrects. Lumi learns.** Say "here's how I'd order these", never "this is the correct priority". Recommendations stay easy to override. (V§5, EP§5)
3. **Correction beats configuration,** and a manual move teaches Lumi something. (EP§6, EP§16)
4. **Show less than you know; one decision at a time.** Disclose progressively; never build a dashboard. Empty space is part of prioritisation. (V§11, EP§2–4, EP§12)
5. **Starting is its own problem.** Cross the smallest meaningful threshold instead of producing a plan. (V§6, EP§10)
6. **Presence without interruption.** Lumi intervenes when useful, not on an engagement timer. (V§7, EP§11)
7. **Design for return.** Every workflow assumes the user may disappear. Coming back is cheap and restores the present instead of exposing failure. "Where were we?" works at every scale. (V§8, V§17, EP§8)
8. **Resistance and capacity change the plan.** *Not this* is information. A low day becomes smaller: not redder, not more overdue. (V§9–10, EP§7, EP§9)
9. **Appropriate forward movement, not maximum output.** Accountability without punishment: no streaks, red counts, scores or failure states. (V§3, V§12)
10. **Show inference for what it is.** Separate what the user said from what Lumi guessed, in proportion to what's at stake. (EP§17)
11. **One understanding across spaces.** Places are views into the same life, never separate modules; nobody re-explains a task. (EP§18)
12. **No methodology to learn.** "Everything feels like a mess" is enough to get help. (EP§19)
13. **Warmth through behaviour, not slogans.** (V§13, EP§13)
14. **Help the user leave.** Success is closing the app and doing the thing. (V§18, EP§20)

**The tests.** Run them before adding anything:
- **One second** (EP§21): can an overwhelmed user tell what a primary page asks of them?
- **Cognitive load** (EP§22): does seeing this now help the next action?
- **Maintenance** (EP§23): what happens after three weeks of neglect?
- **Coherence** (V§21, EP§24): does it reduce burden and fragmentation, preserve authority and continuity, and help the user engage with their life?

## Lumi

She/her. **The relational and interpretive intelligence through which the user experiences Coherence**: interpretive companionship in service of agency, and a presence that makes it easier to begin and keep going (V§7). Not a nagging coach, a reminder system, a sycophantic friend, a faux therapist or an optimiser. Calm, warm, observant, concise, lightly playful, capable of gentle challenge. A small hooded figure with glowing eyes, brass medallions and a lantern. She is on every page and lives in Home.

> **Coherence remembers. Lumi understands.** The system maintains the shape of the user's life; Lumi helps the user perceive and navigate that shape.

Her behaviour is a designed system in [`docs/philosophy/lumi.md`](docs/philosophy/lumi.md), not a model's personality. The model behind her is chosen on her requirements, separately from the tools that build Coherence ([model strategy](docs/product/lumi-model-strategy.md)). For every feature, ask: *what does this allow Lumi to understand, and how does it help her help?*

## The spaces

Each place expresses a relationship to activity (V§14, EP§15) and answers one question (Chanté, 2026-09-12).

| Place | Question | Relationship (EP§15) | In the app now |
|---|---|---|---|
| **Home** | *Here I am.* | Arrive and inhabit: arriving, talking, reflecting, returning. Asks nothing of you | `/`, the painted room, the conversation. Also hosts focus sessions |
| **Garden** (Today) | *What matters today?* | Tend: *what needs tending now?*, not *what remains incomplete?* Plant, tend, let rest, prune (V§15) | `/today`: the path on one paper panel over the painted greenhouse, with Lumi standing in it on wide screens |
| **Library** (was Lists) | *Where have I been?* | Organise and retrieve what the system is holding; richer as history grows | `/library` (the nav says *Library* since 2026-09-13; `/lists` redirects): the painted reading room with Lumi standing in it, **no list view for now** — the lists are still kept, feed Today and reach Lumi; filing and ticking happen in conversation ([decision](docs/living/decisions.md)). Insights (mail) has no place yet |
| **Study** (Focus) | *What am I doing now?* | Attend: give attention to one thing | Not a place yet; sessions run on Home |

The metaphor must clarify what the user can do, never obscure it (EP§15). Places grow with relationship, continuity and accumulated life, **not points** (V§14, EP§14). Settings is a utility, not a place.

**Rewards: unresolved.** In conversation on 2026-09-12 Chanté described earning *coherence* for completing tasks and showing up, spent on plants and things for Lumi. Both foundation documents say otherwise: V§14 "inhabited, not gamified", and EP§14 lists "points, currencies, unlock requirements, completion-based decoration" as things to watch for. Until that is reconciled ([open question 14](docs/living/open-questions.md)), build neither.

## Design direction

The direction is moving from *an antique book with no decorative imagery* to **inhabited, painted places**: isometric paintings behind the spaces, with Lumi animated within them. Pleasant enough to return to, never an attention trap (V§18). No decorative scenery without an experiential purpose (EP§15). The shipped interface still speaks the book's language (serif type, ivory paper, fine rules), laid over the paintings. How much of it survives is open question 13. So far the painting sits behind and the type leads.

---

## The canonical documents

| Document | Holds | Status |
|---|---|---|
| [`docs/philosophy/product-vision.md`](docs/philosophy/product-vision.md) | Why: the problem, the relationship with the user, the stable principles | **Foundational** |
| [`docs/philosophy/experience-principles.md`](docs/philosophy/experience-principles.md) | How: 20 principles with *watch for* lists, and four tests | **Canonical** |
| [`docs/philosophy/lumi.md`](docs/philosophy/lumi.md) | Lumi — Relational Intelligence & Behaviour: her role, relationship, principles, reading state, context, continuity, when to speak, situations, evidence | **Living** (v0.1; sections marked *proposed* await Chanté) |
| [`docs/product/lumi-model-strategy.md`](docs/product/lumi-model-strategy.md) | Build model vs Lumi model; *Coherence remembers, Lumi understands*; anti-patterns; how models are evaluated | **Canonical** |
| `docs/product/ai-and-information-architecture.md` | How the AI understands and acts, and why | To come. Interim: [`architecture.md`](docs/architecture.md) (the how), the model strategy (the why) |
| `docs/product/spaces.md` | The places and what belongs in each | To come. Interim: the table above |
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
| Any screen or workflow | EP§21–23 (the tests), then the rows below |
| A new feature, navigation, information architecture | V§14, EP§2–4, EP§15, EP§18 → the spaces above → the place's doc → decisions → open questions → [`ef-burden-log.md`](docs/ef-burden-log.md) |
| Task interactions, lists, dragging, correcting | EP§1, EP§5–6, EP§16–17 → decisions (*direct manipulation*) |
| Lumi's behaviour, the persona prompt, AI, memory, proactivity, notifications | [`lumi.md`](docs/philosophy/lumi.md) → [model strategy](docs/product/lumi-model-strategy.md) → V§4–7, V§16–18, EP§5, EP§11, EP§17, EP§20 → decisions → open questions 9–12, 17, 21–23 |
| Choosing or evaluating a model for Lumi | [model strategy](docs/product/lumi-model-strategy.md) → `lumi.md` §15, §17 → open question 21 → [`voice-eval-log.md`](docs/voice-eval-log.md) |
| Prioritisation, planning, capacity, the Garden | V§3, V§10–11, V§15, EP§3, EP§7, EP§9 → Garden doc → decisions |
| Focus sessions | V§7, EP§10–11, EP§18 → [`features.md`](docs/features.md) → Focus Together |
| Rewards, gamification, engagement, growth of the places | V§14, V§18, EP§14, EP§20 → open question 14 before anything else |
| Re-entry, onboarding, overdue things, session state | V§8, V§17, EP§8, EP§19, EP§23 → decisions (*never a count*, *a session's end is a fact*) |
| Visual design, paintings, animation | V§13–14, EP§11–12, EP§15 → visual language, motion → [`art-direction.md`](docs/art-direction.md) → [`animation-pipeline.md`](docs/animation-pipeline.md) |
| Pure implementation with no change in behaviour | `CLAUDE.md`, [`architecture.md`](docs/architecture.md), [`domain.md`](docs/domain.md); the canon only if behaviour moves |

## How the canon works

- **Code says what the product does; the canon says what it is trying to become.** Neither silently overrides the other. When they disagree, name it and settle it with Chanté: change the code, correct the doc, or record an open question. Don't pick whichever is easier to build.
- **The foundation holds.** Don't rewrite the vision or the principles because one implementation or one conversation differs. Surface the contradiction first and let Chanté decide.
- **Status matters.** Only the foundation documents, the decisions and the settled parts of other canonical documents are requirements. The principles' *in practice* examples illustrate; they aren't specs (EP, Purpose). Ideas stay ideas until accepted, and open questions stay open until decided. A passing idea in conversation is not canon.
- **Keep the reasoning.** A decision records why, what it implies and what it replaced. When direction changes, write *previous approach → why it changed → current approach* instead of deleting the history.
- **Plans for substantial product work carry a short *Canon alignment*:** the principles involved, how the design serves them, the tensions, and which docs change. Skip it for small tasks.
- **When the product moves,** update the affected canonical doc, then the decision log, then the open questions. Update this file only when the high-level model changed.
- **Watch for drift:** the Garden becoming a task dashboard; the Library needing grooming; Lumi turning into a generic chatbot or an authority; metrics added because apps have them; motivational copy; paintings becoming clutter; points standing in for growth; engagement over action. Each principle's *watch for* list is the detailed version. Flag drift. Don't refactor large areas without discussing first.
- **Prune now and then.** When a doc or passage becomes clearly irrelevant, move it to `docs/archive/` with a line on what replaced it. Documents get reorganised as the canon grows, with care while other branches are editing them.
