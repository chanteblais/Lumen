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
4. **Show less than you know; one decision at a time.** Disclose progressively; never build a dashboard. Empty space is part of prioritisation. (V§11, EP§2–4, EP§12) *"Never a dashboard" is under question since 2026-09-18 — Chanté: "I'm starting to feel like it should be a bit of a dashboard" — [open question 29](docs/living/open-questions.md); the Garden's "one thing should dominate" was retired the same day ([decision](docs/living/decisions.md)).*
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

She/her. **The relational and interpretive intelligence through which the user experiences Coherence**: interpretive companionship in service of agency, and a presence that makes it easier to begin and keep going (V§7). **Her function: to identify goals and priorities, and help the user actualize them.** She identifies them with the user, never for them, and helps with appropriate forward movement, not maximum output ([`lumi.md`](docs/philosophy/lumi.md) §1; [decision](docs/living/decisions.md), 2026-09-14). Not a nagging coach, a reminder system, a sycophantic friend, a faux therapist or an optimiser. Calm, warm, observant, concise, lightly playful, capable of gentle challenge. A small hooded figure with glowing eyes and brass medallions, hands-free most of the time; the lantern is hers, and she often picks it up and sets it down again, and she handles many other things in her world too ([decision](docs/living/decisions.md), 2026-09-13). She is on every page and lives in Home.

> **Coherence remembers. Lumi understands.** The system maintains the shape of the user's life; Lumi helps the user perceive and navigate that shape.

Her behaviour is a designed system in [`docs/philosophy/lumi.md`](docs/philosophy/lumi.md), not a model's personality. The model behind her is chosen on her requirements, separately from the tools that build Coherence ([model strategy](docs/product/lumi-model-strategy.md)). For every feature, ask: *what does this allow Lumi to understand, and how does it help her help?*

## The spaces

The [Spaces document](docs/product/spaces.md) defines cognitive modes over one evolving life model. **Life → evolving model → relevant context → today → now** describes attention narrowing, not mandatory navigation. [Shared terminology](docs/product/shared-model.md) defines ownership, authority and temporal scope.

| Place | Summary question | Role | In the app at this baseline |
|---|---|---|---|
| [Home](docs/product/home.md) | What is happening; what do I need? | Arrive, talk, reflect and return without compulsory task creation | `/`, conversation in the painted room (focus sessions removed for now, 2026-09-13) |
| [Today / Garden](docs/product/today-garden.md) | What deserves attention today? | Trustworthy containment and negotiated attention | `/today`, the existing path; see [as-built spec](docs/today.md) |
| [Focus / Study](docs/product/focus-study.md) | What are we doing now? | Narrow attention and offer accompaniment | Not built; focus sessions were removed for now (2026-09-13) |
| [Library](docs/product/lists-library.md) | What am I carrying, and where does it belong? | Browse and retrieve active context, relationships and history | `/library`, painted room; its categories and threads (sections, shelves, books) show on it only in a hidden debug mode until they're integrated properly (`feat/library-sections`); the lists are browsed in **Lists**, a sheet from the nav over the page you're on (`/lists`), and still feed Lumi and Today |

These questions summarize roles, not mandated interface copy. “Where have I been?” remains a Library use, not its whole purpose. The current Library navigation label remains deliberate; other labels, Insights placement and concrete spatial interactions remain open. Settings is a utility.

**Growth: continuity, not rewards.** Approved 2026-09-13: no earning/spending coherence, completion unlocks or productivity reward economy. Familiarity and accumulated context may shape the environment without absence costs or required care. Recognition of beginning and returning survives through proportionate behaviour. [Decision and history](docs/living/decisions.md).

## Design direction

[Visual Language](docs/design/visual-language.md) and [Motion & Interaction](docs/design/motion-and-interaction.md) define inhabited places with a restrained, legible interface. The earlier book-only and avatar-only prohibitions are retired; editorial typography, material restraint and quiet survive. Exact spatial design is not fixed by this reconciliation. [Design System](docs/design-system.md) describes implemented tokens; [Art Direction](docs/art-direction.md) preserves production reasoning and experiments.

---

## The canonical documents

| Document | Holds | Status |
|---|---|---|
| [`docs/philosophy/product-vision.md`](docs/philosophy/product-vision.md) | Why: the problem, the relationship with the user, the stable principles | **Foundational** |
| [`docs/philosophy/experience-principles.md`](docs/philosophy/experience-principles.md) | How: 20 principles with *watch for* lists, and four tests | **Canonical** |
| [`docs/philosophy/lumi.md`](docs/philosophy/lumi.md) | Lumi — Relational Intelligence & Behaviour: her role, relationship, principles, reading state, context, continuity, when to speak, situations, evidence | **Living** (v0.1; sections marked *proposed* await Chanté) |
| [`docs/product/lumi-model-strategy.md`](docs/product/lumi-model-strategy.md) | Build model vs Lumi model; *Coherence remembers, Lumi understands*; anti-patterns; how models are evaluated | **Canonical** |
| [`docs/product/ai-and-information-architecture.md`](docs/product/ai-and-information-architecture.md) | How the AI understands and acts, and why: the life model (threads, intentions, actions), conversation vs state, explicit vs inferred, priority vs attention, context selection, memory kinds and decay, bounded and proportional autonomy, the seams to keep (§57), a minimal V1 (§58), review questions (§61). [`architecture.md`](docs/architecture.md) is the how as built | **Canonical** |
| [`docs/product/home.md`](docs/product/home.md) | Arrival, reflection, conversational correction and return | Canonical direction |
| [`docs/product/shared-model.md`](docs/product/shared-model.md) | Shared vocabulary, authority, temporal scope and approved resolutions | Canonical |
| [`docs/product/spaces.md`](docs/product/spaces.md) | The places and what belongs in each: cognitive modes, not feature buckets; plain nav names; context travels; environmental richness vs interface quiet; growth without gamification or judgement | **Canonical direction**, complete 51 sections |
| [`docs/product/today-garden.md`](docs/product/today-garden.md) | The Garden: a temporary, capacity-aware projection of the life model into what deserves tending today, never a second source of truth; a path with one thing dominant; intelligent omission and trusted containment; *Not this* and capacity change the plan; no overdue debt and no planning ritual; the metaphor partly implicit; growth as continuity, not output; the core experience test (§157). [`today.md`](docs/today.md) is the page as built | **Canonical direction**, complete 158 sections |
| [`docs/product/lists-library.md`](docs/product/lists-library.md) | Broad life context, ordering, retrieval, genealogy and conservative archival | Canonical direction; concrete spatial design open |
| [`docs/product/focus-study.md`](docs/product/focus-study.md) | Accompaniment, containment, meaningful outcomes and leaving | Canonical direction; check-in defaults open |
| [`docs/design/visual-language.md`](docs/design/visual-language.md) | The environment, interface, typography and accessibility | Canonical direction; replaces old design philosophy |
| [`docs/design/motion-and-interaction.md`](docs/design/motion-and-interaction.md) | Semantic interaction, temporal scope, motion and continuity | Canonical direction; examples are not fixed choreography |
| [`docs/living/decisions.md`](docs/living/decisions.md) | Product decisions, with rationale and what they replaced | Live |
| [`docs/living/open-questions.md`](docs/living/open-questions.md) | What isn't decided | Live |
| [`docs/living/ideas.md`](docs/living/ideas.md) | Possibilities, with statuses | Live |
| `docs/living/brand-strategy.md` | Brand | To come |

How the code works, and how to work in the repo, is indexed in [`docs/README.md`](docs/README.md).

## What to read for which work

| Work | Read |
|---|---|
| Any screen or workflow | EP§21–23 (the tests), then the rows below |
| A new feature, navigation, information architecture | V§14, EP§2–4, EP§15, EP§18 → the spaces above → [`spaces.md`](docs/product/spaces.md) §4 → the place's doc → decisions → open questions → [`ef-burden-log.md`](docs/ef-burden-log.md) |
| The data model, context assembly, tools, memory, retrieval, privacy | [AI & information architecture](docs/product/ai-and-information-architecture.md) (§57 seams, §58 V1, §61 review questions) → decisions (*Coherence remembers*) → open questions 10–12, 19, 22, 24–25 → [`architecture.md`](docs/architecture.md), [`domain.md`](docs/domain.md) |
| Task interactions, lists, dragging, correcting | EP§1, EP§5–6, EP§16–17 → decisions (*direct manipulation*) |
| Lumi's behaviour, the persona prompt, AI, memory, proactivity, notifications | [`lumi.md`](docs/philosophy/lumi.md) → [her brief](docs/philosophy/lumi-brief.md) (the canon as she is sent it) → [model strategy](docs/product/lumi-model-strategy.md) → V§4–7, V§16–18, EP§5, EP§11, EP§17, EP§20 → decisions → open questions 9–12, 17, 21–23 |
| Choosing or evaluating a model for Lumi | [model strategy](docs/product/lumi-model-strategy.md) → `lumi.md` §15, §17 → open question 21 → [`voice-eval-log.md`](docs/voice-eval-log.md) |
| Prioritisation, planning, capacity, the Garden | V§3, V§10–11, V§15, EP§3, EP§7, EP§9 → [`today-garden.md`](docs/product/today-garden.md) (§157, the core experience test) → decisions → open questions 5, 16, 20, 26 → [`today.md`](docs/today.md) |
| Focus sessions | [Study](docs/product/focus-study.md) → V§7, EP§10–11, EP§18 → open questions 18, 28 → [`features.md`](docs/features.md) |
| Rewards, gamification, engagement, growth of the places | V§14, V§18, EP§14, EP§20 → [`spaces.md`](docs/product/spaces.md) §26–28 → [`today-garden.md`](docs/product/today-garden.md) §34, §67 → approved growth decision |
| Re-entry, onboarding, overdue things, session state | V§8, V§17, EP§8, EP§19, EP§23 → [`today-garden.md`](docs/product/today-garden.md) §53–55 → decisions (*never a count*, *a session's end is a fact*) |
| Visual design, paintings, animation | V§13–14, EP§11–12, EP§15 → visual language, motion → [`art-direction.md`](docs/art-direction.md) → [`animation-pipeline.md`](docs/animation-pipeline.md) |
| Pure implementation with no change in behaviour | `CLAUDE.md`, [`architecture.md`](docs/architecture.md), [`domain.md`](docs/domain.md); the canon only if behaviour moves |

## How the canon works

- **Code says what the product does; the canon says what it is trying to become.** Neither silently overrides the other. When they disagree, name it and settle it with Chanté: change the code, correct the doc, or record an open question. Don't pick whichever is easier to build.
- **Reconcile explicitly.** Neither source location, recency nor length establishes authority. Foundations and approved decisions guide interpretation; Chanté can revise them explicitly. Record the reason and supersession rather than silently selecting a winner.
- **Status matters.** Only the foundation documents, the decisions and the settled parts of other canonical documents are requirements. The principles' *in practice* examples illustrate; they aren't specs (EP, Purpose). Ideas stay ideas until accepted, and open questions stay open until decided. A passing idea in conversation is not canon.
- **Scope is separate.** Settled direction constrains future implementation; illustrative examples and future capabilities do not expand [V1](docs/v1-plan.md). Shared definitions live in [Shared terminology](docs/product/shared-model.md); the architecture carries detailed reasoning and space docs apply it.
- **Keep the reasoning.** A decision records why, what it implies and what it replaced. When direction changes, write *previous approach → why it changed → current approach* instead of deleting the history.
- **Plans for substantial product work carry a short *Canon alignment*:** the principles involved, how the design serves them, the tensions, and which docs change. Skip it for small tasks.
- **When the product moves,** update the affected canonical doc, then the decision log, then the open questions, then [Lumi's brief](docs/philosophy/lumi-brief.md) if it changes what she should understand (`npm run check` names the moved sources until the brief is reviewed). Update this file only when the high-level model changed.
- **Watch for drift:** the Garden becoming a task dashboard; the Library needing grooming; Lumi turning into a generic chatbot or an authority; metrics added because apps have them; motivational copy; paintings becoming clutter; points standing in for growth; engagement over action. Each principle's *watch for* list is the detailed version. Flag drift. Don't refactor large areas without discussing first.
- **Lumi's design notebook is not canon.** In Chanté's design conversations Lumi keeps design notes of her own, surfaced in a daily digest (`npm run design:digest`; [architecture](docs/architecture.md) → Lumi's design notebook). Weigh them during design work like ideas: a note, even one Chanté endorsed, becomes canon only when she puts it into a canonical document or a decision.
- **Prune now and then.** When a doc or passage becomes clearly irrelevant, move it to `docs/archive/` with a line on what replaced it. Documents get reorganised as the canon grows, with care while other branches are editing them.

## Reconciliation provenance

The [2026-09-13 reconciliation record](docs/living/reconciliation.md) contains source hashes, dispositions, implementation gaps and the old-to-new section crosswalk. Historical originals remain archived; current references use the complete editions.
