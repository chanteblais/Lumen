# Coherence Context Package — persistent Drive bridge

Last verified: 2026-09-13. Source implementation: `main` at `c7ca831704044a222574da65047b1fa3a36ac6a2`. This records main, not a verified production deployment.

[Start here](https://docs.google.com/document/d/146aRsp-BY6YrxCZ2-QslBgSNojnsc8DrjFHWVBW-E-Q/edit?usp=drivesdk) · [Package folder](https://drive.google.com/drive/folders/1qGCrQsYVloRsnlyQ9szgmcscLZmkEz36) · [Visual references](https://drive.google.com/drive/folders/1GY9MN7pjzShUBteZJyFLVZrxO25pUZwm)

## Purpose and authority

The user requested a compact cloud briefing for regular ChatGPT/Lumi conversations and routines without repository access. The four living documents adapt existing reconciled material instead of duplicating the full canon. This is an on-request refresh workflow; no scheduled job was requested or created. Access through this Drive connection is verified; access by a separate conversation/routine has not been tested. Do not claim that a link alone confers access.

For current behavior prioritize implementation on main, then reconciled canonical documentation, recent explicit decisions, then older plans. Explicit user decisions can revise direction without implying a code change. Preserve:

- **CURRENT CANON — IMPLEMENTED:** verified in code on the recorded baseline.
- **CURRENT CANON — SETTLED:** explicitly approved constraint, even if not delivered.
- **DIRECTION:** agreed intent not necessarily implemented.
- **OPEN QUESTION:** genuinely unsettled choice.
- **HISTORICAL/REJECTED:** previous ideas that must not silently return.

## Stable cloud targets

Location: My Drive / ChatGPT / Coherence Context Package. Preserve the existing private sharing state.

| File | Drive ID | Link |
|---|---|---|
| COHERENCE_START_HERE | `146aRsp-BY6YrxCZ2-QslBgSNojnsc8DrjFHWVBW-E-Q` | [Open](https://docs.google.com/document/d/146aRsp-BY6YrxCZ2-QslBgSNojnsc8DrjFHWVBW-E-Q/edit?usp=drivesdk) |
| COHERENCE_CURRENT_STATE | `1IBaGK5uFsBPUyQNSJPONetsyhkdLqRkFF5QKy_sMosc` | [Open](https://docs.google.com/document/d/1IBaGK5uFsBPUyQNSJPONetsyhkdLqRkFF5QKy_sMosc/edit?usp=drivesdk) |
| COHERENCE_DESIGN_CANON | `1GlL3ybXJNul7cUTmbS0n9yHXINmx1eCAqN9EB1SMyvA` | [Open](https://docs.google.com/document/d/1GlL3ybXJNul7cUTmbS0n9yHXINmx1eCAqN9EB1SMyvA/edit?usp=drivesdk) |
| COHERENCE_OPEN_QUESTIONS | `1qdiYwhW30eYalKgxlQwx4AuQICBNg0MgnGzXsUm2aWk` | [Open](https://docs.google.com/document/d/1qdiYwhW30eYalKgxlQwx4AuQICBNg0MgnGzXsUm2aWk/edit?usp=drivesdk) |
| COHERENCE_RECENT_CHANGES | `1JFvuLMVuMx19e5-d4Y-OkhYhKOsMO123IEnXP-Aeg3k` | [Open](https://docs.google.com/document/d/1JFvuLMVuMx19e5-d4Y-OkhYhKOsMO123IEnXP-Aeg3k/edit?usp=drivesdk) |

## Refresh when asked to sync

1. Read this handoff and the current cloud documents, including user edits. Do not assume the cloud still matches an earlier draft. Use the Google Drive/Docs skill and its current read-before-write procedure.
2. Inspect current main, working-tree differences and relevant docs; compare material changes since the verified source commit. Do not import unmerged work or untracked mockups as implemented.
3. Start with PROJECT-CANON.md, docs/features.md, docs/today.md, docs/design-system.md, docs/product/shared-model.md, and docs/living/{decisions,open-questions,reconciliation}.md. Follow the relevant space/behavior docs as needed. Confirm UI against route/component code.
4. Edit only affected cloud sections in place using the IDs above. Correct obsolete facts; preserve useful rationale, stable question IDs and still-open portions. A mockup or implementation choice alone does not settle a product question.
5. Capture changed UI from a build of the verified main baseline. Replace affected image bytes with Drive update_file under the same IDs below; do not create accumulating dated duplicates. Current captures are actual interface images, not generated mockups.
6. Keep approximately 10–20 newest meaningful changes, consolidating cosmetic iterations. Update dates/baselines only after verification. State missing verification or screenshots instead of inventing coverage.
7. Read back edited content, headings, dates/links and file metadata; verify visual captures. Update this baseline and any changed IDs, then briefly report what materially changed.

## Visual inventory

Captured from the actual main build served at localhost:3010 on 2026-09-13, desktop browser window. Original application was on localhost:3006 in another checkout; it was not used as main screenshot evidence. Unaltered captures include browser chrome, a development badge and sometimes the development-only Lumi cue handle. Those are not production UI. Conversation text in images is historical content, not canon.

| Image | Drive ID | Purpose |
|---|---|---|
| 01-home.jpg | `1rkeykuDTSb9N1wu0Oe--ahzKtbH4uYhk` | Home arrival and composer |
| 02-navigation.jpg | `1bpYdQ44T_VRe3O_wNpEDuHDdydFQnSyF` | Expanded navigation |
| 03-today-garden.jpg | `1cSwwy3F-s8f0vXtrUEYERIB2cPMWGJoE` | Today/Garden with task path |
| 04-task-not-this.jpg | `1DOF92UlcXfJ_NUlGJmjXyxFldhTvDvZ2` | Not this task control |
| 05-library.jpg | `1mnI9QCYJnGnjr4PA6b5BwEyRzwrg4K2b` | Room-only Library |
| 06-lumi-bubble.jpg | `1a_VwVTiaz_-rXQmo33RoXw2LLMj_KhWk` | Lumi companion composer |
| 07-settings.jpg | `1Cfw0hTyP-ZIWDmKtSvyeSt-tgghmx4-z` | Settings placeholder |
| 08-home-conversation.jpg | `1sb477pXBwf6V8859LtrITXMFj71rBhbg` | User/Lumi conversation layout |

No separate Lists/Garden/Study route exists; Today is the task/Garden reference. Insights was inspected but not uploaded to avoid including unrelated personal mail. Mobile and active focus sessions remain screenshot coverage gaps, explicitly disclosed in the cloud index. Add appropriate actual captures on a future refresh when available. Do not substitute archived mockups.

## Initial reconciliation findings

- Library is currently room-only: no list panel, clickable shelves, books or search. Intentions/list membership still serve Lumi and Today.
- No Coherence balance, currency, storefront or progression system is implemented. Earning/spending and completion unlocks are rejected; continuity-based environmental growth is direction, concrete mechanisms open.
- Study is not a separate page; focus sessions run on Home. Session-timeout abandonment learning conflicts with the approved inactivity-is-not-failure boundary and remains Q28.
- Existing Google Docs named Coherence — Home, Today / Garden, Lists / Library, Spaces of Coherence, Focus / Study, Visual Language and Motion & Interaction were discovered and preserved. The package adapts their reconciled repository counterparts; it does not overwrite or move the originals.

