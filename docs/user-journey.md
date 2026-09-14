# User Journey

The loop, not a funnel. There is no onboarding beyond signing in.

```mermaid
flowchart TD
    OPEN["Open Lumi"] --> GREET["Greeting (deterministic)\nrecognition + somewhere to begin"]
    GREET -->|long gap| REENTRY["Re-entry pass\n'what's still relevant?'\n→ drop / keep, one next step"]
    GREET -->|open session| RESUME["Pick it back up\nor let it go"]
    GREET -->|first time| ASK["'What are we working with today?'\n(asked once)"]
    GREET -->|came back| CONT["Continuation\n'Where did we end up?' · 'Picking up from yesterday'"]
    ASK --> TALK["Talk / type / speak"]
    CONT --> TALK
    REENTRY --> TALK
    RESUME --> TALK

    TALK --> LUMI{"Lumi reads context\n(intentions · capacity · beliefs)\nand acts through tools"}
    LUMI --> INT["Intentions created /\ncompleted / dropped\n(ledger lines)"]
    LUMI --> CAP["Capacity noted"]
    LUMI --> STEP["One next physical step"]
    LUMI --> SESSION["Focus Together\nwhat · first step · how long"]

    SESSION --> CHECK{"Still with it?"}
    CHECK -->|Yep| SESSION
    CHECK -->|Stuck / Distracted| REENTER["Re-enter\n(not a failure)"] --> SESSION
    CHECK -->|Done| END["Session ends\none line, no stats"]

    END --> REFLECT["Reflection (background)\nbeliefs confirmed / revised"]
    INT --> REFLECT
    CAP --> REFLECT
    REFLECT --> LEAVE["Leave"]
    STEP --> LEAVE
    LEAVE -.->|later| OPEN
```

## States at a glance

| State | Where it lives | Who changes it |
|---|---|---|
| Intention open / done / dropped | `intentions.status` | Lumi via tools; user via Today |
| Focus session active / ended / abandoned | `focus_sessions` | Nothing since 2026-09-13 (focus sessions removed from the product; the table and rows are kept) |
| Today's capacity | latest `capacity.reported` event | Lumi via tool |
| Beliefs | `memory_notes` (+ confidence, evidence) | Lumi via tools; reflection; user via "What Lumi knows" |
| Visit gap | `users.last_seen_at` | every turn / page open |

## Open questions
- Where does a user *see* that an intention was captured without turning Today into a task list? (Ledger lines under the message are the M3 answer.)
- ~~When a session is abandoned, is the next-visit prompt a greeting variant (current plan) or a silent close?~~ Decided M5 (2026-09-12): the greeting variant, shown until they've said anything since the session was closed — see `decisions.md`.
