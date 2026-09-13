# Shared model and terminology

*Approved in the documentation reconciliation, 2026-09-13. This is the concise vocabulary shared by the space and design documents. Detailed architectural reasoning remains in [AI & Information Architecture](ai-and-information-architecture.md). It describes intended behaviour, not the current schema.*

## Purpose and ownership

Coherence helps the user hold less. It maintains an evolving, partial model of active life; Lumi uses relevant context to help the user orient, choose, begin, stay or return. Not everything meaningful needs to enter Coherence. Internal sophistication should reduce external effort, never impose a methodology.

**Life → evolving model → relevant context → today → now** describes progressive selection, not mandatory navigation or a hierarchy every object must obey. Home offers conversation and reflection; Library exposes breadth, relationships and history; Garden contains today's attention; Study narrows to the work at hand. They are projections over shared state, not separate databases. The Library is neither the database itself nor solely an archive or intellectual notebook.

## Objects and knowledge

| Term | Shared meaning |
|---|---|
| Thread | Persistent context connecting an area of life across fragmented activity. Not necessarily a project. |
| Intention | Direction or something the user wants to move forward. |
| Action | A concrete step; it may exist without a compulsory parent Intention or Thread. |
| Commitment / context | Obligations, constraints, relationships, decisions and other relevant information; not everything becomes a task or fits Thread → Intention → Action. |
| Current state | What currently holds, including explicit uncertainty. |
| History / genealogy | What happened and how understanding changed. Useful history remains retrievable without being presented as current. |
| Explicit information | What the user stated or deliberately instructed, with its scope and provenance. |
| Observation | What was observed; departure, inactivity or repeated selection alone does not establish motive, capacity or success. |
| Inference | A tentative interpretation, kept distinguishable from explicit information and open to correction. |
| Derived information | A result calculated from stored facts, with its inputs and limits; a staleness threshold is not proof of avoidance. |

Preserve source, uncertainty and meaningful supersession. Current explicit instructions outrank an incompatible historical inference; do not let a newer guess overwrite the user's stated values. Explanations should be available when useful without requiring users to administer the model.

## Priority and temporal scope

| Term | Meaning and consequence |
|---|---|
| Importance | Significance to the user, including values that may not predict observed behaviour. |
| Urgency | Time sensitivity and real consequences of delay. No moral pressure is implied. |
| Priority | Relative emphasis or judgment in context; preserve user-expressed priority separately from Lumi's recommendation. |
| Attention relevance | Whether something belongs in the user's foreground in this context and at this time. |
| Not today | Do not foreground today. Does not mean tomorrow, unimportant, abandoned or globally lower priority. |
| Not this | Rejection of the current recommendation. It need not require explanation or imply a permanent preference. |
| Rest / background | Recede from attention within a meaningful scope: now, today, this week or for a while. Do not invent a precise date. |
| Later | An ambiguous existing label. A list named Later, Today's fixed-time landmarks and a temporary exclusion are not the same state change. Define the operation before reusing the label. |
| Archive | Preserve while removing from active use; not deletion, failure or permanent irretrievability. |
| Relevance decay | Reduce present salience as context changes; distinguish this from archival, supersession and destructive deletion. |
| Delete | Destructive removal with clear consequences and proportional confirmation. Retention/export policy and implementation remain open. |

Equivalent conversational, menu and drag actions must produce equivalent outcomes **when their operation and temporal scope match**. A Today-only override must not erase enduring priority. Tomorrow reassesses relevance rather than inheriting a backlog automatically.

## Authority, correction and containment

Lumi proposes; the user retains authority. Optional direct manipulation expresses judgment and must reach the shared model. A single rearrangement is contextual evidence, not automatically a durable rule. An explicit instruction is authoritative within its intended scope. Correction is cheaper than configuration; neither organization nor learning should depend on compulsory sorting, ratings or review rituals.

Containment means the user can trust what has been omitted and stop mentally scanning. It requires dependable preservation, retrieval, correction and appropriate uncertainty. Lumi may name a tradeoff or overcommitment; the user may deliberately choose overflow. Do not optimize recommendations for predicted compliance over expressed values.

Re-entry reconstructs what matters now, including external progress. Leaving the app can be success. A timeout or lack of app activity is not enough evidence to judge an intervention ineffective. Richer outcomes must not introduce a new reporting burden.

## Environment and scope

Environmental growth reflects continuity, familiarity and accumulated context. No earning/spending currency, completion unlocks, productivity rewards or punishment for absence. Recognition of beginning, returning and letting go remains valid through proportionate behaviour. Lumi and the world require no care from the user.

The spatial metaphor does not determine the data model. Exact room interactions, zoom, check-in defaults, meaningful reassessment triggers and mobile presence remain design questions. The [V1 plan](../v1-plan.md) controls delivery scope; richer architecture preserves room for evolution without promising every capability now.
