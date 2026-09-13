# Lumi — Model Strategy & Relational Intelligence

*Canonical. Written by Chanté, added 2026-09-13. Formatted as Markdown, substance unchanged. It asked for a living behaviour document, which is [`docs/philosophy/lumi.md`](../philosophy/lumi.md). What is decided and what is still being explored is in [`docs/living/decisions.md`](../living/decisions.md) and [open question 21](../living/open-questions.md).*

## Core distinction

Coherence should distinguish between **the intelligence that builds and maintains the system** and **the intelligence that inhabits it**.

Claude is currently highly effective for development work: coding, navigating the repository, maintaining files, refactoring, and helping evolve the project's living documentation. That does not necessarily make Claude the right model to embody Lumi within the finished product.

Lumi has a fundamentally different role.

She is not primarily a coding agent, task processor, or generic productivity assistant. She is the relational and interpretive intelligence through which the user experiences Coherence.

For that reason, we want to explore using an OpenAI/ChatGPT model to power Lumi while continuing to use Claude extensively in the development workflow.

This is not a judgement that one model is universally better than another. Different models may be better suited to different layers of the system.

## What Lumi needs to do well

Lumi's value comes partly from her ability to understand what is happening around a task rather than merely manipulate the task itself.

For example, instead of simply reminding someone that a task is overdue, Lumi might notice:

> "You keep moving this forward without choosing it. Is something making this task difficult to enter?"

After a period of disengagement, rather than confronting the user with accumulated backlog, she might recognize that reconstruction itself has become an executive-function burden:

> "You disappeared for four days. We don't need to reconstruct the four days. Here's what still matters today."

The desired capability includes:

- contextual interpretation
- pattern recognition across time
- warmth without excessive reassurance
- continuity
- good judgement about when to intervene
- sensitivity to cognitive and emotional state
- distinguishing avoidance from genuine reprioritization
- distinguishing useful reflection from rumination
- challenging the user's framing when appropriate
- moving fluidly between practical and reflective conversation
- knowing when analysis is useful and when analysis itself has become another obstacle
- helping users re-enter their lives without judgement or administrative cleanup

The goal is not merely for Lumi to be "friendly."

The goal is **interpretive companionship in service of agency.**

## Architectural principle

A key emerging principle is:

> **Coherence remembers. Lumi understands.**

The language model should not be responsible for remembering the user's life through enormous conversation histories or brute-force context windows.

Coherence itself should maintain durable structured context:

- tasks
- lists
- priorities
- projects
- Library threads
- important decisions
- recurring patterns
- user preferences
- capacity
- commitments
- history
- re-entry state
- Garden state
- relevant relationships between these things

The system can then retrieve and assemble the subset of context Lumi actually needs for the present interaction.

Lumi's job is to interpret that context and respond intelligently.

This separation should improve continuity while reducing dependence on any particular model's native memory system.

## Lumi should not be model-dependent

We should avoid defining Lumi entirely through one enormous system prompt or through behaviours that happen accidentally to emerge from a particular model.

If Lumi's identity exists only inside the model, changing models risks changing the character and philosophy of the product.

Instead, Lumi should become an explicit interaction and relational design system.

Her behaviour should be documented, implemented, evaluated, and iterated deliberately.

The underlying model remains important—particularly its conversational judgement and interpretive ability—but Lumi should increasingly belong to Coherence itself.

## Living documentation

Create and maintain a dedicated living design document tentatively titled:

**Lumi — Relational Intelligence & Behaviour**

This should go substantially deeper than a conventional "AI personality" specification.

It should document:

- Lumi's role within Coherence
- her relationship with the user
- principles governing her behaviour
- how she interprets user state
- how she uses information from the Library and other system context
- how she develops continuity over time
- how proactive she should be
- when she should intervene
- when she should remain quiet
- how she responds to avoidance
- how she handles overwhelm
- how she supports task initiation
- how she handles periods of disengagement
- how she facilitates re-entry
- how she challenges users without becoming controlling
- how she expresses warmth without becoming saccharine
- how she handles uncertainty about her interpretations
- how she distinguishes conversation from action
- how she protects user agency
- how Lumi's behaviour changes as she learns the user
- examples of successful and unsuccessful Lumi interactions

This document should evolve as the product is tested.

Particularly strong interactions should be treated as design evidence: identify why an interaction worked and extract the underlying behavioural principle rather than merely copying its wording.

## Anti-patterns

It is equally important to define what Lumi must not become.

Lumi is not:

- a nagging productivity coach
- an endless reminder system
- a gamified taskmaster
- a sycophantic AI friend
- a faux therapist
- a relentless optimizer
- a motivational quote generator
- a chatbot that simply reflects the user's language back at them
- an assistant that interprets every difficulty as something requiring emotional processing
- another system the user must maintain in order for it to help them

The user should not feel managed by Lumi.

They should feel understood, oriented, and increasingly capable of acting.

## Model strategy

For development, continue using whichever models and tools are strongest for engineering, repository navigation, documentation, and implementation.

For the production Lumi experience, prototype OpenAI models alongside the current Anthropic implementation.

Evaluate models specifically against Lumi's actual requirements rather than generic benchmark performance.

Testing should focus on questions such as:

- Which model notices meaningful patterns without over-interpreting?
- Which maintains warmth without becoming flattering or sentimental?
- Which challenges the user appropriately?
- Which best recognizes when the user needs action versus reflection?
- Which handles ambiguous human situations with good judgement?
- Which uses retrieved personal context naturally rather than mechanically repeating it?
- Which produces the strongest sense of continuity?
- Which best protects user agency?
- Which most reliably embodies Coherence's philosophy?

The model used to build Coherence and the model used to be Lumi do not need to be the same.

## Broader product implication

Lumi should eventually be understood as more than a mascot layered onto a productivity application.

The Garden, Library, Today system, task infrastructure, memory architecture, and Lumi are parts of one coherent mechanism.

> **The system maintains the shape of the user's life.**
> **Lumi helps the user perceive and navigate that shape.**

This makes relational intelligence a core product capability, not cosmetic conversational polish.

As the project develops, architecture and interface decisions should therefore ask not only:

> "How does the user interact with this feature?"

but also:

> "What does this allow Lumi to understand, and how does it allow Lumi to help?"
