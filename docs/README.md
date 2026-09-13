# Coherence — Design Docs

**Start at [`PROJECT-CANON.md`](../PROJECT-CANON.md)**: what Coherence is trying to become, its principles, the places, and which canonical document to read for which work. The foundation is the [Product Vision](philosophy/product-vision.md) and the [Experience Principles](philosophy/experience-principles.md); Lumi's behaviour is [Lumi — Relational Intelligence & Behaviour](philosophy/lumi.md). The living canon is in [`living/`](living/): [product decisions](living/decisions.md), [open questions](living/open-questions.md), [ideas](living/ideas.md). The docs below describe what the product does now and how to work on it.

| Doc | What's in it |
|---|---|
| [Product](product.md) | The brief: the problem, the one question, behavioural pillars, Lumi's voice, visual direction, V1 scope |
| [Architecture](architecture.md) | Stack, how the AI layer touches state (context block + tools), the understanding layer, sticky decisions, repo layout, API routes, key conventions |
| [Domain](domain.md) | The tables, events catalogue, derived views, migrations reference |
| [Today](today.md) | The Today page spec: a path, not a pile — one dominant task, *Not this*, capacity, Lists as the pile, how the day plan is built, what was cut from the mockup |
| [V1 Plan](v1-plan.md) | Milestones M0–M7 with done-when + executive-function checks |
| [Decisions](decisions.md) | ADR-lite log — append when a decision in the docs above changes |
| [Features](features.md) | Every page and feature — who it's for, what it does, key states |
| [Design System](design-system.md) | Tokens, typography, CSS classes, component patterns |
| [Design Philosophy](design-philosophy.md) | What the interface *is* and *is never*; how personality enters the app (draft — validate against Chanté's reactions) |
| [Spaces](spaces.md) | **The spatial architecture** (draft): Home · Garden (Today) · Library (`/library`, was Lists) · Study (Focus) — each space a cognitive mode, not a feature bucket; context travels between them with Lumi; the world grows with the relationship, never with output. Ends with where the product stands and the tensions with the other docs |
| [Animation Pipeline](animation-pipeline.md) | **Claude's working doc for Lumi's animations** — read first in any animation session, updated at its end: session-start checklist, the measure gates (reject a sheet by numbers), the seven-stage path, touch points, the cost ledger per animation, the ranked efficiency backlog. The *how* of the cut stays in `art/README.md` |
| [Art Direction](art-direction.md) | **The evolving art direction and animation strategy** (draft): where the art has been, what holds across every drawing of Lumi, the book-or-world tension and the rules a painted world must keep, the ladder of animation tiers, what Lumi's motion means, companion vs resident, character consistency, the bets under test and the open questions |
| [Branching](branching.md) | Branch rules, the docs audit before every merge and push, parallel sessions, dev servers and ports, commit guards, Claude-session guardrails |
| [EF-Burden Log](ef-burden-log.md) | **Standing ledger:** every place the app asks the user to maintain, decide, rate or tidy something. The dogfood ledger for the one question |
| [Voice Eval Log](voice-eval-log.md) | Scripted scenarios run against Lumi's persona, what was off, what changed in the prompt |
| [QA Log](qa-log.md) | QA sweeps: tested/fixed, known-and-deliberate (don't re-report), open items |
| [UX Review Log](ux-review-log.md) | Findings from UX passes with severity / effort / status |
| [Pre-Production](pre-prod.md) | Checklist before real users |
| [User Journey](user-journey.md) | The loop a user moves through, as a diagram |

---

## Project direction

Coherence is a **companion, not a task manager**. Every doc above answers to one question: *does this reduce the user's executive-function burden, or accidentally create more of it?* When a proposed feature would add a status to keep current, a list to groom, a rating to give, or a setting to choose, it goes in the [EF-Burden Log](ef-burden-log.md) first and gets built only if it survives the question.

The understanding layer (how Lumi learns what helps this particular user) is the product's centre of gravity — see [architecture.md](architecture.md) → *The understanding layer*. Store facts and events; derive judgements; never ask the user to maintain memory.
