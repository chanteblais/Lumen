# Open questions

*What isn't decided. Nothing here is a rule. Until Chanté decides, the code keeps doing what it does, and new work avoids locking an answer in. When a question is decided, it moves to [`decisions.md`](decisions.md) and leaves a line here saying so. Numbers are stable, so references stay valid.*

**Each entry:** the question · why it matters · meanwhile (what the product does now) · related.

---

## The spaces

**1. What does Home keep?** *(raised 2026-09-12)*
Home "asks nothing of you". Today it asks, gently: the first landing's "What are we working with today?", four quick-start chips, the re-entry offer ("Want me to help figure out what's still relevant?"), "Pick it back up, or let it go?" after an abandoned session, and the focus check-in card. None of these *needs* an answer. Are they invitations that fit Home, or do some move?
*Meanwhile:* unchanged. *Related:* decisions → Four rooms; [`features.md`](../features.md) → Home.

**2. Does focus move to the Study?** *(2026-09-12)*
The Study asks *what am I doing now?*, which is the focus session's question. Sessions, the session bar and check-ins currently live only on Home, on purpose: M5 kept them off other pages because "a second timer surface would bring back the idle-timer pressure". Is the Study where a session happens? Does starting one take you there? Do sessions still start only through Lumi?
*Meanwhile:* sessions on Home.

**3. What is the Library: where you've been, or the pile?** *(2026-09-12)*
*Where have I been?* faces backward: what got done, sessions, what Lumi noticed, what she remembers. Lists (the pile of things you mean to do) faces forward, yet the planned `lists-library.md` pairs them. Some possible shapes: the Library holds both, the shelves and the record; Lists becomes seeds waiting in the Garden; something else. **Tension:** "where have I been" must not turn into a report card (no stats, no history of misses).
*Meanwhile:* Lists is its own page. *Related:* ideas → *Remembers where you've been*; question 12.

**4. Where does Insights (the mail) belong?** *(2026-09-12)*
No room's question is "what in my mail needs me?". The Library (what arrived)? The Garden (seeds to plant)? Home, through Lumi?
*Meanwhile:* its own page.

**5. How literal is the Garden?** *(2026-09-12)*
Cultivate, plant seeds, nurture, grow. Are intentions plants? Is planting the gesture that commits to something? Who tends: the user, or Lumi (`art-direction.md` §3 proposes "nothing in it needs tending by the user")? The garden pass kept the path and did not take the mockup's plant per category or its step counts. **Tension:** a plant per task risks turning the path back into a pile, and tending into maintenance.
*Meanwhile:* the painting is behind Today; the path is unchanged (`ux/today-garden`, unmerged).

## Rewards

**6. What earns coherence, and is the balance shown as a number?** *(2026-09-12)*
- **What earns:** Chanté's notes list seven behaviours: showing up, beginning, doing, clarifying, choosing, caring, returning (ideas).
- **Gaming it:** does rewarding *doing* invite ticking things off for coins?
- **Letting go:** does it earn? It shouldn't feel like losing.
- **The number:** a balance on screen isn't a count of undone things, but it is a score to watch, and [`today.md`](../today.md) principle 9 names "scores".
- **Missing a day:** if showing up earns daily, a missed day must show nowhere.

*Meanwhile:* nothing built. EF-burden row: *open*.

**7. Where do bought things live, and what does Lumi do with them?** *(2026-09-12)*
Home, the Garden, or a *Lumi's World* (`art-direction.md` §9 Q1)? Do plants need care? Rewards only ever give, so either they need no care, or care is optional and only adds.

**8. What is the growth?** *(2026-09-12)*
The Garden is about "working towards growth". Is the growth the user's, Lumi's world, or both? How does it stay meaningful and not become a slot machine? This is the drift to watch: rewards standing in for real growth.

## Lumi and the AI

**9. When should Lumi speak first?**
Today she speaks unprompted only at check-ins (the greeting is copy, not a message). Candidates: a deadline today, something in the mail, a long absence. There are no notifications. What would any of them have to be to stay quiet?

**10. How much can Lumi do without asking?**
Today she writes through tools without confirmation. She files, completes and drops things (a whole set in one re-entry answer) and pins her pick on Today. Where is the line: deleting, rescheduling, acting on mail?

**11. How do stated and inferred priorities meet?**
The planner infers from deadlines, list order, avoidance and capacity. There is no priority field, by design. When the user says "X matters most this week", is that a belief, a pin, or something that expires?

**12. How is long-term memory shown?**
Beliefs exist, with confidence and evidence. *What Lumi knows* (M6) is planned as a page for correcting and deleting. How does a user see what Lumi remembers without it becoming something to curate? Does it belong in the Library?

## Design

**13. What survives of the book?** *(2026-09-12)*
Ivory paper, serif type, fine rules, rationed ornaments and paper plates over paintings. In a painted world, is the book the interface's language, or does it fade?
*Meanwhile:* the shipped UI is still the book; Lists, Insights and Settings are plain ivory.

**Art questions** (companion or resident, a layered "puppet" Lumi, the model sheet) are tracked in [`art-direction.md`](../art-direction.md) §6, §8 and §9, and not repeated here.
