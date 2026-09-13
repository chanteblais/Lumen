# V1 canon alignment — implementation-gap plan

*2026-09-13. Planning deliverable after the approved canon consolidation. Code inspected on main at `0ccb9b4`, integrated into the reconciliation branch. This proposes bounded implementation work; it does not mark features built, change existing milestone commitments or authorize deployment of unrelated work. Product principles: [Shared model](../product/shared-model.md); delivery history: [V1 plan](../v1-plan.md).*

## Recommendation

Start with three small changes that make existing behaviour more trustworthy: neutral handling of unknown focus outcomes, reliable user-authored memory corrections, and an explicit today-only exclusion. These exercise the existing model and surfaces without waiting for a Study room, a complete Thread schema or Library spatial navigation.

Then honor explicit requests for quiet, restore practical access to what the Library holds, and improve context selection. Build environmental growth only after the product reliably holds the things that make containment credible.

Evidence below is from repository code inspection and existing automated checks, not live user/account testing. “Gap” means a concrete mismatch or missing path, not a measured frequency of harm.

## Prioritized gaps

| Order | Gap and user consequence | Evidence in current code | Smallest useful outcome | Dependency / scope |
|---|---|---|---|---|
| 1 | Leaving the app can count against an otherwise useful strategy | [`isAbandoned` / `sweepAbandoned`](../../src/core/domain/sessions.ts) close an open session after twice its planned length. [`deterministicSessionOps`](../../src/core/ai/reflect.ts) contradicts matching strategies for `abandoned`. `describeSession` also calls elapsed wall time “ran” time. | An unknown ending supplies no automatic negative evidence and no claim of measured work duration. | Existing session/reflection pipeline; no new room or reporting flow. |
| 2 | A user's explicit correction cannot revise an existing user-stated belief through the revision tool | [`revise_belief`](../../src/core/ai/tools.ts) always acts as `lumi`; [`applyOne`](../../src/core/domain/memory.ts) correctly forbids that actor from revising `user_said`. Domain support for a user-authored superseding revision already exists. | The user's correction changes current understanding, preserves its predecessor and is visible next turn. | Add a bounded explicit-correction path; do not remove the protection on autonomous revision. |
| 2a | An inference can receive stronger confidence than the tool description permits | [`remember`](../../src/core/ai/tools.ts) requests ≤0.6 for inference in prose, but its schema allows 0.98 and the domain's generic clamp permits it. | Enforce the inference bound in code; keep explicit information distinct. | Include with memory correction, not a broad memory redesign. |
| 3 | “Not today” is not a complete, consistent operation across surfaces | UI declines are recorded via [`chat/route.ts`](../../src/app/api/chat/route.ts); there is no matching conversational decline/exclusion tool. [`clampPlan`](../../src/core/ai/plan.ts) excludes declined items from Right now, but not uniformly from After that. A model-selected pin can override a decline after a generic replan. | An explicit today-only exclusion stays out of discretionary foreground across reloads, replans and chat until the user deliberately reverses it. | Distinguish explicit exclusion from ordinary “Not this”; retain temporal landmarks and real urgency without silently scheduling work. |
| 3a | A temporary choice can disappear from bounded event context | [`loadSnapshot`](../../src/core/domain/snapshot.ts) loads only 40 combined capacity/decline events, then derives today's declines. | A valid explicit exclusion is not forgotten just because unrelated events displaced it from a query limit. | Include in the scoped-attention query design and tests. |
| 4 | A request for no check-ins has no demonstrated path to the active timer | [`buildTools`](../../src/core/ai/tools.ts) takes an interval from preferences; [`SessionBar`](../../src/components/focus/SessionBar.tsx) always schedules with it. | “Don't check on me unless I ask” suppresses interventions at the intended scope. | Keep the default frequency open; implement explicit opt-out separately from selecting a new default. |
| 5 | The Library promises held breadth but currently offers no direct list view | [`library/page.tsx`](../../src/app/library/page.tsx) renders the room; the [spatial map](../../art/scenery/library/spatial-map/README.md) remains a proposal. | A usable way to retrieve, inspect and act on held items without mandatory chat or grooming. | Concrete interaction review needed; do not restore the rejected paper panel or assume literal shelves by default. |
| 6 | Lumi cannot reliably retrieve beyond the conversational context caps | [`context.ts`](../../src/core/ai/context.ts) caps open intentions at 25; [`conversations.ts`](../../src/core/domain/conversations.ts) loads a message window; the tool set has no general held-item retrieval tool. | Relevant retrieval when asked, without making the user reconstruct what the app already holds. | Begin with bounded retrieval over existing entities; full Threads/embeddings are not prerequisites. |
| 7 | Study and Home receive insufficiently differentiated context | [`buildContextBlock`](../../src/core/ai/context.ts) includes session information but still carries the broad open-intention block; chat metadata does not provide a complete space context contract. | Study sees the current work and useful supporting context without unrelated items competing. | Add explicit space/task context and selection tests after correction/exclusion semantics are dependable. |
| 8 | Rich outcomes, retention and longer-lived rest exceed the current model | Current schema has limited session outcomes, belief sources and no complete rest/archive lifecycle. | Expand only the distinctions proven necessary by real use; preserve provenance and correction. | Separate design and data-migration proposals. Existing open questions 22/25/28 remain authoritative. |

## First tranche — three reviewable changes

### A. Unknown focus endings stay neutral

**Trigger:** the user opens a document, starts writing, leaves Coherence and returns after the session threshold. Today the sweep may contradict the strategy that helped them start.

**Proposed behaviour:** close stale UI session state when necessary without interpreting the unknown outcome as failure. Elapsed time until the next visit is not measured focus time. Automatic timeout alone neither confirms nor contradicts a strategy and cannot establish an anti-pattern. Existing explicit completion handling remains unchanged in this tranche.

**Implementation boundary:** update deterministic inference, the reflection input description and any model-output guard that could reintroduce the same unsupported inference. A prompt-only change is insufficient. A conservative first patch can skip outcome-based learning for legacy abandoned/unknown sessions; a future richer outcome model can recover transcript-supported distinctions. Do not rewrite old events, repair all historical beliefs or add an outcome questionnaire. Decide whether a dedicated closure reason can use existing event payloads before proposing a schema change.

**Acceptance:**

- The user leaves, time elapses and the sweep runs: no negative strategy evidence is added from that fact alone.
- Reflection does not describe return-time wall duration as observed work duration.
- A model response suggesting a contradiction based solely on unknown closure cannot bypass the guard.
- Existing completed and intentionally stopped session paths still close correctly; reflection is not applied twice on repeated visits.
- No new question, timer surface or completion ritual appears.

**Verification:** session-domain and reflection tests at threshold boundaries, repeat visits and model failure/adversarial proposals; check the complete path that schedules reflection, not only the pure helper. Docs: architecture, domain if event semantics change, features if return wording changes, outcome question 28, engineering decision log.

### B. Corrections become current truth without weakening safeguards

**Trigger:** a belief says “mornings work best”; the user explicitly says that this has changed and asks Lumi to correct it. The current revision tool cannot supersede that `user_said` belief as the user.

**Proposed behaviour:** one deliberate correction creates the current statement with user provenance, supersedes the previous statement and removes the superseded belief from active context. An inference still cannot rewrite the user's statement on its own.

**Implementation boundary:** expose the existing user-authored domain revision through a bounded route/tool contract tied to the user's actual instruction and the target belief. Do not make every `revise_belief` call privileged; distinguish explicit correction from autonomous inference. Preserve ownership checks, history and existing forget behaviour. Enforce inference-confidence limits in code at the same boundary. A correction about today must not become a permanent preference.

**Acceptance:**

- Explicit correction succeeds once, produces a supersession link and appears in the next context.
- Another user's belief, an inactive target or an autonomous attempt to revise `user_said` is rejected.
- Lumi reports the tool result, not success when the operation was skipped.
- An inferred create requesting 0.98 confidence is clamped or rejected according to the documented ≤0.6 policy.
- History remains accessible; no second competing active statement is left behind through a retire-and-recreate workaround.

**Verification:** tool-to-domain tests for explicit versus autonomous actors, cross-user IDs, failures and context assembly after revision; a small behavioural evaluation showing correction without repeated clarification. Docs: architecture, shared behaviour references, questions 12/19, voice log only if scenarios are actually run.

### C. Make “Not today” a first-class scoped exclusion

**Trigger:** the user says “Not today” and then reloads, changes capacity or asks for another plan. They should not have to defend the same exclusion again.

**Proposed behaviour:** persist an explicit exclusion for the user's local day, enforce it in discretionary Today selection and conversational recommendations, and preserve the item's importance, category, due date and open status. Tomorrow's eligibility is reconsidered; no tomorrow appointment is created. A later explicit choice of that item may reverse the exclusion; a generic “give me something easy” does not authorize a model-selected pin to do so.

**Implementation boundary:** add one shared operation with conversational and accessible direct entry. Ordinary “Not this” is not automatically the same operation: a too-large task may call for decomposition rather than whole-day exclusion. Prefer existing event infrastructure if it can reliably represent scope and reversal. Query relevant state without losing it behind the current mixed 40-event cap. Do not implement week-long rest, universal priority fields, full drag sorting or background recuration in this patch. Fixed commitments and consequential urgency remain explainable; their treatment must not silently override an intentional exclusion or imply an obligation vanished.

**Acceptance:**

- Menu and conversation produce the same today-only outcome for the same explicit instruction.
- Excluded work stays out of Right now and After that through normal replans, cached-plan reads and advancement.
- More than 40 unrelated events do not erase the exclusion.
- Local midnight, timezone handling and explicit reversal are tested; the operation never writes a tomorrow due date or permanent low priority.
- Generic replan cannot restore excluded work through a pin; explicit user selection can reverse it with an event.
- Model failure respects the exclusion in fallback selection; an empty discretionary plan remains valid.

**Verification:** domain derivation, planner clamp/fallback, persisted-plan pruning/advancement, chat tool and accessible control scenarios; tests with DST/local-day boundaries and interleaved events. Docs: Today, domain/events if changed, architecture, features, EF-burden log, questions 16/20/22.

## What waits, and why

- **Check-in defaults:** do not pick a new default while implementing explicit quiet. Default frequency remains a product choice.
- **Library spatial design:** the map is available, but it is still a proposal and has known painting/geometry lineage. Improve retrieval without declaring fixed collection slots to be the domain model.
- **Full Thread ontology, embeddings and autonomous archival:** larger than necessary for the first trust fixes. Establish reliable state distinctions before richer inference.
- **Environmental growth:** approved as a principle, not an asset-trigger implementation. No completion reward mechanics should be introduced as a shortcut.
- **General automatic plan refresh:** choose meaningful triggers and explanation behaviour separately, preserving stability.
- **Historical belief repair:** stop new unsupported inference first; any retrospective changes require a bounded, reviewable repair proposal.

## Review and delivery sequence

1. Merge the canon with current main while preserving newer documentation and art history.
2. Implement A, B and C as separate small branches with their acceptance checks and doc updates. A has no dependency on Library design; B and C need explicit operation/authority contracts but not a complete new ontology.
3. Review each before production deployment. Use existing tests plus the few behavioural scenarios that prove the changed contract. Do not use a broad rewrite to make an isolated gap easier.
4. Revisit explicit quiet and held-item retrieval next. Keep unresolved designs visible rather than turning illustrative source examples into requirements.

This plan ranks work; it does not claim the fixes have been implemented. No application code changed in preparing it.
