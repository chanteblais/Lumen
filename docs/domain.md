# Lumen — Domain Model (V1)

Seven tables. Everything keyed by `user_id`. Vocabulary is deliberate: an **intention** is something the user meant to do — it may be vague, it has no status beyond open/done/dropped, and its most important field is `next_action`.

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
| kind | text | `'main'` — exactly one per user in V1, created lazily |
| summary | text null | rolling summary of messages older than the window (M6) |
| summary_through_message_id | uuid null | where the summary ends |
| created_at, updated_at | | |

### `messages`
| column | type | notes |
|---|---|---|
| id | uuid pk | client-generated (AI SDK) or server |
| conversation_id | fk | index `(conversation_id, created_at)` |
| role | text | `user | assistant | system` |
| parts | jsonb | AI SDK `UIMessage.parts` — text, tool-call, tool-result, metadata (e.g. `session_event`) |
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
| due_at | timestamptz null | only when the user named a real deadline |
| source_message_id | uuid null | the message that created it |
| last_touched_at | timestamptz | any mention, edit, or session |
| created_at, completed_at, dropped_at | | |

### `focus_sessions`
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
| outcome | text null | `completed | stopped_early | abandoned` (abandoned = closed by a later visit, no end signal) |

### `memory_notes` — beliefs with evidence
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| kind | text | `fact | project | preference | strategy | pattern | anti_pattern` — *strategy* = what helps this user start; *anti_pattern* = what reliably doesn't |
| content | text | one sentence, present tense |
| source | text | `user_said | rali_inferred | reflection` |
| confidence | real | 0–1. `user_said` 0.9 (corrections 0.95), `rali_inferred` 0.4–0.6, reflection sets per evidence |
| evidence_for / evidence_against | int | incremented by `confirm` / `contradict` and by reflection ops |
| last_confirmed_at / last_contradicted_at | timestamptz null | |
| supersedes_id | uuid null | set when `revise` replaces a belief; the old one is retired with reason `superseded` |
| retired_at / retired_reason | timestamptz null / text null | `user | contradicted | superseded` — soft; visible history |
| created_at | | |
| *(later)* embedding | vector | pgvector, when active beliefs exceed the injection cap |

Active belief = `retired_at IS NULL`. Confidence drifts: each `contradict` lowers it; a belief that falls below 0.2 is retired as `contradicted` by reflection, never silently.

### `events` (append-only)
| column | type | notes |
|---|---|---|
| id | bigserial pk | |
| user_id | fk | |
| type | text | see catalogue |
| subject_type / subject_id | text / uuid null | intention, session, note |
| payload | jsonb | type-specific |
| occurred_at | timestamptz | |

Index `(user_id, occurred_at)`, `(user_id, type, occurred_at)`.

## Events catalogue (V1)
| type | payload |
|---|---|
| `app.opened` | `{ gap_seconds }` |
| `capacity.reported` | `{ level: 'low'|'normal'|'high', flags?: ('overwhelmed'|'scattered'|'tired'|'focused')[], note? }` |
| `intention.created` / `.updated` / `.completed` / `.dropped` / `.touched` | `{ diff? }` |
| `session.started` | `{ goal, first_step, planned_minutes }` |
| `session.check_in` | `{ response: 'ok'|'stuck'|'distracted'|'done', minute }` |
| `session.ended` | `{ outcome, actual_minutes }` |
| `memory.noted` / `.confirmed` / `.contradicted` / `.revised` / `.retired` | `{ kind, confidence, by: 'user'|'lumi'|'reflection' }` |
| `reflection.ran` | `{ trigger: 'session_end'|'new_day', ops: number }` |

## Derived (never stored)
| view | rule |
|---|---|
| `staleIntentions` | `status = open AND last_touched_at < now − 14d` |
| `todayCapacity` | latest `capacity.reported` event within the user's local day |
| `visitGap` | `now − users.last_seen_at`, bucketed for prose |
| `abandonedSession` | `focus_sessions` with `ended_at IS NULL` and `started_at < now − (planned_minutes × 2)`; closed as `abandoned` on next visit |
| `avoidedIntentions` | open, touched ≥ 3 times, never in a session — feeds reflection |
| `strategyEvidence` | per `strategy` belief: sessions whose `approach` matches, split by outcome |

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
| reason | text | `new_day | capacity | declined | asked | advanced` |
| generated_at | timestamptz | newest row for a date is the current plan |

Events added: `plan.generated {reason}`, `plan.advanced`, `intention.declined {reason}`, `intention.reopened`, `intention.updated {fields}`, `memory.*` per belief op.

## Deliberately absent
Projects table (use `memory_notes.kind='project'`; add `intentions.parent_id` if ever needed) · priority field · tags · recurrence · subtasks · streak counters · per-intention time tracking · calendar events (post-V1 integration).

## Storage
None in V1. (Voice audio never leaves the browser; file attachments are post-V1.)

## Migrations Reference

Drizzle-generated SQL in `src/db/migrations/` (`npm run db:generate` → rename the file to something readable and fix the `tag` in `meta/_journal.json` → review → `npm run db:migrate`, which reads `.env.local` via Node's `--env-file`). Every migration is listed here with its prod status; whenever a migration is created or changed, its full SQL is also printed verbatim in the session summary so it can be reviewed without switching branches.

| File | What it adds | Destructive? | Applied to prod |
|---|---|---|---|
| `0001_lists_estimates_day_plans.sql` | `intentions.list`, `intentions.estimate_minutes`; `day_plans` table (one persisted path per user per local date: `plan` jsonb, `capacity`, `reason`) + index | No (additive) | **pending** — `npm run db:migrate` from the checkout, or paste in the SQL editor then journal it |
| `0000_initial_schema.sql` | All seven tables (`users`, `conversations`, `messages`, `intentions`, `focus_sessions`, `memory_notes`, `events`), FKs (cascade on user delete; session→intention set null), indexes. `users.preferences` default `{v:1, session_minutes:45, check_in_minutes:15}` | No (create-only) | **Yes** — 2026-09-11, run by hand in the Supabase SQL editor; recorded in `drizzle.__drizzle_migrations` afterwards so `npm run db:migrate` is a no-op. Future migrations: `npm run db:migrate` only |
