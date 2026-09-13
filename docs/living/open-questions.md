# Open questions

*What isn't decided. Nothing here is a rule. Until Chanté decides, the code keeps doing what it does, and new work avoids locking an answer in. When a question is decided, it moves to [`decisions.md`](decisions.md) and leaves a line here saying so. Numbers are stable, so references stay valid. **V§** is the [Product Vision](../philosophy/product-vision.md); **EP§** is the [Experience Principles](../philosophy/experience-principles.md).*

**Each entry:** the question · why it matters · meanwhile (what the product does now) · related.

**Needs a decision first:** 14 (rewards and the foundation documents). Questions 6–8 depend on it.

---

## The spaces

**1. What does Home keep?** *(2026-09-12)*
Home is "arrive and inhabit" (EP§15) and, in Chanté's words, "asks nothing of you". It currently asks, gently: the first landing's "What are we working with today?", four quick-start chips, the re-entry offer, "Pick it back up, or let it go?" after an abandoned session, and the focus check-in card. The re-entry offer is the vision's own example (V§8). The four chips are the one to look at against EP§3 ("menus masquerading as assistance") and the one-second test (EP§21).
*Meanwhile:* unchanged. *Related:* [`features.md`](../features.md) → Home; the EF-burden log accepted the chips on condition they "never grow beyond four".

**2. Do focus sessions leave Home for the Study?** *(2026-09-12; partly answered by V§14)*
The vision places Focus in the Study. EP§11 describes Lumi there: breathing, reading, sitting nearby, occasionally looking up. EP§18 has a task Today surfaces "move naturally into Focus". Still open: do sessions, the session bar and check-ins move off Home? Does starting one take you to the Study? M5 kept sessions on one surface on purpose ("a second timer surface would bring back the idle-timer pressure"), and they start only through Lumi.
*Meanwhile:* sessions run on Home. *Related:* question 18.

**3. How does the Library hold *where have I been*?** *(2026-09-12; mostly answered by V§14, EP§14)*
Lists lives in the Library ("organize and retrieve"), which "may expand because the user's life has accumulated more threads, knowledge, and history" (EP§14). Still open: how that record appears (finished things, sessions, what Lumi noticed and remembers) without becoming a report card, or visual richness becoming "a judgment of how productive the user has been" (EP§14).
*Meanwhile:* Lists is a plain page. *Related:* questions 12 and 20.

**4. Where does Insights (the mail) belong?** *(2026-09-12)*
Neither foundation document places it. Candidates: the Library (what arrived and is being held), the Garden (something that may need planting), or Home, through Lumi. It is already an inbox that needs no processing, so EP§1's worry doesn't apply.
*Meanwhile:* its own page.

**5. What does tending look like in the Garden?** *(2026-09-12; partly answered by V§15, EP§15)*
The concepts are named (planting an intention, tending active work, letting something rest, pruning what's no longer relevant), with the warning that users shouldn't have to "decipher an elaborate gardening simulation". Still open: which of these becomes a visible gesture, and where. Does *letting something rest* equal moving it to Later (EP§16)? Does pruning happen in the Garden or the Library? Is the path (Right now → After that → Later) the *tending active work* view?
*Meanwhile:* the path, with the painting behind it (`ux/today-garden`, unmerged).

**15. Which names does the user see?** *(2026-09-12)*
The foundation pairs a function with a place: Today / Garden, Lists / Library, Focus / Study. EP§18 and §21 use the function names. In the nav, *Today* says what it's for and *Garden* says where you are. Both, one, or the place names once they are established? EP§19 warns against making users adopt Coherence's vocabulary.
*Meanwhile:* Home · Today · Lists · Insights · Settings.

## Rewards and growth

**14. ⚠ Rewards or inhabited growth?** *(2026-09-12)*
In conversation, Chanté described earning *coherence* for completing tasks and showing up, spent on plants and things for Lumi; the notes behind it list seven behaviours to credit. Both foundation documents contradict it:
- **V§14:** "not points … The user is not earning decorations for completing tasks … Growth should feel like expansion, not reward."
- **EP§14:** "Growth reflects history, not achievement", with "points, currencies, unlock requirements, productivity XP, completion-based decoration" to watch for, and "Complete five tasks to unlock a rose bush" as the anti-example.
- **EP§20:** watch for "rewards intended to bring users back without functional reason".

The ways forward:
- **(a) The foundation stands.** No currency; the places grow on their own from continuity and history.
- **(b) The conversation stands.** V§14 and EP§14 are amended on purpose, with the reason recorded.
- **(c) A reconciliation**, stated explicitly: for example, recognising beginning, choosing and returning in Lumi's words and in how the places grow, with no balance, no shop and no unlocks.

*Meanwhile:* nothing built. Both versions agree: nothing decays, no streaks, absence costs nothing.

**6. What counts, and is anything shown as a number?** *(depends on 14)*
If there is earning: which of the seven behaviours count (ideas); whether rewarding *doing* invites ticking things off; whether letting go counts; whether a balance shows as a number (V§12 rules out productivity scores). If growth is history: what the places respond to, and how "an established Garden" never reads as a verdict on a hard month (EP§14).

**7. Where do things live, and do they need care?** *(depends on 14)*
Home, the Garden, or a *Lumi's World* (`art-direction.md` §9 Q1)? Nothing can cost anything when neglected, so either nothing needs care or care only adds.

**8. Whose growth is it?** *(depends on 14)*
The user's life moving forward (V§19), the places, Lumi's world, or all three?

## Lumi and the AI

**9. When should Lumi speak first?**
Today she speaks unprompted only at check-ins (the greeting is copy, not a message). The foundation gives her room to help the user return when distracted (V§7) and to name a pattern (V§12), and rules out notifications meant to raise engagement (EP§11, §20). Candidates: a deadline today, something in the mail, a long absence. There are no notifications. What would any of them have to be to stay useful and not become engagement?

**10. How much can Lumi do without asking?**
Automate administration, not agency (V§4). The user holds authority over what matters, what is deferred or abandoned, and what is enough (V§5). Today Lumi files, completes and drops things without confirmation (dropping only after the user says so) and pins her pick on Today. Where is the line for rescheduling, deleting, or acting on mail? EP§17 suggests the line follows the consequences.

**11. How do stated and inferred priorities meet?**
The planner infers from deadlines, list order, avoidance and capacity, and there is no priority field, by design. V§5: an inferred priority is never objective truth. EP§5 warns against "treating deadlines as equivalent to importance". EP§16 makes a vertical drag in Lists a statement of relative priority. When the user says "X matters most this week", or drags it up, is that a belief, a position, or something that expires?

**12. How is long-term memory shown?**
The product should get easier as it knows you (V§16), and advanced users "can inspect or directly manipulate more structure" (EP§19). Beliefs exist, with confidence and evidence, and *What Lumi knows* (M6) is planned as a page for correcting. How does a user see what Lumi remembers without it becoming something to curate? Does it belong in the Library?

**16. Do *Not this* and coming back cover what the foundation names?** *(2026-09-12; partly answered by EP§7)*
EP§7 frames the chips as "possible lightweight responses", and its five match the current six minus *Don't feel like it*. So a short set is the intended shape, not a chip per reason. Still open:
- **Lumi's replies.** They break down and replace, but don't offer to defer or ask whether it needs doing at all (V§9).
- **Coming back.** The pass covers *still matters* and *let go*, not *already done* or *reschedule* (V§8).
- **Keep *Don't feel like it*?**

*Leaning:* keep the chips few, widen the replies.
*Meanwhile:* unchanged.

**17. May Lumi count a pattern?** *(2026-09-12)*
The persona says "never count their things back to them", but V§12's example is "You've moved this three times." A count of undone things is a bill; a count in a noticed pattern may not be. *Leaning:* allow pattern counts, keep the ban on counts of what's undone. This touches the cached persona prompt.

**18. Should check-ins run on a timer?** *(2026-09-12)*
EP§11: "Lumi intervenes when useful, not because an engagement timer says it is time to speak", and watch for "excessive check-ins". The focus check-in card appears every 15 minutes by default (`check_in_minutes`) and at the planned end. It is the interface asking, not Lumi. The user agreed to it when the session started, and *Yep* costs one tap with no reply (EF-burden log: accepted). It is still timer-driven. Keep it, lengthen it, make it the default only for some people (learned), or have the interface stay silent unless the session runs long?
*Meanwhile:* 15 minutes. *Related:* question 2.

**19. How does inference show itself?** *(2026-09-12; from EP§17)*
Lumi guesses each thing's list and estimate when she files it, and on Today and in Lists the guess looks exactly like something the user said. Beliefs already carry `user_said` or `lumi_inferred`; intentions don't. EP§17 asks for uncertainty in proportion to importance, with no warning labels on harmless guesses. Which guesses matter enough to show (a due date Lumi inferred? an estimate that shapes a low day?), and how quietly?
*Meanwhile:* nothing distinguishes them.

**20. How does direct manipulation reach Lumi?** *(2026-09-12; from EP§5–6, EP§16)*
The foundation wants correction by hand: reorder, recategorise, defer and abandon easily; drag vertically for priority and horizontally for list; *Later* means stop foregrounding it; perhaps drop a thing onto Lumi to start together. Today, Lists offers only the tick; moving, deferring and dropping go through conversation; and nothing in the planner treats *Later* as "don't foreground". Implementation should follow (decisions → *Direct manipulation*). The design choices are still open:
- What a vertical position means across two columns.
- Whether After that on Today can be reordered.
- How a drag becomes an event, and a belief, that Lumi sees (EP§18).
- How a user drags on a phone.

*Meanwhile:* the tick only; the rest through Lumi.

## Design

**13. What survives of the book?** *(2026-09-12)*
Ivory paper, serif type, fine rules, rationed ornaments and paper plates over paintings. In inhabited places, is the book the interface's language, or does it fade? EP§12 (empty space does work) holds either way.
*Meanwhile:* the shipped UI is still the book; Lists, Insights and Settings are plain ivory.

**Art questions** (companion or resident, a layered "puppet" Lumi, the model sheet) are tracked in [`art-direction.md`](../art-direction.md) §6, §8 and §9, and not repeated here.
