# Open questions

*What isn't decided. Nothing here is a rule. Until Chanté decides, the code keeps doing what it does, and new work avoids locking an answer in. When a question is decided, it moves to [`decisions.md`](decisions.md) and leaves a line here saying so. Numbers are stable, so references stay valid. § numbers refer to the [Product Vision](../philosophy/product-vision.md).*

**Each entry:** the question · why it matters · meanwhile (what the product does now) · related.

**Needs a decision first:** 14 (rewards and the vision). Questions 6–8 depend on it.

---

## The spaces

**1. What does Home keep?** *(2026-09-12)*
Home is "arriving, talking, reflecting, returning" (§14) and, in Chanté's words, "asks nothing of you". It currently asks, gently: the first landing's "What are we working with today?", four quick-start chips, the re-entry offer ("Want me to help figure out what's still relevant?"), "Pick it back up, or let it go?" after an abandoned session, and the focus check-in card. None of these *needs* an answer, and the re-entry offer is the vision's own example (§8). Are they invitations that fit Home, or do some move?
*Meanwhile:* unchanged. *Related:* [`features.md`](../features.md) → Home.

**2. Do focus sessions leave Home for the Study?** *(2026-09-12; partly answered by §14)*
The vision places Focus in the Study. Still open: do sessions, the session bar and check-ins move off Home? Does starting one take you to the Study? M5 kept sessions on one surface on purpose ("a second timer surface would bring back the idle-timer pressure"), and sessions start only through Lumi. Does that still hold?
*Meanwhile:* sessions run on Home.

**3. How does the Library hold *where have I been*?** *(2026-09-12; mostly answered by §14)*
The vision places Lists in the Library ("organizing and retrieving what the system is holding") and says the Library grows richer as history grows. Still open: how the record of where you've been appears (finished things, sessions, what Lumi noticed and remembers) without becoming a report card (§12: no scores, no completion shame).
*Meanwhile:* Lists is a plain page. *Related:* question 12; ideas → *Remembers where you've been*.

**4. Where does Insights (the mail) belong?** *(2026-09-12)*
The vision's places don't include it. Candidates: the Library (what arrived and is being held), the Garden (things that may need planting), or Home, through Lumi.
*Meanwhile:* its own page.

**5. What does "tending" look like in the Garden?** *(2026-09-12; partly answered by §15)*
The vision is clear that the metaphor shapes the interaction without every task becoming "a literal cartoon plant". Still open: which of a garden's stages the Garden makes visible (newly planted, needs attention today, growing without intervention, to prune, ready to harvest, resting), and how that looks without counts. Is the path (Right now → After that → Later) the *needs attention today* view? Does pruning happen here or in the Library?
*Meanwhile:* the path, with the painting behind it (`ux/today-garden`, unmerged).

**15. Which names does the user see?** *(2026-09-12)*
The vision pairs a function with a place: Today / Garden, Lists / Library, Focus / Study. In the nav, *Today* says what it's for and *Garden* says where you are. Both, one, or the place names once they are established?
*Meanwhile:* Home · Today · Lists · Insights · Settings.

## Rewards and growth

**14. ⚠ Rewards or inhabited growth?** *(2026-09-12)*
In conversation, Chanté described earning *coherence* for completing tasks and showing up, spent on plants and things for Lumi; the notes behind it list seven behaviours to credit. The vision's §14 says the places grow with "relationship, continuity, and accumulated life, not points … The user is not earning decorations for completing tasks … Growth should feel like expansion, not reward". §18 warns against an attention trap, and §20 says Coherence is not a gamified habit tracker. A currency earned for opening the app also pulls against "success is leaving". The ways forward:
- **(a) The vision stands.** No currency; the places grow on their own from what happened.
- **(b) The conversation stands.** Amend §14 on purpose, with the reason recorded.
- **(c) A reconciliation**, stated explicitly: for example, growth comes from what happened (vision) and the user chooses what to place, with no balance or earning language.

*Meanwhile:* nothing built. Both versions agree: nothing decays, no streaks, absence costs nothing.

**6. What counts, and is anything shown as a number?** *(depends on 14)*
If there is earning: which of the seven behaviours count (ideas); whether rewarding *doing* invites ticking things off; whether letting go counts (it shouldn't feel like losing); whether a balance shows as a number (§12 rules out productivity scores). If growth is inhabited instead: what the places respond to.

**7. Where do things live, and do they need care?** *(depends on 14)*
Home, the Garden, or a *Lumi's World* (`art-direction.md` §9 Q1)? Nothing can cost anything when neglected, so either nothing needs care or care only adds.

**8. Whose growth is it?** *(depends on 14)*
The user's life moving forward (§19), the places, Lumi's world, or all three? How does it stay meaningful and not become a slot machine?

## Lumi and the AI

**9. When should Lumi speak first?**
Today she speaks unprompted only at check-ins (the greeting is copy, not a message). The vision gives her room: helping the user return when distracted (§7) and naming a pattern, "You've moved this three times" (§12). Candidates: a deadline today, something in the mail, a long absence. There are no notifications. What would any of them have to be to stay quiet and not become escalating pressure (§12)?

**10. How much can Lumi do without asking?**
§4: automate administration, not agency. §5: the user holds authority over what matters, what is deferred or abandoned, and what is enough. Today Lumi files, completes and drops things without confirmation (dropping only after the user says so) and pins her pick on Today. Where is the line for rescheduling, deleting, or acting on mail?

**11. How do stated and inferred priorities meet?**
The planner infers from deadlines, list order, avoidance and capacity, and there is no priority field, by design. §5: an inferred priority is never objective truth; "You've moved this up several times. It seems important to you." When the user says "X matters most this week", is that a belief, a pin, or something that expires?

**12. How is long-term memory shown?**
§16: the product gets easier as it knows you. Beliefs exist, with confidence and evidence, and *What Lumi knows* (M6) is planned as a page for correcting. How does a user see what Lumi remembers without it becoming something to curate? Does it belong in the Library?

**16. Do *Not this* and coming back cover what the vision names?** *(2026-09-12)*
- **Not this.** §9 lists nine reasons a task might not fit and four responses: break it down, replace it, defer it, question whether it needs doing at all. The chips offer six reasons, with nothing for *poorly timed*, *boring* or *waiting on something else*. Lumi's replies break down and replace, but don't offer deferring or letting go.
- **Coming back.** §8 names five outcomes: still important, already resolved, no longer relevant, worth rescheduling, safe to abandon. The persona's pass covers *still matters* and *let go*, not *already done* or *reschedule*.

Grow the chips (more choice on the card), or keep them few and let Lumi's reply cover the rest? *Leaning:* keep the chips, widen the replies.
*Meanwhile:* unchanged.

**17. May Lumi count a pattern?** *(2026-09-12)*
The persona says "never count their things back to them", but §12's example is "You've moved this three times." A count of undone things is a bill; a count in a noticed pattern may not be. *Leaning:* allow pattern counts, keep the ban on counts of what's undone. This touches the cached persona prompt.

## Design

**13. What survives of the book?** *(2026-09-12)*
Ivory paper, serif type, fine rules, rationed ornaments and paper plates over paintings. In inhabited places, is the book the interface's language, or does it fade?
*Meanwhile:* the shipped UI is still the book; Lists, Insights and Settings are plain ivory.

**Art questions** (companion or resident, a layered "puppet" Lumi, the model sheet) are tracked in [`art-direction.md`](../art-direction.md) §6, §8 and §9, and not repeated here.
