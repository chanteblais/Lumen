# Coherence — Domain Model (V1)

*[Shared terminology](product/shared-model.md) describes the intended model. Existing `intention`, belief-source labels and session states below remain the actual schema; they are not equivalent to the full Thread / Intention / Action model or four epistemic categories. No migration or new field is implied.*

Eight tables. Everything keyed by `user_id`. Vocabulary is deliberate: an **intention** is something the user meant to do — it may be vague, it has no status beyond open/done/dropped, and its most important field is `next_action`.

## Tables

### `users`
| column | type | notes |
|---|---|---|
| id | uuid pk | internal id — everything references this, never the Clerk id |
| clerk_user_id | text unique | auth provider id |
| display_name | text | what Lumi calls you |
| timezone | text | IANA, captured from the browser on first visit |
| preferences | jsonb | `{ v: 1, session_minutes: 45, check_in_minutes: 15 }` — tone is *learned* as a `preference` belief, not set here |
| created_at, last_seen_at | timestamptz | `last_seen_at` bumped on every turn and page open |
| last_reflected_at | timestamptz null | watermark for the reflection job |

### `conversations`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| kind | text | `'main'` — exactly one per user in V1, created lazily. Unique partial index `conversations_user_main_idx (user_id) WHERE kind = 'main'` (`0006`), so two first visits racing can't make a second (`ensureMainConversation` inserts on conflict do nothing, then reads) |
| summary | text null | unused (older conversation reaches a turn as episodes) |
| summary_through_message_id | uuid null | consolidation's watermark: messages up to it are folded into memory. No FK, on purpose — see *Pointers without foreign keys* below |
| consolidating_until | timestamptz null | (`0006`) a consolidation run's lease: taken before its model call, cleared when it finishes, free once expired — so two instances don't both pay for a model call on one stretch |
| created_at, updated_at | | |

### `messages`
| column | type | notes |
|---|---|---|
| id | uuid pk | client-generated (AI SDK) or server |
| conversation_id | fk | index `(conversation_id, created_at)` |
| role | text | `user | assistant | system` |
| parts | jsonb | AI SDK `UIMessage.parts` — text, tool-call, tool-result, and `data-shared-file` (`{ name, kind }`), the note kept in place of a file shared with a message; the file itself is never stored (`core/shared-files.ts`, 2026-09-13). Message *metadata* (`kind: declined | start_intention | break_down | session_event`, ids, reason/response) travels with the request and is acted on by the route; it is **not** persisted — the events table holds what happened, and a reloaded transcript shows the visible text only |
| format_version | int | `1`; bump on shape changes |
| created_at | timestamptz | |

### `intentions`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| title | text | the user's own words, short |
| next_action | text null | smallest concrete physical step — the product's centre of gravity |
| note | text null | why it matters / what's blocking / context |
| status | text | `open | done | dropped` — *stale is derived, never stored* |
| effort_hint | text null | `tiny | small | medium | large` — for capacity matching |
| due_at | timestamptz null | only when the user named a real deadline, or gave the row a date on the Lists sheet. **A day with no time is stored as 00:00 local that day** (`core/due-date.ts`, 2026-09-13) and read as a day to get it done by; any other time is a fixed-time commitment (Today → Later, `dueOn`). A page date writes `intention.updated {fields: ["dueAt"], via: "app"}` |
| source_message_id | uuid null | the message that created it |
| last_touched_at | timestamptz | any mention, edit, or session |
| created_at, completed_at, dropped_at | | |

### `focus_sessions` — unused since 2026-09-13 (sessions removed from the product; the table and its rows are kept)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| intention_id | fk null | |
| goal | text | what we're doing, in words |
| first_step | text | the activation step agreed before starting |
| approach | text null | the strategy being tried ("read the last paragraph first") — reflection links it to the outcome |
| planned_minutes | int | |
| check_in_minutes | int | copied from preferences at start |
| started_at | timestamptz | |
| ended_at | timestamptz null | |
| outcome | text null | `completed | stopped_early | abandoned` (abandoned = closed by a later visit, no end signal). One session runs at a time: starting another closes the open one as `stopped_early` (or as `abandoned`, if it was already past its threshold and not yet swept), and the unique partial index `focus_sessions_user_open_idx (user_id) WHERE ended_at IS NULL` (`0006`) holds it when two starts race. Built M5 (2026-09-12), no migration — the table was in `0000` |

### `memory_notes` — beliefs with evidence
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| kind | text | `fact | project | preference | strategy | pattern | anti_pattern` — *strategy* = what helps this user start; *anti_pattern* = what reliably doesn't |
| content | text | one sentence, present tense |
| source | text | `user_said | lumi_inferred | reflection` |
| confidence | real | 0–1. `user_said` 0.9 (corrections 0.95). Anything inferred (`lumi_inferred`, `reflection`) starts at ≤ 0.6, enforced in code (`boundConfidence`); confirmations can raise it later |
| evidence_for / evidence_against | int | incremented by `confirm` / `contradict` and by reflection ops; a create of something already held counts as a confirm |
| last_confirmed_at / last_contradicted_at | timestamptz null | |
| supersedes_id | uuid null | set when a new wording replaces a belief — Lumi's `revise`, the user's correction (chat or Settings), or the user saying what Lumi had only guessed; the old one is retired with reason `superseded` |
| source_message_id | uuid null | the user message it came from: where they said it (their quoted words matched it), or the turn Lumi noticed it. Null from Settings and reflection. No FK, on purpose: a message may go before the belief does. Added in `0003` |
| retired_at / retired_reason | timestamptz null / text null | `user | contradicted | superseded` — soft; visible history. The user's *forgetting* is not a retirement: it deletes the row and every version (see `memory.deleted`) |
| created_at | | when this wording was first held |
| *(later)* embedding | vector | pgvector, when lexical selection stops being enough |

Active belief = `retired_at IS NULL`. Confidence drifts: each `contradict` lowers it; a belief that falls below 0.2 is retired as `contradicted` by reflection, never silently.

What may be stored is decided in code before the insert (`core/domain/memory-rules.ts`): never secrets or instruction-like text; one line, no markup. Which active beliefs a chat turn sees is derived at read time (`core/ai/memory-select.ts`): up to 5 preferences and 3 strategies always, then the ones the conversation is about, then the freshest projects and facts, ≤ 12. A guess below 0.5 that nothing has confirmed for 60 days *fades* — out of the block, still in `recall_memory` and Settings; nothing is stored for it.

### `episodes` — recent memory (2026-09-13, `0004`)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id / conversation_id | fk | cascade |
| summary | text | a few sentences, in Lumi's words: what you talked about |
| left_off | text null | where it was left, when something was left open |
| started_at / ended_at | timestamptz | the first and last message it covers |
| through_message_id | uuid | the last message it covers — the watermark moved here |
| thread_ids | jsonb string[] | threads it touched; a forgotten thread's id is removed. GIN index `episodes_thread_ids_idx` (`0006`) for the `@>` filters. A join table was considered and not built: at V1 scale (one user, tens of episodes) the array and its index do the job, and a thread is forgotten rarely |
| created_at | | |

One per stretch of conversation, written by consolidation (`core/ai/consolidate.ts`) once the stretch is over. The conversation's `summary_through_message_id` is the watermark: messages up to it are folded in.

### `threads` — the Library (2026-09-13, `0004`)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | cascade |
| title | text | what they call it |
| aliases | jsonb string[] | other words they use for it ("the book", "my novel"), ≤ 8 — how a mention is recognised |
| summary | text null | Lumi's quick orientation — what it is, where it stands, what's open — rewritten as notes arrive |
| summary_revised_at | timestamptz null | |
| parent_id | uuid null | (2026-09-13, `0005`) fk to `threads`, set null — the broader thread it sits under ("Memory design" under "Coherence"). Forgetting the parent leaves it loose |
| shelved_by | text null | (`0005`) `user | lumi` — who put it there; Lumi and consolidation never move a thread the user placed (or took off a shelf) |
| last_discussed_at | timestamptz | a note filed or the summary rewritten. *Resting* (30 days) is derived from it, never stored |
| created_at | | |

**Sections and shelves are derived, never stored** (`buildShelves`, `core/domain/library.ts`). A top-level thread with threads under it is a **section** of the Library; inside a section, a thread with threads under it is a **shelf**, and the rest are **books**. A top-level thread holding nothing is **loose** (on the table). At most three levels — section, shelf, book (`MAX_SHELF_DEPTH`, `whyNotShelve`). Everything is ordered by `created_at`, so a section keeps its bookcase as more arrives.

### `thread_notes`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id / thread_id | fk | cascade |
| kind | text | `idea | decision | question | progress | detail` |
| content | text | one specific sentence, ≤ 280 |
| source | text | `user_said` (their words matched a message) · `lumi_inferred` (her reading) |
| source_message_id | uuid null | the message their words came from |
| episode_id | uuid null | fk, set null — the episode it was filed in |
| superseded_by_id | uuid null | the note that replaced it: history, not current |
| created_at | | |

Current note = `superseded_by_id IS NULL`. A thread is a life-model object, not a project table: intentions stay flat and aren't linked to threads yet. Where a thread sits is one parent pointer; cross-links between threads aren't modelled yet. What may be stored runs through the same screens as beliefs. Forgetting deletes — a note with its lineage, or a thread with all its notes — and leaves a `library.forgotten` tombstone.

### `events` (append-only)
| column | type | notes |
|---|---|---|
| id | bigserial pk | |
| user_id | fk | |
| type | text | see catalogue |
| subject_type / subject_id | text / uuid null | intention, session, note |
| payload | jsonb | type-specific |
| occurred_at | timestamptz | |

Index `(user_id, occurred_at)`, `(user_id, type, occurred_at)`, and the unique partial `events_reflection_claim_idx (user_id, subject_id) WHERE type = 'reflection.claimed'` (`0006`) — reflection's once-per-session claim.

### Pointers without foreign keys
`conversations.summary_through_message_id`, `episodes.through_message_id`, `memory_notes.source_message_id` / `supersedes_id` and `thread_notes.source_message_id` / `superseded_by_id` point into history and have no FK, on purpose: a message or an older version can go (the user forgets a belief's chain; a conversation is trimmed) while the row pointing at it stays meaningful, and an FK would either block that or cascade a delete nobody asked for. Code treats a missing target as normal — `unconsolidatedMessages` falls back to the latest episode's `ended_at` when the watermark message is gone (and logs it) rather than re-reading the conversation.

## Events catalogue (V1)
| type | payload |
|---|---|
| `app.opened` | `{ gap_seconds }` — written by `visit` (`requireVisit`; `touchLastSeen` on the very first request) on any page open or turn that follows a gap ≥ 30 min; the newest one is the start of the current *sitting* (see Derived) |
| `capacity.reported` | `{ level: 'low'|'normal'|'high', flags?: ('overwhelmed'|'scattered'|'tired'|'focused')[], note? }` — from the chat tool or Today's prompt |
| `capacity.asked` | `{ skipped: true }` — the user tapped Skip on Today's prompt (M4); it is not asked again that local day. Rendering the prompt writes nothing |
| `intention.declined` | `{ reason }` — *Not this* on Today (M4). `reason` is one of `too_big · too_tired · unclear · not_feeling_it · something_else · nope` (`core/declines.ts`), or null when the older handoff without a reason is used. Since 2026-09-13 written from Today's card (`PATCH /api/intentions/[id]` `decline`), never from a chat message |
| `intention.created` / `.updated` / `.completed` / `.reopened` / `.dropped` / `.touched` | `{ diff? }`; `.completed`, `.reopened`, `.updated {fields}` and `.dropped {reason}` carry `{ via: 'app' | 'chat' }` — the circle on Today or in Lists, or the Lists sheet's ⋯ menu (move, let go), vs a chat tool (`.updated` and `.dropped` since 2026-09-13; older rows have no `via` and read as chat). The chat context's *Recent changes* (`core/domain/activity.ts`) is derived from these, joined to the intention's title and current status. `.completed`, `.reopened` and `.dropped` are written only when the status actually moves (code review A7, 2026-09-13): completing a done thing, reopening an open one or dropping a dropped one returns the row unchanged with no event, so `completed_at` keeps the first tick. Dropping a done thing clears `completed_at`; completing a dropped one clears `dropped_at` |
| `session.started` | `{ goal, first_step, planned_minutes, approach, intention_id }` (M5) |
| `session.check_in` | `{ response: 'ok'|'stuck'|'distracted'|'done', minute }` — `ok` from `/api/session` (Yep), the rest recorded by `/api/chat` when the `session_event` message arrives. End on the bar writes no check-in, only the `session.ended` below. *Not written since 2026-09-13 (sessions removed)* |
| `session.ended` | `{ outcome: 'completed'|'stopped_early'|'abandoned', actual_minutes, approach, intention_id }` — `actual_minutes` is null for `abandoned` (nobody said when it stopped). *Not written since 2026-09-13* |
| `memory.noted` / `.confirmed` / `.contradicted` / `.revised` / `.retired` | `{ kind, confidence, by: 'user'|'lumi'|'reflection' }`; `.noted` and `.revised` also carry `source`; `.contradicted` / `.retired` may carry a free-text `note`. No belief content in any of them |
| `memory.deleted` | `{ kind, versions, keys, by: 'user' }` (2026-09-13) — the user made Lumi forget a belief: the row and every version in its `supersedes_id` chain are gone, and `note` is stripped from their other `memory.*` events (the one sanctioned rewrite of events). `keys` are one-way hashes of each version's content words, so an inference of the same thing is refused (`isForgotten`, the one check for beliefs and the Library — it reads `library.forgotten` too); no words are kept |
| `memory.consolidated` | `{ messages, threads_created, notes, summaries, shelved }` (2026-09-13) — one stretch of conversation folded into memory; `subject_id` is its episode, when one was written |
| `memory.consolidation_failed` | `{ from, through }` (2026-09-13, code review A2) — a consolidation run over the stretch after watermark `from` (a message id, or null) up to `through` failed: the model call threw or returned nothing usable, or applying it failed and rolled back. The watermark stays; the next runs over the same `from` back off by how many of these there are in the last 7 days (10 min · 1 h · 6 h, `consolidationRetryAt`). The subject is the user |
| `library.thread_created` / `.summary_revised` | `{ by: 'user'|'lumi'|'consolidation', their_word? }` — the subject is the thread; `their_word: true` when Lumi made it because they asked, in words the code found in their messages (`add_to_library`'s new thread, `shelve_thread`'s new section). Their word is a flag, never actor `user`; checked words lift the forgotten check, so they can bring back a thread they had forgotten, and nothing else can (code review B4, 2026-09-13) |
| `library.shelved` | `{ under, from, by, their_word? }` — the thread (the subject) moved under `under` (a thread id, or null: taken off its shelf) from `from`; `by` is `user`, `lumi` or `consolidation`; `shelve_thread` on their checked words is `by: lumi, their_word: true`, and counts as their placement (`shelved_by = user`), which Lumi and consolidation won't undo. Before 2026-09-13 that was `by: user` |
| `library.noted` | `{ note, kind, source, supersedes, by, their_word? }` — a note filed under the thread (the subject); `supersedes` is the note it replaced, or null; `their_word: true` when `add_to_library` filed it on their checked words (which may bring back a forgotten note) |
| `library.forgotten` | `{ what: 'note'|'thread', versions or notes, keys, by: 'user' }` — deleted on the user's word. `keys` are one-way hashes of the forgotten content, so consolidation and Lumi can't file it again (`isForgotten`, which reads `memory.deleted` too); no words are kept |
| `email.scanned` | `{ through, read, suggested, backlog }` — one look through the mail (Insights open, last look ≥ 30 min ago). `through` is the watermark the next look starts from; `read` how many new messages were read, `suggested` how many leads came out. `backlog` (2026-09-13, code review A12) is `{ after, before }` or null: older mail this look ran out of pages for, read by the next look after what's new — so mail beyond one look's pages is carried, never skipped, and nothing older than a week is read. The newest one is *when Lumi last looked* |
| `lead.suggested` / `.kept` / `.dismissed` | `{ source, list }` / `{ via, intention_id }` / `{ via }` — a lead appeared, became an intention, or was let go; `via: 'app'` from Insights, `'chat'` from `keep_lead` / `dismiss_lead`. Each once per lead (2026-09-13, code review A6): keeping claims the lead (`status = 'suggested'`) in the transaction that creates the intention, and a second keep returns that intention with no event; a second let-go returns the lead as it is. A lead held already for the same message and title is not inserted again, and gets no `.suggested` |
| `reflection.claimed` | `{}` (2026-09-13, code review A4) — written before reflection does any work on a session (the subject), on conflict do nothing against `events_reflection_claim_idx`; only the caller whose row came back reflects |
| `reflection.ran` | `{ trigger: 'session_end'|'new_day', ops: number }` — subject is the session for `session_end` (M5; `new_day` is M6) |

## Derived (never stored)
| view | rule |
|---|---|
| `staleIntentions` | `status = open AND last_touched_at < now − 14d` |
| `capacityState` | latest `capacity.reported` within the user's local day, plus whether a `capacity.asked {skipped}` exists today — Today's prompt shows only when neither does (`capacityStateFromEvents` in `core/domain/capacity.ts`, over the snapshot's one read of today's events) |
| `declinedToday` | today's `intention.declined` events, newest first, with reasons — never Right now again today; flagged in the context block (`core/domain/intentions.ts`) |
| `visitGap` | `now − users.last_seen_at`, bucketed for prose |
| `currentSitting` | the newest `app.opened` event: when this visit began and the gap it began after (`core/domain/users.ts`). A gap ≥ 7 days makes the sitting a *re-entry*: the greeting offers the coming-back pass, the context block says so on every turn of the visit (not just the first), and letting things go re-cuts the plan |
| `recentActivity` | `intention.*` events in the last 36h, newest first (≤ 15), joined to the intention for title + current status; who did it from `payload.via`. Read only by the chat route for the context block |
| `activeSession` *(not read since 2026-09-13)* | the newest `focus_sessions` row with `ended_at IS NULL` that has not reached the abandonment threshold (`core/domain/sessions.ts`). Read into every snapshot and by the Chat page; the client then follows Lumi's start/end tool parts and its own Done/End taps within the page open (`core/focus.ts → sessionFromMessages`) |
| `abandonedSession` *(no longer swept since 2026-09-13)* | `focus_sessions` with `ended_at IS NULL` and `started_at < now − (planned_minutes × 2)`; closed as `abandoned` by `resolveSession` on the next visit — any page or turn, since it runs inside `loadSnapshot` and on the Chat page. Offered back by the greeting while nothing has been said since it closed |
| `lastSession` | the most recently ended session if it ended in the last 36h — continuity for the context block ("pick it back up") and the abandoned greeting |
| `avoidedIntentions` | open, touched ≥ 3 times, never in a session — feeds reflection |
| `strategyEvidence` | per `strategy` belief: sessions whose `approach` matches, split by outcome |
| `mailScan` | the newest `email.scanned`: when Lumi last looked, the watermark and any backlog (`core/domain/leads.ts → latestMailScan`). Fresh for 30 minutes; Insights looks again only after that |
| `suggestedLeads` | `leads.status = suggested`, newest first (≤ 12 on Insights, ≤ 8 in the context block). Never counted anywhere |

## Added in M3 (migration `0001`)
`intentions.list` (free label from the user's lists; `users.preferences.lists` holds the ordered names, default School · Work · Personal · Later), `intentions.estimate_minutes`, and:

### `day_plans`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| local_date | text | `YYYY-MM-DD` in the user's timezone |
| capacity | text null | level the plan was cut for |
| plan | jsonb | `DayPlanJson`: `dayLine`, `rightNow {intentionId, firstStep}`, `afterThat[]`, `later[]`, `restCanWait`, `closingLine?` |
| reason | text | `new_day | first_items | capacity | declined | reentry | asked | advanced | first_step` — `first_step` (2026-09-13): a step chosen from *Break it down* on Today's card set as Right now's first step, no re-cut (event `plan.first_step`); `declined` now comes from the card and is written twice: at once, with the next Right now picked in code from After that and `note` (a fixed line for the reason, dropped when the path advances), then the model's re-cut of the rest keeping that Right now — the second only if no other row was written in between; `first_items`: the day's plan was cut with nothing to choose from and intentions have since arrived; `capacity` / `declined` / `reentry` (M4): re-cut because capacity was reported, *Not this* was answered, or the coming-back pass let things go. `asked`: re-cut because the user asked in chat for a different shape of day ("something easy", "what should I do now") via the `reshape_today` tool; the ask text rides on the `plan.generated` event, not the row |
| generated_at | timestamptz | newest row for a date is the current plan |

Events added: `plan.generated {reason, ask?}` (`ask`: the user's words when the reason is `asked` — a learning signal, e.g. "easy" three days running), `plan.advanced`, `intention.declined {reason}`, `intention.reopened`, `intention.updated {fields}`, `memory.*` per belief op.

## Added 2026-09-12 (migration `0002`) — mail

### `leads`
Something Lumi noticed that might need doing — in the user's recent mail, for now (`source = 'email'`; a calendar could be a second source) — that they haven't confirmed. Not an intention yet: it becomes one when kept. Not an inbox: a lead is gone once answered, and nothing counts them.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| source | text | `email` |
| source_ref | text | the provider's message id (Gmail); index `(user_id, source_ref)` so a message is never read into a lead twice |
| title | text | what might need doing, in the user's terms ("Reply to Priya about the draft") |
| why | text null | Lumi's one line on where it came from |
| list | text null | the list it would land in if kept — Lumi's guess, constrained to the user's lists |
| due_at | timestamptz null | only when the mail named a real day or time |
| from_name, subject, received_at | text null / text null / timestamptz null | the mail's identifying line — **the body is never stored** |
| status | text | `suggested | kept | dismissed` |
| intention_id | fk null | set when kept (`set null` if the intention ever goes) |
| suggested_at, resolved_at | timestamptz | |

Index `(user_id, status, suggested_at)`, and the unique `leads_user_ref_title_idx (user_id, source_ref, lower(title))` (`0006`): one message can yield several leads, never the same one twice — two looks racing insert on conflict do nothing. `createLeads` collapses whitespace in the title before the insert.

## Deliberately absent
Projects table (use `memory_notes.kind='project'`; add `intentions.parent_id` if ever needed) · priority field · tags · recurrence · subtasks · streak counters · per-intention time tracking · calendar events (post-V1 integration) · mail bodies or a mail cache (read at look time, sent to the model once, never stored) · OAuth tokens (Clerk holds the Google connection).

## Storage
None in V1. (Voice audio never leaves the browser; file attachments are post-V1.)

## Migrations Reference

Drizzle-generated SQL in `src/db/migrations/` (`npm run db:generate` → rename the file to something readable and fix the `tag` in `meta/_journal.json` → review → `npm run db:migrate`, which reads `.env.local` via Node's `--env-file`). Every migration is listed here with its prod status; whenever a migration is created or changed, its full SQL is also printed verbatim in the session summary so it can be reviewed without switching branches.

| File | What it adds | Destructive? | Applied to prod |
|---|---|---|---|
| `0006_data_integrity.sql` | `conversations.consolidating_until` (timestamptz null, consolidation's lease); unique partial indexes `conversations_user_main_idx (user_id) WHERE kind = 'main'`, `focus_sessions_user_open_idx (user_id) WHERE ended_at IS NULL`, `events_reflection_claim_idx (user_id, subject_id) WHERE type = 'reflection.claimed'`; unique `leads_user_ref_title_idx (user_id, source_ref, lower(title))`; GIN `episodes_thread_ids_idx` (code review 2026-09-13, section A) | No (add-only) — but a unique index fails to build if duplicates already exist: run the duplicate checks in the branch summary first | **No** — `fix/data-integrity`; Chanté applies it |
| `0004_library.sql` | `episodes`, `threads`, `thread_notes` (recent memory and the Library) + FKs (cascade on user, conversation and thread delete; note → episode set null) and four indexes | No (create-only) | **Yes** — 2026-09-13, applied by hand (the tables were present before landing; checked). Recorded in `drizzle.__drizzle_migrations` on 2026-09-13, with `0005` (until then only `0000`–`0002` were, so `db:migrate` failed on "already exists") |
| `0005_thread_shelves.sql` | `threads.parent_id` (fk to `threads`, on delete set null) and `threads.shelved_by`, plus the index `threads_parent_idx` | No (add-only; nullable columns) | **Yes** — 2026-09-13, applied by Claude from `feat/library-sections` while in review (add-only, so safe under `main`'s code), in one transaction with the journal rows for `0003`–`0005`; `npm run db:migrate` is a no-op again. `feat/plan-together`'s priorities migration must renumber to `0006`, and its `priorities` table already exists unrecorded |
| `0003_memory_source_message.sql` | `memory_notes.source_message_id` (uuid null, no FK): the user message a belief came from | No (additive, nullable) | **Yes** — 2026-09-13, applied by hand before landing (checked). Recorded 2026-09-13 — see `0004` |
| `0002_leads.sql` | `leads` table (what Lumi noticed in the mail: title, why, list, due, sender/subject/received, status, `intention_id` when kept) + two indexes | No (create-only) | **Yes** — 2026-09-12, applied by Claude with `npm run db:migrate` on `feat/email-insights` (additive, per `branching.md` → Claude sessions) |
| `0001_lists_estimates_day_plans.sql` | `intentions.list`, `intentions.estimate_minutes`; `day_plans` table (one persisted path per user per local date: `plan` jsonb, `capacity`, `reason`) + index | No (additive) | **Yes** — 2026-09-13 (applied by Chanté; journaled) |
| `0000_initial_schema.sql` | All seven tables (`users`, `conversations`, `messages`, `intentions`, `focus_sessions`, `memory_notes`, `events`), FKs (cascade on user delete; session→intention set null), indexes. `users.preferences` default `{v:1, session_minutes:45, check_in_minutes:15}` | No (create-only) | **Yes** — 2026-09-11, run by hand in the Supabase SQL editor; recorded in `drizzle.__drizzle_migrations` afterwards so `npm run db:migrate` is a no-op. Future migrations: `npm run db:migrate` only |
