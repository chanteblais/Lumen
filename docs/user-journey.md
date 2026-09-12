# User Journey

The loop, not a funnel. There is no onboarding beyond signing in.

```mermaid
flowchart TD
    OPEN["Open Rali"] --> GREET["Greeting (deterministic)\nrecognition + somewhere to begin"]
    GREET -->|long gap| REENTRY["Re-entry pass\n'what's still relevant?'\n→ drop / keep, one next step"]
    GREET -->|open session| RESUME["Pick it back up\nor let it go"]
    GREET --> TALK["Talk / type / speak"]
    REENTRY --> TALK
    RESUME --> TALK

    TALK --> RALI{"Rali reads context\n(intentions · capacity · beliefs)\nand acts through tools"}
    RALI --> INT["Intentions created /\ncompleted / dropped\n(ledger lines)"]
    RALI --> CAP["Capacity noted"]
    RALI --> STEP["One next physical step"]
    RALI --> SESSION["Focus Together\nwhat · first step · how long"]

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
| Intention open / done / dropped | `intentions.status` | Rali via tools; user via Today |
| Focus session active / ended / abandoned | `focus_sessions` | Rali via tools; client timer; next-visit sweep |
| Today's capacity | latest `capacity.reported` event | Rali via tool |
| Beliefs | `memory_notes` (+ confidence, evidence) | Rali via tools; reflection; user via "What Rali knows" |
| Visit gap | `users.last_seen_at` | every turn / page open |

## Open questions
- Where does a user *see* that an intention was captured without turning Today into a task list? (Ledger lines under the message are the M3 answer.)
- When a session is abandoned, is the next-visit prompt a greeting variant (current plan) or a silent close?
