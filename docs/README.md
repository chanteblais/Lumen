# Rali — Design Docs

| Doc | What's in it |
|---|---|
| [Product](product.md) | The brief: the problem, the one question, behavioural pillars, Rali's voice, visual direction, V1 scope |
| [Architecture](architecture.md) | Stack, how the AI layer touches state (context block + tools), the understanding layer, sticky decisions, repo layout, API routes, key conventions |
| [Domain](domain.md) | The tables, events catalogue, derived views, migrations reference |
| [V1 Plan](v1-plan.md) | Milestones M0–M7 with done-when + executive-function checks |
| [Decisions](decisions.md) | ADR-lite log — append when a decision in the docs above changes |
| [Features](features.md) | Every page and feature — who it's for, what it does, key states |
| [Design System](design-system.md) | Tokens, typography, CSS classes, component patterns |
| [Design Philosophy](design-philosophy.md) | What the interface *is* and *is never*; how personality enters the app (draft — validate against Chanté's reactions) |
| [Branching](branching.md) | Branch rules, parallel sessions, commit guards, Claude-session guardrails |
| [EF-Burden Log](ef-burden-log.md) | **Standing ledger:** every place the app asks the user to maintain, decide, rate or tidy something. The dogfood ledger for the one question |
| [Voice Eval Log](voice-eval-log.md) | Scripted scenarios run against Rali's persona, what was off, what changed in the prompt |
| [QA Log](qa-log.md) | QA sweeps: tested/fixed, known-and-deliberate (don't re-report), open items |
| [UX Review Log](ux-review-log.md) | Findings from UX passes with severity / effort / status |
| [Pre-Production](pre-prod.md) | Checklist before real users |
| [User Journey](user-journey.md) | The loop a user moves through, as a diagram |

---

## Project direction

Rali is a **companion, not a task manager**. Every doc above answers to one question: *does this reduce the user's executive-function burden, or accidentally create more of it?* When a proposed feature would add a status to keep current, a list to groom, a rating to give, or a setting to choose, it goes in the [EF-Burden Log](ef-burden-log.md) first and gets built only if it survives the question.

The understanding layer (how Rali learns what helps this particular user) is the product's centre of gravity — see [architecture.md](architecture.md) → *The understanding layer*. Store facts and events; derive judgements; never ask the user to maintain memory.
