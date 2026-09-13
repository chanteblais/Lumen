# Open questions

*Current register after the approved 2026-09-13 reconciliation. IDs 1–27 are preserved; 28 records an implementation gap. “Resolved” settles only the stated principle, not every associated design or delivery choice. The [previous register](../archive/2026-09-13-before-reconciliation/docs/living/open-questions.md) preserves its complete rationale and original references. Approved requirements: [decisions](decisions.md) and [Shared terminology](../product/shared-model.md).*

No entry authorizes a code change or expands [V1](../v1-plan.md). Questions about implementation remain open even when the intended behaviour is clearer.

## 1. What does Home keep?

**Status: Principle clarified; interface open.** Home supports arrival, reflection and silence without a compulsory task or conversation. Decide which quick-start chips, re-entry prompts and session controls remain. Current Home still hosts them.

Related: [Home](../product/home.md).

## 2. How does Focus move into the Study?

**Status: Direction settled; transition design open.** Study is the mode for present work; not every start needs a session. Decide navigation, where the session bar lives and the transition from Today. Focus sessions were removed from the product on 2026-09-13 (Chanté: "for now"); the Study direction stands, and what a session is when it returns is part of this question. The summary question is “What are we doing now?”; this is not mandated UI copy.

Related: [Study](../product/focus-study.md).

## 3. How does the broad Library become navigable?

**Status: Role settled; spatial design open.** Library exposes active context, Threads, relationships and history. “Where have I been?” is one use, not its entire role. Decide collections, browsing/search, detail access and how the spatial proposal fits without forcing the data model into shelves. The current page is only its room; lists still feed Lumi and Today, and since 2026-09-13 are browsed in the Lists sheet from the nav ([decision](decisions.md#2026-09-13--lists-is-in-the-nav-again-as-a-sheet-over-the-page-youre-on)) — whether that sheet later folds into the Library's navigation is part of this question. Literal zoom and intellectual book presentations are candidates, not requirements. The [first-pass spatial map](../../art/scenery/library/spatial-map/README.md) now accompanies main: four collection slots, three expansions and names layered on blank plaques, redrawn as v3 on the isometric painting served since 2026-09-13, which answers its projection question; seven questions remain for Chanté (slot count, the alcove, painted books, naming, Lumi's size in the room, the presentation model, the stage). It remains a proposal, not approved interaction design. **Partly answered 2026-09-13** (Chanté: "Threads that become categories should gain their own section in the library… click on the different sections and see all the books"): sections are threads that hold threads, shelves inside them, books titled by their threads ([decision](decisions.md#2026-09-13--threads-that-become-categories-become-sections-of-the-library)). A section is like a category (yoga, cooking, the book they're writing, an area of focus: something they keep mentioning in various ways), and threads fall under it. Built on `feat/library-sections`, with names on the bookcases in fill order and a parchment view per section and book, and accepted as a working version. Until it's integrated properly, all of it shows only in a hidden debug mode. Proper integration into the room waits by her choice. The slot count, the alcove, painted close-ups, Lumi's size and the stage are still open.

Related: [Library](../product/lists-library.md).

## 4. Where does Insights belong?

**Status: Open.** Insights remains its own page. Decide whether mail context is accessed through Library, Home or another appropriate projection without creating a processing obligation. Integrations feed the shared model; they must not flood Today.

Related: [Garden §99](../product/today-garden.md#99-connected-services-should-feed-context-not-dominate-the-garden).

## 5. Which tending interactions become visible?

**Status: Semantics clarified; gestures open.** Planting, tending, resting and pruning describe behaviour without requiring gardening vocabulary. Rest has temporal scope; pruning from active attention is not deletion. Decide which gestures appear and where. Today remains the existing paper-panel path.

Related: [Garden](../product/today-garden.md).

## 6. What can environmental growth respond to?

**Status: Reward counting closed; continuity design open.** No earning balance, task-completion currency or unlock thresholds. Decide whether and how accumulated context changes a place without producing a hidden output score or making a hard month visible as failure.

Related: [Shared environment principles](../product/shared-model.md#environment-and-scope).

## 7. Where does growth live, and does it need care?

**Status: Care requirement closed; placement open.** The world and Lumi require no maintenance, and absence costs nothing. Decide which environmental changes belong in existing spaces. A separate Lumi’s World is not approved by this reconciliation.

Related: [Spaces](../product/spaces.md).

## 8. How does a place grow?

**Status: Open within settled boundaries.** Growth is slow, familiar and optional, arising from continuity rather than rewards. Concrete triggers, assets and presentation remain open; do not imply these mechanisms are already built.

Related: [Garden](../product/today-garden.md).

## 9. What may Lumi initiate?

**Status: Open.** Usefulness, restraint and consequence govern intervention; engagement is not a reason. Define permitted triggers for reminders, notifications and unsolicited context. Current greetings remain as built; check-ins were removed with focus sessions (2026-09-13), so Lumi currently initiates nothing.

Related: [Lumi](../philosophy/lumi.md).

## 10. Where are the boundaries of autonomous action?

**Status: Principle settled; operations open.** Confirmation follows uncertainty, consequence and reversibility. Separate interpretation, proposal and committed change. Decide rescheduling, deletion and mail-action boundaries; the reconciliation does not authorize external actions or change existing tools.

Related: [AI & Information Architecture](../product/ai-and-information-architecture.md).

## 11. How are stated priorities represented over time?

**Status: Semantics settled; representation first cut (2026-09-13, `feat/priorities`).** Keep user-expressed priority separate from urgency and Lumi’s attention recommendation. A Today-only override does not erase enduring importance. No universal priority score is implied.

First cut ([decision](decisions.md)): a stated priority is a row of its own — the user's words, an optional intention, a scope of *a week* (this or next) or *for a while* — kept apart from beliefs and the day plan, and it comes only from what they say to Lumi. Expiry is derived (a week's priority stops holding when the week ends); supersession retires the old row as history. A Today-only ask stays `reshape_today` and writes no priority. Still open: whether priorities should attach to Threads once they exist, whether *for a while* needs a gentle re-check after long quiet, how Lumi shows what she's holding (question 12), and whether Library or direct manipulation can express one.

Related: [Shared terminology](../product/shared-model.md#priority-and-temporal-scope).

## 12. How can the user inspect and correct memory?

**Status: Principle settled; surface open.** Make meaningful explanations and correction available without a memory-curation obligation. Decide whether a dedicated page is useful, what it shows and how it relates to Library and conversation.

Related: [Library](../product/lists-library.md).

## 13. What survives of the book?

**Status: Shared direction resolved; concrete design open.** Editorial typography, material restraint and crisp legibility survive within inhabited places. Book-only and no-imagery prohibitions are retired. Exact components, spatial composition and token changes require their own design work.

Related: [Visual Language](../design/visual-language.md).

## 14. Rewards or inhabited growth?

**Status: Resolved 2026-09-13.** Chanté approved continuity-based environmental growth. No earning/spending coherence, completion unlocks, reward economy or absence punishment. Recognition of beginning and returning survives through proportionate behaviour. Earlier proposals remain in the decision history and ideas register.

Related: [Approved decision](decisions.md#2026-09-13--approved-documentation-reconciliation).

## 15. Which names does the user see?

**Status: Partly resolved.** The existing Library navigation label remains deliberate. Home / Today / Library, then Lists / Insights, then Settings is the current navigation — rooms, tools, utility, each group set apart (Lists added 2026-09-13 as a sheet over the page, not a rename of the Library). Functional names in the supplied docs are examples, not an instruction to rename Library back to Lists. Study access and remaining labels are open.

Related: [Spaces](../product/spaces.md).

## 16. How do Not this and re-entry respond?

**Status: Principles clarified; controls open.** Rejection need not be interrogated. Re-entry may include still relevant, already done elsewhere, changed, deferred or let go. Decide the smallest useful controls and replies; preserve current behaviour as implementation evidence rather than treating every example as a new chip.

Related: [Garden](../product/today-garden.md).

## 17. When may Lumi mention a number?

**Status: Decided for time away (2026-09-13); open for counts inside patterns.** No burden-inducing tally of unfinished things. **Time away:** in conversation, Lumi may name how long someone has been away when it helps them get their bearings, never so the absence sounds owed ([decision](decisions.md)). Pages still show neither the gap nor what piled up. **Still open:** whether a contextual count usefully explains a pattern ("you've moved this three times"). Don't loosen the persona for that while adopting product examples.

**How the time-away half was settled.** The persona said never say how long it's been. The model strategy's own example names the gap: *"You disappeared for four days. We don't need to reconstruct the four days."* In voice eval run 5 Lumi echoed the user's "two weeks" while declining to reconstruct them, which read as the documents disagreeing rather than as a bad reply. Review feedback Chanté relayed recommended allowing elapsed time when it helps orient the user, while avoiding anything that makes absence feel like a debt, and judging a number, a time reference or an explanation by whether it adds burden or costs agency. Chanté adopted it the same day; the persona and the context block's re-entry line changed with the decision.

Related: [Lumi](../philosophy/lumi.md).

## 18. What should check-in defaults be?

**Status: Open; explicit quiet instruction settled.** Check-in frequency and defaults remain undecided. User instructions such as “Don’t check on me unless I ask” are authoritative. Timed check-ins were removed with focus sessions on 2026-09-13; Study’s presence should not become supervision or engagement pressure.

Related: [Study](../product/focus-study.md).

## 19. How should consequential inference appear?

**Status: Principle settled; UI/storage open.** Explicit, observed, inferred and derived information differ. Decide which guesses need visible provenance or confirmation and how quietly. Existing intention provenance and belief labels do not fully implement the four categories.

Related: [Shared terminology](../product/shared-model.md#objects-and-knowledge).

## 20. How does direct manipulation express scope?

**Status: Optional correction approved; interaction/event design open.** Equivalent input methods should agree when operation and timescale agree. Not today is not a list move or a tomorrow date. Define event representation, Today reordering, durable organization, undo and non-drag/mobile alternatives. Do not infer a permanent preference from one rearrangement.

Related: [Motion & Interaction](../design/motion-and-interaction.md).

## 21. How do we evaluate Lumi’s model?

**Status: Provider switch recorded; comparative evaluation open.** Main runs gpt-6-astra for chat, day planning, leads and reflection, with the Anthropic implementation retained. Blind comparison, tool reliability, quality, latency and cost evaluation remain open. Voice-eval runs 4 and 5 carry Claude's provisional grades, not blind ([log](../voice-eval-log.md)). Runtime choices do not establish product philosophy.

**Method, from review feedback Chanté relayed (2026-09-13); proposed until she settles it:** a grader who is involved grades blind on consistent criteria rather than abstaining, and every run records its grader. Voice and usefulness are graded separately. Rules about numbers, time and explaining herself serve burden and agency; they aren't prohibitions. The largest gap is judgement across short conversations with tools: does Lumi use what she knows, respond well to correction, leave reflection alone when appropriate, and make the next move easier? The nine single-reply scenarios can't show this, and a paired same-clock run is needed before any conclusion about the brief.

**Conversations (2026-09-13).** `scripts/conversation-eval.mjs` runs short conversations with the real tools against a throwaway database, checks the actions in code, and can pair each scenario with and without the brief at one clock, with a blind packet ([log](../voice-eval-log.md) → Conversations). Still missing: a spiral, a framing worth challenging, and a pattern across days, which needs structure question 22 hasn't settled. Still open: who grades the blind packets, and how many runs a conclusion needs.

Related: [Model strategy](../product/lumi-model-strategy.md).

## 22. Which richer concepts become structure first?

**Status: Partly answered.** Threads come first (2026-09-13, confirmed by Chanté — [decisions](decisions.md): *Recent conversation lives on, and what mattered is filed in the Library*). Threads, their notes and short memories of each visit now exist as life-model objects, filled from conversation by consolidation; how the Library presents them is question 3. Since 2026-09-13 a thread can sit under a broader thread, and one that holds threads is a section (still one place per thread). Still open: cross-links between threads, relationships, commitments, scoped exclusions, outcomes, and how threads relate to intentions (still flat, combining Intention and Action). Preserve conceptual distinctions without prematurely building the entire ontology or expanding V1.

Related: [AI & Information Architecture](../product/ai-and-information-architecture.md).

## 23. How does Lumi balance reflection and action?

**Status: Role clarified; behavioural evaluation open.** Home supports reflection without compulsory taskification; usefulness is not conversation length. Determine and evaluate when to stay with ambiguity, challenge gently or help the user return to action. Current action-weighted prompt remains unchanged.

Related: [Home](../product/home.md).

## 24. How does context selection evolve beyond one block?

**Status: Open.** Define space-specific context, Study compression, retrieval beyond caps, observability, relevance decay and reconciliation between memory and current state. Current assembly remains one capped block; a 14-day stale heuristic does not prove avoidance or irrelevance.

Related: [AI & Information Architecture](../product/ai-and-information-architecture.md).

## 25. What should Coherence retain, forget, export or delete?

**Status: Open.** Distinguish relevance decay, archival, supersession and deletion. Decide retention periods, ephemeral inference, user export/delete controls and propagation to history and beliefs. Product direction is not an implemented privacy guarantee.

Related: [Architecture](../architecture.md).

## 26. When should Today adapt during the day?

**Status: Open.** Stability and meaningful adaptation are compatible. Decide elapsed-time/re-entry triggers, how changing circumstances affect the plan and when a substantial change needs explanation. Current documented triggers remain as built; no background recuration was added.

Related: [Today as built](../today.md).

## 27. How is Lumi present on mobile?

**Status: Open.** Preserve cognitive hierarchy, accessibility and reduced-motion presence without shrinking desktop scenery or adding clutter. Current implementation hides Lumi below 768px. Decide the mobile representation; the reconciliation changes no UI.

Related: [Visual Language](../design/visual-language.md).

## 28. What can session endings actually tell us?

**Status: New implementation gap.** The session sweep can mark an open session abandoned, and deterministic reflection can contradict a strategy for abandonment. Study allows leaving the app while continuing work. Decide how unknown endings, explicit abandonment and richer outcomes affect learning without asking users to report more. Timeout or inactivity alone must not be treated as proof of an ineffective strategy. Code remains unchanged.

Related: [Architecture](../architecture.md).
