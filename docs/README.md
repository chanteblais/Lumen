# Coherence — Design Docs

**Start at [`PROJECT-CANON.md`](../PROJECT-CANON.md)**: what Coherence is trying to become, its principles, the places, and which canonical document to read for which work. The foundation is the [Product Vision](philosophy/product-vision.md) and the [Experience Principles](philosophy/experience-principles.md); Lumi's behaviour is [Lumi — Relational Intelligence & Behaviour](philosophy/lumi.md), and the philosophy she is sent with every call is [her brief](philosophy/lumi-brief.md), reviewed whenever its sources change. The places are [Spaces of Coherence](product/spaces.md), the Garden has its own document in [Today / Garden](product/today-garden.md) (with [`today.md`](today.md) the page as built), and the *why* behind the AI layer described in `architecture.md` is [AI & Information Architecture](product/ai-and-information-architecture.md). The living canon is in [`living/`](living/): [product decisions](living/decisions.md), [open questions](living/open-questions.md), [ideas](living/ideas.md). The docs below describe what the product does now and how to work on it.

## Product and design canon

Start with [shared terminology](product/shared-model.md) and [AI & Information Architecture](product/ai-and-information-architecture.md). Dedicated documents: [Spaces](product/spaces.md), [Home](product/home.md), [Today / Garden](product/today-garden.md), [Lists / Library](product/lists-library.md), [Focus / Study](product/focus-study.md), [Visual Language](design/visual-language.md), and [Motion & Interaction](design/motion-and-interaction.md).

The [reconciliation record](living/reconciliation.md) contains lineage, source coverage and preserved gaps. The [historical snapshots](archive/2026-09-13-before-reconciliation/README.md) retain superseded text. Current product intent and the implementation index below are deliberately distinct.

The [V1 canon-alignment gap plan](living/v1-gap-plan.md) ranks code-grounded gaps and proposes three bounded first changes; it is a plan, not a claim of implementation or new milestone commitments.

## Implementation, evidence and operations

The [Coherence Desk](desk/README.md) is Chanté's one place for what needs her: one decision at a time, each with Claude's recommendation and what happens if she never answers, the standing [delegations](desk/delegations.md) that keep the rest off her plate, and the desk's own [journal](desk/journal.md) of what it learns, including what it carries back into Coherence.

The [routine review inbox](design/routine/README.md) imports proposals from **Coherence App Mockups Routine** for Chanté and Claude. Read it when relevant to current design work; imported ideas remain unapproved until reviewed in its separate decision ledger.

The [Coherence Context Package](context-package.md) is the persistent Google Drive briefing for conversations without repository access, with stable cloud links, current screenshots and the in-place refresh procedure.

| Doc | What's in it |
|---|---|
| [Product](product.md) | Retired early brief; links to current documents and historical source |
| [Architecture](architecture.md) | Stack, how the AI layer touches state (context block + tools), the understanding layer, sticky decisions, repo layout, API routes, key conventions |
| [Domain](domain.md) | The tables, events catalogue, derived views, migrations reference |
| [Today](today.md) | The Today page spec: a path, not a pile — one dominant task, *Not this*, capacity, Lists as the pile, how the day plan is built, what was cut from the mockup |
| [V1 Plan](v1-plan.md) | Milestones M0–M7 with done-when + executive-function checks |
| [Decisions](decisions.md) | ADR-lite log — append when a decision in the docs above changes |
| [Features](features.md) | Every page and feature — who it's for, what it does, key states |
| [Design System](design-system.md) | Tokens, typography, CSS classes, component patterns |
| [Design Philosophy](design-philosophy.md) | Retired book-only philosophy; links to Visual Language and preserved history |
| [Animation Pipeline](animation-pipeline.md) | **Claude's working doc for Lumi's animations** — read first in any animation session, updated at its end: session-start checklist, the measure gates (reject a sheet by numbers), the seven-stage path, touch points, the cost ledger per animation, the ranked efficiency backlog. The *how* of the cut stays in `art/README.md` |
| [Art Direction](art-direction.md) | **The evolving art direction and animation strategy** (draft): where the art has been, what holds across every drawing of Lumi, the book-or-world tension and the rules a painted world must keep, the ladder of animation tiers, what Lumi's motion means, companion vs resident, character consistency, the bets under test and the open questions |
| [Branching](branching.md) | Branch rules, landing on main without checking it out (`npm run land`), the docs audit before every merge and push, parallel sessions and the worktree lifecycle (`npm run worktrees`), dev servers and ports, commit guards, Claude-session guardrails |
| [Development Hygiene](dev-hygiene.md) | **Claude's evolving strategy for keeping development tidy** — read at session start, updated at its end: the strategy, the guards (the preflight before `check` and `dev`), the traps ledger (symptom → cause → catch → fix), the ranked backlog, what goes to Chanté |
| [EF-Burden Log](ef-burden-log.md) | **Standing ledger:** every place the app asks the user to maintain, decide, rate or tidy something. The dogfood ledger for the one question |
| [Voice Eval Log](voice-eval-log.md) | Scripted scenarios run against Lumi's persona (single replies, and short conversations with her real tools against a throwaway database), how they're graded, what was off, what changed in the prompt |
| [QA Log](qa-log.md) | QA sweeps: tested/fixed, known-and-deliberate (don't re-report), open items |
| [Code Review 2026-09-13](code-review-2026-09-13.md) | Whole-project code review: every finding with an id, its owning fix branch and its status (data integrity, AI layer and routes, companion UI, tooling, strictness) |
| [UX Review Log](ux-review-log.md) | Findings from UX passes with severity / effort / status |
| [Pre-Production](pre-prod.md) | Checklist before real users |
| [User Journey](user-journey.md) | The loop a user moves through, as a diagram |

---

## Project direction

Coherence is a **companion, not a task manager**. Every doc above answers to one question: *does this reduce the user's executive-function burden, or accidentally create more of it?* When a proposed feature would add a status to keep current, a list to groom, a rating to give, or a setting to choose, it goes in the [EF-Burden Log](ef-burden-log.md) first and gets built only if it survives the question.

The understanding layer (how Lumi learns what helps this particular user) is the product's centre of gravity — see [architecture.md](architecture.md) → *The understanding layer*. Store facts and events; derive judgements; never ask the user to maintain memory.
