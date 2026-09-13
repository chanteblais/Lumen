# Coherence — Domain Model (V1)

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
| parts | jsonb | AI SDK `UIMessage.parts` — text, tool-call, tool-result. Message *metadata* (`kind: declined | start_intention | break_down | session_event`, ids, reason/response) travels with the request and is acted on by the route; it is **not** persisted — the events table holds what happened, and a reloaded transcript shows the visible text only |
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
| outcome | text null | `completed | stopped_early | abandoned` (abandoned = closed by a later visit, no end signal). One session runs at a time: starting another closes the open one as `stopped_early`. Built M5 (2026-09-12), no migration — the table was in `0000` |

### `memory_notes` — beliefs with evidence
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk | |
| kind | text | `fact | project | preference | strategy | pattern | anti_pattern` — *strategy* = what helps this user start; *anti_pattern* = what reliably doesn't |
| content | text | one sentence, present tense |
| source | text | `user_said | lumi_inferred | reflection` |
| confidence | real | 0–1. `user_said` 0.9 (corrections 0.95), `lumi_inferred` 0.4–0.6, reflection sets per evidence |
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
| `app.opened` | `{ gap_seconds }` — written by `touchLastSeen` on any page open or turn that follows a gap ≥ 30 min; the newest one is the start of the current *sitting* (see Derived) |
| `capacity.reported` | `{ level: 'low'|'normal'|'high', flags?: ('overwhelmed'|'scattered'|'tired'|'focused')[], note? }` — from the chat tool or Today's prompt |
| `capacity.asked` | `{ skipped: true }` — the user tapped Skip on Today's prompt (M4); it is not asked again that local day. Rendering the prompt writes nothing |
| `intention.declined` | `{ reason }` — *Not this* on Today (M4). `reason` is one of `too_big · too_tired · unclear · not_feeling_it · something_else · nope` (`core/declines.ts`), or null when the older handoff without a reason is used |
| `intention.created` / `.updated` / `.completed` / `.reopened` / `.dropped` / `.touched` | `{ diff? }`; `.completed` and `.reopened` carry `{ via: 'app' | 'chat' }` — the circle on Today/Library vs a chat tool. The chat context's *Recent changes* (`core/domain/activity.ts`) is derived from these, joined to the intention's title and current status |
| `session.started` | `{ goal, first_step, planned_minutes, approach, intention_id }` (M5) |
| `session.check_in` | `{ response: 'ok'|'stuck'|'distracted'|'done', minute }` — `ok` from `/api/session` (Yep), the rest recorded by `/api/chat` when the `session_event` message arrives. End on the bar writes no check-in, only the `session.ended` below |
| `session.ended` | `{ outcome: 'completed'|'stopped_early'|'abandoned', actual_minutes, approach, intention_id }` — `actual_minutes` is null for `abandoned` (nobody said when it stopped) |
| `memory.noted` / `.confirmed` / `.contradicted` / `.revised` / `.retired` | `{ kind, confidence, by: 'user'|'lumi'|'reflection' }` |
| `email.scanned` | `{ through, read, suggested }` — one look through the mail (Insights open, last look ≥ 30 min ago). `through` is the watermark the next look starts from; `read` how many new messages were read, `suggested` how many leads came out. The newest one is *when Lumi last looked* |
| `lead.suggested` / `.kept` / `.dismissed` | `{ source, list }` / `{ via, intention_id }` / `{ via }` — a lead appeared, became an intention, or was let go; `via: 'app'` from Insights, `'chat'` from `keep_lead` / `dismiss_lead` |
| `reflection.ran` | `{ trigger: 'session_end'|'new_day', ops: number }` — subject is the session for `session_end` (M5; `new_day` is M6) |

## Derived (never stored)
| view | rule |
|---|---|
| `staleIntentions` | `status = open AND last_touched_at < now − 14d` |
| `todayCapacityState` | latest `capacity.reported` within the user's local day, plus whether a `capacity.asked {skipped}` exists today — Today's prompt shows only when neither does (`core/domain/capacity.ts`) |
| `declinedToday` | today's `intention.declined` events, newest first, with reasons — never Right now again today; flagged in the context block (`core/domain/intentions.ts`) |
| `visitGap` | `now − users.last_seen_at`, bucketed for prose |
| `currentSitting` | the newest `app.opened` event: when this visit began and the gap it began after (`core/domain/users.ts`). A gap ≥ 7 days makes the sitting a *re-entry*: the greeting offers the coming-back pass, the context block says so on every turn of the visit (not just the first), and letting things go re-cuts the plan |
| `recentActivity` | `intention.*` events in the last 36h, newest first (≤ 15), joined to the intention for title + current status; who did it from `payload.via`. Read only by the chat route for the context block |
| `activeSession` | the newest `focus_sessions` row with `ended_at IS NULL` that has not reached the abandonment threshold (`core/domain/sessions.ts`). Read into every snapshot and by the Chat page; the client then follows Lumi's start/end tool parts and its own Done/End taps within the page open (`core/focus.ts → sessionFromMessages`) |
| `abandonedSession` | `focus_sessions` with `ended_at IS NULL` and `started_at < now − (planned_minutes × 2)`; closed as `abandoned` by `resolveSession` on the next visit — any page or turn, since it runs inside `loadSnapshot` and on the Chat page. Offered back by the greeting while nothing has been said since it closed |
| `lastSession` | the most recently ended session if it ended in the last 36h — continuity for the context block ("pick it back up") and the abandoned greeting |
| `avoidedIntentions` | open, touched ≥ 3 times, never in a session — feeds reflection |
| `strategyEvidence` | per `strategy` belief: sessions whose `approach` matches, split by outcome |
| `mailScan` | the newest `email.scanned`: when Lumi last looked and the watermark (`core/domain/leads.ts → latestMailScan`). Fresh for 30 minutes; Insights looks again only after that |
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
| reason | text | `new_day | first_items | capacity | declined | reentry | asked | advanced` — `first_items`: the day's plan was cut with nothing to choose from and intentions have since arrived; `capacity` / `declined` / `reentry` (M4): re-cut because capacity was reported, *Not this* was answered, or the coming-back pass let things go. `asked`: re-cut because the user asked in chat for a different shape of day ("something easy", "what should I do now") via the `reshape_today` tool; the ask text rides on the `plan.generated` event, not the row |
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

Index `(user_id, status, suggested_at)`.

## Deliberately absent
Projects table (use `memory_notes.kind='project'`; add `intentions.parent_id` if ever needed) · priority field · tags · recurrence · subtasks · streak counters · per-intention time tracking · calendar events (post-V1 integration) · mail bodies or a mail cache (read at look time, sent to the model once, never stored) · OAuth tokens (Clerk holds the Google connection).

## Storage
None in V1. (Voice audio never leaves the browser; file attachments are post-V1.)

## Migrations Reference

Drizzle-generated SQL in `src/db/migrations/` (`npm run db:generate` → rename the file to something readable and fix the `tag` in `meta/_journal.json` → review → `npm run db:migrate`, which reads `.env.local` via Node's `--env-file`). Every migration is listed here with its prod status; whenever a migration is created or changed, its full SQL is also printed verbatim in the session summary so it can be reviewed without switching branches.

| File | What it adds | Destructive? | Applied to prod |
|---|---|---|---|
| `0002_leads.sql` | `leads` table (what Lumi noticed in the mail: title, why, list, due, sender/subject/received, status, `intention_id` when kept) + two indexes | No (create-only) | **Yes** — 2026-09-12, applied by Claude with `npm run db:migrate` on `feat/email-insights` (additive, per `branching.md` → Claude sessions) |
| `0001_lists_estimates_day_plans.sql` | `intentions.list`, `intentions.estimate_minutes`; `day_plans` table (one persisted path per user per local date: `plan` jsonb, `capacity`, `reason`) + index | No (additive) | **Yes** — 2026-09-13 (applied by Chanté; journaled) |
| `0000_initial_schema.sql` | All seven tables (`users`, `conversations`, `messages`, `intentions`, `focus_sessions`, `memory_notes`, `events`), FKs (cascade on user delete; session→intention set null), indexes. `users.preferences` default `{v:1, session_minutes:45, check_in_minutes:15}` | No (create-only) | **Yes** — 2026-09-11, run by hand in the Supabase SQL editor; recorded in `drizzle.__drizzle_migrations` afterwards so `npm run db:migrate` is a no-op. Future migrations: `npm run db:migrate` only |
