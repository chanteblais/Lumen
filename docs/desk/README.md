# The Coherence Desk

*Chanté's one place for what needs her, and Claude's one inbox for asking her. Started 2026-09-14 at her ask: "one central place where I can review the things that need my attention, and quickly give direction", self-reflexive, and over time needing fewer micro-decisions from her. Claude owns this doc and the desk; it changes as the desk learns.*

The desk is a published page (an Artifact on claude.ai, private to Chanté) rendered from [`desk.json`](desk.json). She answers on the page; her answers wait in the page's database until a Claude session folds them into the repo, re-sweeps and republishes to the same link.

- **Link:** [Coherence Desk](https://claude.ai/artifact/CShA2H6c3CErxyrhVri7QC) (from another session, publish with this `url` to keep the link).
- **Refresh:** the `desk` skill (`.claude/skills/desk/SKILL.md`), or ask any Claude session to "refresh the desk".

---

## The rule for every session

**A question for Chanté goes on the desk, not only in a doc.** Record it where it belongs (an open question, a spatial-map README, a review log) as before, and also add it to `desk.json` as an ask, or say at session end that you did. A question left only in a doc is how she ends up drowning: it is true, but nobody brings it to her, so she has to go looking.

Before an item becomes an ask, it passes the **ask test**.

## The ask test

An item goes to Chanté only when at least one of these holds:

1. **Taste.** How Lumi or a place looks, moves, sounds or feels, where her eye is the measure.
2. **Direction.** It changes what Coherence is trying to become: the canon, a principle, V1's scope, a canon/code difference.
3. **One-way door.** It can't be cheaply undone: a destructive migration, deleting someone's work, pushing unconfirmed work, publishing something outside.
4. **Her accounts, keys, money, or other people.**

…and no standing delegation in [`delegations.md`](delegations.md) covers it.

Otherwise Claude decides, records the decision where it belongs, and lists it under *Moving without you* for one round, so she can say *Hold on* without having been asked anything.

## What an ask carries

Every ask on the desk has, or it doesn't render (`scripts/desk/render.mjs` refuses):

- **Claude's recommendation.** She should be able to say yes to something, not compose an answer from nothing.
- **What happens if she never answers.** Silence is an answer. A reversible ask goes ahead on its default after its date; a one-way door never goes ahead on silence, it just waits, quietly, in *Everything else can wait*.
- **How much of her it takes:** `glance` (a minute), `think` (ten minutes), `sit` (needs real attention or a look at something).
- Its sources, linked, so she can go deeper without having to.

## Her answers, and what each does when folded in

| On the page | What Claude does with it |
|---|---|
| **Go with that** | Acts on the recommendation; records the decision in its home doc with her answer as the rationale |
| **Something else** + a note | Acts on her direction; records it; notes in the journal where the recommendation missed and why |
| **Your call** | Claude decides this one, records it as Claude's call under her delegation |
| **Not now** | Parked with the date, no reason asked (*Not this* is information). Comes back only when something changes that makes it timely |
| **Don't bring me things like this** | The kind of decision becomes a proposed standing delegation, worded by Claude, confirmed with her once as its own ask |
| **Done** (her hands) | Claude verifies where it can (a deploy, an env var) and clears it |
| **Hold on** (moving without you) | The default stops; the item becomes an ask |
| **Bring forward** (parked) | The item becomes an ask next round, with a recommendation |
| **Tell the desk** (free note) | Direction for the desk itself or the project; folded in like *Something else* |

## The shape of the page, and where it comes from

The desk is built on Coherence's own principles, applied to the person building Coherence. It is deliberately not a dashboard of everything (Principle 4).

| On the desk | From Coherence |
|---|---|
| **Right now**: one ask, dominant, with its recommendation and one tap to agree | Today's one *Right now* card, one decision at a time (EP§2–4) |
| **I have a minute · ten minutes · a while** | Capacity changes the plan (Principle 8); a low day is smaller, not redder |
| **Not now**, no reason asked | *Not this* is information (Principle 8) |
| No counts of what's waiting; the rest folds under **Everything else can wait** | *Never a count of what's undone*; Today's closing slip |
| **Your call** and **Don't bring me things like this** teach the desk | Lumi proposes, the user corrects, Lumi learns; correction beats configuration (Principles 2–3) |
| Every ask says what happens on silence; items past their date have already moved | Design for return: coming back restores the present, it doesn't expose a backlog (Principle 7) |
| **Moving without you** shows Claude's own calls for one round | Show inference for what it is; bounded, legible autonomy (Principle 10, Q10) |
| **What Claude decides without you**, in her own words | Authority is granted and narrowed in conversation, never a global setting (2026-09-14 decision on autonomy) |

## How the desk evolves

Each refresh appends to [`journal.md`](journal.md): what went out, how she answered, what the desk learned, and what it changes about itself. The signals, and what they move:

- **Your call** or **Don't bring me things like this** in the same area, twice → Claude proposes a standing delegation for that kind of decision. Never adopted silently: the proposal is one ask.
- **Something else** → the recommendation missed; the journal names what Claude didn't know, and that knowledge goes where future sessions will find it (a canon doc, a memory).
- **Go with that** on a `glance` ask → next time a decision like it is Claude's, shown under *Moving without you* instead.
- **Not now** on the same item twice → it wasn't hers, or wasn't timely; re-ask only on a real change.
- **Hold on** → Claude's autonomy in that area was too wide; the delegation narrows and the journal says so.
- Asks that waited more than two rounds without an answer → the ask was badly framed, too big, or not hers. Reframe, split, or decide.

**The desk's own measures**, kept in the journal and never shown to her as a score: asks per round (should fall), share answered *Go with that* (recommendations she trusts), share *Your call* / *Don't bring me these* (asks that shouldn't have come), and how often *Hold on* fires (autonomy overreaching). Fewer asks, each more consequential, with *Hold on* rare, is the desk working.

The desk may change its own page, sections and wording on Claude's judgement. A change to how *she* works (new controls to learn, a cadence, a reminder) is an ask.

## Coherence ↔ the desk

The desk and the app solve the same problem from two sides: uncertainty makes starting expensive, and a system that asks its person to hold everything adds to that cost. What the desk learns about reducing Chanté's decision load is evidence for Lumi's design, and the canon is the desk's design source. Lessons live in `journal.md` → *Carried to Coherence*; one that becomes a product proposal goes to [`living/ideas.md`](../living/ideas.md) as *Exploring*: an idea, not canon, until she decides.

## Where things live

| File | What |
|---|---|
| `docs/desk/desk.json` | The current round: letter, asks, her hands, moving, parked, recent decisions, delegations, reflection |
| `docs/desk/desk.template.html` | The page; data is poured in at `/*DESK_DATA*/` |
| `scripts/desk/render.mjs` | `node scripts/desk/render.mjs` → `docs/desk/.out/desk.html` (ignored); refuses an ask with no recommendation or silence default |
| `docs/desk/delegations.md` | Standing delegations, each with her words |
| `docs/desk/journal.md` | The desk's reflexive log, newest first |
| `.claude/skills/desk/SKILL.md` | The refresh ritual |
| The artifact's db | `responses/<item id>` (one per answer; `processed: true` once folded in) and `notes/<id>` (free notes) |

**Artifact:** https://claude.ai/artifact/CShA2H6c3CErxyrhVri7QC — first published 2026-09-14 (round 1), capabilities `db`.
