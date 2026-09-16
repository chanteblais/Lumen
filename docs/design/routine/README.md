# Coherence routine — review inbox

This is the incoming side of the Coherence context bridge: **Coherence App Mockups Routine** produces ideas; Codex imports them here for Chanté and Claude to review while developing the app.

## Authority

Read [PROJECT-CANON.md](../../../PROJECT-CANON.md) first for product work. These are **proposals, not accepted decisions or implementation instructions**. Source headings such as “CURRENT CANON” describe the routine's understanding and may be stale. Check current code for implementation and canonical documents for intent. Approval is recorded by Chanté and Claude in [review.md](review.md), with a link to any resulting canonical decision or implementation.

## Source and coverage

- Source task: Coherence App Mockups Routine, ID `6aa6a5a8-4560-83e8-b139-254068cca7d1`.
- Initial import: 2026-09-14, 21 proposals and one visual-rejection correction from the grounded phase of the routine. Setup conversation and the earlier ungrounded attempt are excluded.
- A separate generated Drive document was not found; the routine's written messages are the imported source.
- Full text is retained per message in `entries/`; original citation markers remain opaque, not independently verified citations.
- The task reader exposed no downloadable image attachments. No generated visual is represented as imported or approved. One source message explicitly rejects its generated visual; retain that correction.
- Source cadence update observed 2026-09-15: the source task records a user request and confirmation changing generation to every 12 hours (message `43685209-96ff-43bd-82ad-968a7298acb2`). Exact schedule minutes are unavailable. This importer continues polling hourly under its saved instructions and catches completed messages on the next check.

## Review starting points

Repeated themes include autonomy and confirmation, priority declarations, continuity without rewards, Study entry, focus check-ins and Insights placement. Later proposals are alternatives/refinements, not automatic replacements. Review them together before choosing a direction.

The current repository already describes Lists as a navigation sheet; source assertions that Library is room-only do not establish that list access is absent. Validate all implementation claims against the current checkout. The rejected visual must not become an art reference.

## Imported entries

Oldest to newest in the source response. All proposals start unreviewed.

- [The room remembers](entries/e6dddb1b-ea35-4ad8-a18a-19bf7fe96308.md)
- [Lumi may tidy the foreground; she may not rewrite your life](entries/773f4560-9aa6-4242-82f7-6c2a12c83558.md)
- [Priority is a sentence, not a score](entries/5d7d72db-03ed-4bb2-88a6-30b8946439e3.md)
- [An invisible conversational stance](entries/939faf25-d15d-493e-a854-12899f8f7aa7.md)
- [Silence is not an outcome](entries/6799663f-29f2-4d85-8fe4-b10504c792e5.md)
- [Context is composed, not decayed](entries/23f05861-415f-42ef-af0c-dae00a6a8d84.md)
- [Bring things to the reading table](entries/fbb425c9-2dab-4c86-ae4f-2c2662585a00.md)
- [Memory receipts, not memory management](entries/6ab59fef-70f9-459c-8043-b4e6e8828ea0.md)
- [Insights is a review state, not a space](entries/203d4262-87c9-4927-a56c-7f41a71bce93.md)
- [Study is a temporary focus state with an origin, not a permanent destination](entries/059eb6b1-9848-40b7-b17b-03e6546cccfe.md)
- [Re-entry is the adaptation boundary](entries/0e99a08c-8e87-4e75-9112-d779ea9e4acc.md)
- [Keepsakes, not progress](entries/c32da1b4-35b7-400f-b75d-eec45fad1c87.md)
- [Let me adjust the path, not the underlying priorities](entries/58e097c3-6320-4d32-99c7-3ba33581c7b2.md)
- [Action requires a commitment signal, not merely actionable content](entries/abe4940f-7caf-433c-9fc0-54a596173a46.md)
- [Proactivity requires a changed situation, not merely an important fact](entries/875d29d9-04ea-4de6-8396-005b160e49ec.md)
- [Priority declarations, not priority scores](entries/86d168b1-3ff3-47f1-9e77-f3f818295809.md)
- [Correction: generated visual rejected](entries/b5d93703-4f36-4eb8-9f7e-8c33ab5ce746.md) — source correction
- [Study should be a temporary focus state entered through commitment, not a place the user has to go find](entries/df477473-8157-44fa-b13d-8943ff9b51a3.md)
- [Delegation envelopes](entries/eba2413c-b850-428c-a6cd-c828723a2512.md)
- [Make check-ins a session-level relationship, not a repeating timer](entries/912491f3-bfe6-40e8-8560-1ef50361ddcc.md)
- [Traces of continuity](entries/324bd4bd-308f-4dba-8fff-f43acc04c568.md)
- [Insights becomes “Noticed,” a temporary Library lens rather than a permanent destination](entries/6eca7f28-22e6-4821-b208-c6e5b09fec2f.md)
- [Action requires a hinge](entries/79aaff98-3cc4-453d-852d-6e8379eeb872.md)
- [Scoped priority claims](entries/a29eb3bf-8b03-4ed3-8172-ca38fe197535.md)
- [Re-entry checkpoints, not continuous recuration](entries/3b5a6736-bf17-4fd3-a15a-034b1d21389f.md)
- [“What’s shaping this?” rather than a memory database](entries/ad88ebe2-b823-4761-8f4b-3f7ea8652b3f.md)
- [Make Thread the first durable container of continuity](entries/1c17559a-8052-4633-8f65-6389ef88bb65.md)
- [Separate the work trace from the support trace](entries/9459fa6b-bd90-48e7-ae2d-4bd9211067d8.md)
- [Bounded mandates](entries/46f3f8e4-1b25-4ca0-be8b-79b84297efe9.md)
- [Three levels of initiation](entries/f96472e4-6c60-446d-b88c-33aa5f26bc41.md)
- [Elastic presence](entries/bf62eded-6851-46e0-97be-dbcd97948f81.md)
- [The Hinge](entries/223459e0-a2e3-4dc4-ab57-2592a891639f.md)
- [Context Capsules](entries/e1ab416e-4084-4379-86f3-07c73ef19bb7.md)

## Continuous sync contract

The hourly Codex heartbeat reads the source task and paginates as needed. Deduplicate by source message ID using [sync-state.json](sync-state.json). Import complete new proposal text and corrections; preserve existing source entries and all human review notes. If a previously imported message changes, preserve its previous version and flag a source revision for review. Do not treat repeated topics as duplicate messages.

Do not advance the checkpoint on a failed or truncated read. Leave existing files intact, record the problem, and retry next run. If an attachment cannot be retrieved, record that limitation rather than inventing or recreating it. Only announce new reviewable material, a meaningful correction, or a sync failure requiring attention. No changes to application code, canon, approvals, commits, merges, cloud documents or the source routine are part of this sync.

Write additions directly to this shared review inbox, without switching branches or staging another session's work. Re-read files before updating to preserve concurrent edits. Review notes belong in `review.md`, which the importer must never overwrite. If working in another checkout, Claude should read this shared inbox at `/Users/chante/Projects/lumen/docs/design/routine/` until these files are committed and carried into that checkout.

