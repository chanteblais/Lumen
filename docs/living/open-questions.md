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
The vision places Focus in the Study. EP§11 describes Lumi there: breathing, reading, sitting nearby, occasionally looking up. EP§18 has a task Today surfaces "move naturally into Focus". Still open: do sessions, the session bar and check-ins move off Home? Does starting one take you to the Study? M5 kept sessions on one surface on purpose ("a second timer surface would bring back the idle-timer pressure"), and they start only through Lumi. *2026-09-13:* [`spaces.md`](../product/spaces.md) §16–18 describes the Study as the current intention, a first action, an optional timer, minimal controls and Lumi, with most of Coherence receding and leaving never marked as failure. It asks *What are we doing now?*; the decided question is *What am I doing now?*.
*Meanwhile:* sessions run on Home. *Related:* question 18.

**3. How does the Library hold *where have I been*?** *(2026-09-12; mostly answered by V§14, EP§14)*
Lists lives in the Library ("organize and retrieve"), which "may expand because the user's life has accumulated more threads, knowledge, and history" (EP§14). Still open: how that record appears (finished things, sessions, what Lumi noticed and remembers) without becoming a report card, or visual richness becoming "a judgment of how productive the user has been" (EP§14). *2026-09-13:* [`spaces.md`](../product/spaces.md) §11–15 has the Library holding accumulated threads. Sections grow from what exists in the user's life, never unlocked (§13); things stay manipulable (§14); it stays navigable through Lumi's retrieval, never a taxonomy to maintain (§15). It asks *What am I holding, and where does it belong?*, with *Where did this thread begin?* and *What became of that idea?* as what it answers later (§12). The decided question is *Where have I been?* Which one the Library answers, or both, is Chanté's call.
*Meanwhile:* the Library (renamed from Lists, 2026-09-13) is only its painted room; no page shows the lists ([decision](decisions.md)). The painting's boards are blank (repainted 2026-09-13; the version with words is `art/mockups/library-background.png`), and Chanté's spatial IA (`art/scenery/library/library-spatial-information-architecture.md`) makes them fixed architectural collection slots whose names emerge from each user's life — who names a slot, and when, is part of this question. *Related:* questions 12 and 20.

**4. Where does Insights (the mail) belong?** *(2026-09-12)*
Neither foundation document places it. Candidates: the Library (what arrived and is being held), the Garden (something that may need planting), or Home, through Lumi. It is already an inbox that needs no processing, so EP§1's worry doesn't apply.
*Meanwhile:* its own page.

**5. What does tending look like in the Garden?** *(2026-09-12; partly answered by V§15, EP§15)*
The concepts are named (planting an intention, tending active work, letting something rest, pruning what's no longer relevant), with the warning that users shouldn't have to "decipher an elaborate gardening simulation". Still open: which of these becomes a visible gesture, and where. Does *letting something rest* equal moving it to Later (EP§16)? Does pruning happen in the Garden or the Library? Is the path (Right now → After that → Later) the *tending active work* view? *2026-09-13:* [`spaces.md`](../product/spaces.md) §8 adds *Harvest* (bring something to completion) and says the words appear in the UI only when natural and immediately understandable; the metaphor stays partly implicit.
*Meanwhile:* the path on one paper panel over the painted greenhouse, with Lumi standing in it on wide screens.

**15. Which names does the user see?** *(2026-09-12)*
The foundation pairs a function with a place: Today / Garden, Lists / Library, Focus / Study. EP§18 and §21 use the function names. In the nav, *Today* says what it's for and *Garden* says where you are. Both, one, or the place names once they are established? EP§19 warns against making users adopt Coherence's vocabulary. *2026-09-13, mostly answered by [`spaces.md`](../product/spaces.md) §3:* primary navigation stays plain (*Home · Today · Lists · Focus*), Garden, Library and Study are the internal names, and the labels evolve through testing ("Poetry should deepen clarity, not replace it"). Still open: Insights and Settings, which §3 leaves out, and a *Focus* item before there is a Study (question 2). Since then the nav says *Library*, a place name, where §3 has *Lists*: Chanté chose it on review, so the Library departs from §3 on purpose and *Today* keeps the function name.
*Meanwhile:* Home · Today · Library · Insights · Settings — *Library* is the first place name in the nav (Chanté, 2026-09-13); *Today* stays.

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

*2026-09-13:* [`spaces.md`](../product/spaces.md) §8, §13 and §25–27, Chanté's most recent writing on this, describes (a) in detail. No XP, levels, task-completion currencies, unlocking through productivity or completion-driven decoration. Changes are "discovered rather than awarded" and reflect duration, context, exploration and relationship, not output. It isn't a decision until Chanté says so.

*Meanwhile:* nothing built. Both versions agree: nothing decays, no streaks, absence costs nothing.

**6. What counts, and is anything shown as a number?** *(depends on 14)*
If there is earning: which of the seven behaviours count (ideas); whether rewarding *doing* invites ticking things off; whether letting go counts; whether a balance shows as a number (V§12 rules out productivity scores). If growth is history: what the places respond to, and how "an established Garden" never reads as a verdict on a hard month (EP§14).

**7. Where do things live, and do they need care?** *(depends on 14)*
Home, the Garden, or a *Lumi's World* (`art-direction.md` §9 Q1)? Nothing can cost anything when neglected, so either nothing needs care or care only adds. *2026-09-13:* [`spaces.md`](../product/spaces.md) §6 and §26: nothing to decorate, purchase, unlock or maintain; the Garden doesn't die and the Library doesn't gather dust. For the places, *do they need care* is answered (no), whatever 14 decides.

**8. Whose growth is it?** *(depends on 14)*
The user's life moving forward (V§19), the places, Lumi's world, or all three?

## Lumi and the AI

**9. When should Lumi speak first?**
Today she speaks unprompted only at check-ins (the greeting is copy, not a message). The foundation gives her room to help the user return when distracted (V§7) and to name a pattern (V§12), and rules out notifications meant to raise engagement (EP§11, §20). Candidates: a deadline today, something in the mail, a long absence. There are no notifications. What would any of them have to be to stay useful and not become engagement?

**10. How much can Lumi do without asking?**
Automate administration, not agency (V§4). The user holds authority over what matters, what is deferred or abandoned, and what is enough (V§5). Today Lumi files, completes and drops things without confirmation (dropping only after the user says so) and pins her pick on Today. Where is the line for rescheduling, deleting, or acting on mail? EP§17 suggests the line follows the consequences. *2026-09-13, the principle answered by [AI & IA](../product/ai-and-information-architecture.md) §33–35:* confirmation is proportional to uncertainty, consequence and reversibility. Interpretation, tentative inference, a proposed change and a committed change are different things, and mistakes should be cheap to undo. Still open: where the line falls for rescheduling, deleting and mail, and what a *proposed* change looks like when only tools write state.

**11. How do stated and inferred priorities meet?**
The planner infers from deadlines, list order, avoidance and capacity, and there is no priority field, by design. V§5: an inferred priority is never objective truth. EP§5 warns against "treating deadlines as equivalent to importance". EP§16 makes a vertical drag in Lists a statement of relative priority. When the user says "X matters most this week", or drags it up, is that a belief, a position, or something that expires? *2026-09-13, mostly answered by [AI & IA](../product/ai-and-information-architecture.md) §14–16:* importance, urgency, priority and attention relevance are different things. Priority is reasoned in context, never stored as a universal truth, and a manual move is kept as its own signal beside urgency, so Lumi can name both ("I know you've got the paper above this, but…"). Still open: how a stated priority stops being current (§53: superseded, not deleted).

**12. How is long-term memory shown?**
The product should get easier as it knows you (V§16), and advanced users "can inspect or directly manipulate more structure" (EP§19). Beliefs exist, with confidence and evidence, and *What Lumi knows* (M6) is planned as a page for correcting. How does a user see what Lumi remembers without it becoming something to curate? Does it belong in the Library? *2026-09-13, partly answered by [AI & IA](../product/ai-and-information-architecture.md) §36 and §51:* mostly through conversation, with no enormous memory interface. *Why do you think mornings work better for me?* gets a reason and a hedge; *Stop treating that as something I'm working toward* archives it. Still open: whether a page exists at all.

**16. Do *Not this* and coming back cover what the foundation names?** *(2026-09-12; partly answered by EP§7)*
EP§7 frames the chips as "possible lightweight responses", and its five match the current six minus *Don't feel like it*. So a short set is the intended shape, not a chip per reason. Still open:
- **Lumi's replies.** They break down and replace, but don't offer to defer or ask whether it needs doing at all (V§9).
- **Coming back.** The pass covers *still matters* and *let go*, not *already done* or *reschedule* (V§8).
- **Keep *Don't feel like it*?**

*Leaning:* keep the chips few, widen the replies.
*Meanwhile:* unchanged.

**17. May Lumi name a number: a pattern, or a gap?** *(2026-09-12; widened 2026-09-13)*
The persona says "never count their things back to them" and, when someone comes back, "never … say how long it's been". The canon's own examples do both: "You've moved this three times" (V§12) and "You disappeared for four days. We don't need to reconstruct the four days." ([model strategy](../product/lumi-model-strategy.md)). A count of undone things is a bill. A number that names a pattern, or names a gap only in order to set it down, may not be. *Leaning:* allow both, when the number serves the next sentence; keep the ban on counts of what's undone. This touches the cached persona prompt.

**18. Should check-ins run on a timer?** *(2026-09-12)*
EP§11: "Lumi intervenes when useful, not because an engagement timer says it is time to speak", and watch for "excessive check-ins". The focus check-in card appears every 15 minutes by default (`check_in_minutes`) and at the planned end. It is the interface asking, not Lumi. The user agreed to it when the session started, and *Yep* costs one tap with no reply (EF-burden log: accepted). It is still timer-driven. Keep it, lengthen it, make it the default only for some people (learned), or have the interface stay silent unless the session runs long?
*Meanwhile:* 15 minutes. *Related:* question 2.

**19. How does inference show itself?** *(2026-09-12; from EP§17)*
Lumi guesses each thing's list and estimate when she files it, and on Today and in Lists the guess looks exactly like something the user said. Beliefs already carry `user_said` or `lumi_inferred`; intentions don't. EP§17 asks for uncertainty in proportion to importance, with no warning labels on harmless guesses. Which guesses matter enough to show (a due date Lumi inferred? an estimate that shapes a low day?), and how quietly? *2026-09-13, the storage half answered by [AI & IA](../product/ai-and-information-architecture.md) §10–11:* keep explicit, observed, inferred and derived information apart. For consequential facts like a deadline or a category, keep source, confidence and whether the user confirmed it, and don't show provenance constantly. Intentions today keep only `source_message_id`.
*Meanwhile:* nothing distinguishes them.

**20. How does direct manipulation reach Lumi?** *(2026-09-12; from EP§5–6, EP§16)*
The foundation wants correction by hand: reorder, recategorise, defer and abandon easily; drag vertically for priority and horizontally for list; *Later* means stop foregrounding it; perhaps drop a thing onto Lumi to start together. Today, Lists offers only the tick; moving, deferring and dropping go through conversation; and nothing in the planner treats *Later* as "don't foreground". Implementation should follow (decisions → *Direct manipulation*). The design choices are still open:
- What a vertical position means across two columns.
- Whether After that on Today can be reordered.
- How a drag becomes an event, and a belief, that Lumi sees (EP§18).
- How a user drags on a phone.

*Meanwhile:* the tick only; the rest through Lumi.

**21. Which model is Lumi, and how do we decide?** *(2026-09-13; decisions → *chosen separately*)*
OpenAI models are to be prototyped alongside the current Anthropic implementation, judged on Lumi's requirements ([model strategy](../product/lumi-model-strategy.md); [`lumi.md`](../philosophy/lumi.md) §17). Open:
- **Method.** The same scenarios, the same context block and the same persona intent for every model. Transcripts graded **blind** by Chanté, without knowing which model wrote them. Claude builds the harness but shouldn't be the judge of a comparison with Claude in it.
- **Scenarios.** The nine existing ones, plus what the strategy adds: a pattern across days, a four-day gap, reflection that should stay reflective, a spiral that shouldn't, a framing worth challenging, a context-rich turn where reciting is the failure. Some need structured context that doesn't exist yet (question 22).
- **Beyond voice.** Tools are the only write path, so a candidate must call them reliably and never invent ids. The persona's byte-stable prefix is a caching convention, and each provider caches differently. Latency and cost matter too.
- **Scope.** Does "Lumi's model" cover only the conversation, or also the planner, lead-finding and reflection calls, which are Lumi's judgement in structured form?
- **Privacy.** A second provider would receive conversations, beliefs and mail gists. Its retention terms, and a privacy note that names whoever runs Lumi (`pre-prod.md` now names OpenAI).

*Meanwhile:* `gpt-6-astra` behind `src/core/ai/model.ts` since 2026-09-13 (Chanté's switch), for all four calls; `LUMI_MODEL=anthropic:claude-opus-5` runs the Anthropic implementation for a comparison, and `scripts/voice-eval.mjs` follows it. OpenAI is now the provider receiving conversations, beliefs and mail gists (`store: false`); the privacy note in `pre-prod.md` names it.

**22. What structured context does Lumi need that Coherence doesn't hold?** *(2026-09-13)*
The model strategy lists what Coherence should remember: tasks, lists, priorities, projects, Library threads, decisions, patterns, preferences, capacity, commitments, history, re-entry state, Garden state, and the relationships between them. Held today: intentions, lists, capacity, sessions, day plans, beliefs (projects and patterns live here, flat on purpose, sticky decision 15), leads, and events. Missing or thin:
- **Library threads.**
- **Garden state.**
- **Relationships between things.**
- **A clear record of *moving something forward without choosing it*.** Due-date changes sit inside `intention.updated` diffs; there is no deferral event, and nothing derived reads them.
- **Retrieval once the context caps bite.**

Which of these become structure, and which become derived views over events?

*2026-09-13:* [AI & IA](../product/ai-and-information-architecture.md) names the shapes: threads, intentions, actions and commitments (§3); states beyond open and done, such as waiting, resting, blocked and archived (§7); relationships (§40–41); and genealogy (§54). It also sets the pace: the smallest model that keeps the distinctions the experience needs (§56), and a V1 of simple threads or categories, manual ordering, basic status, events, and provenance for important AI-created state (§58). Today an intention is both Intention and Action (its `next_action`), and projects are beliefs on purpose (sticky decision 15).
*Related:* question 3 (the Library), question 11 (priorities), question 24 (context assembly), `lumi.md` §6.

**24. What does context assembly need beyond one block?** *(2026-09-13; from [AI & IA](../product/ai-and-information-architecture.md) §22–23, §25–26, §30, §49, §52–53)*
The canon wants context chosen for the moment: by space, compressed further in the Study, fading with time, inspectable, and reconciled when memory and state disagree. Today:
- **No space context.** The block is the same at Home and when the user taps Lumi on Today or in the Library; a message from the bubble doesn't say where it came from.
- **No Study compression.** During a focus session the block still carries every open intention.
- **Only intentions fade.** Stale after 14 days untouched is derived. A belief weakens only when contradicted, or is retired by the user, and never with time.
- **Not observable.** `context.test.ts` tests assembly, but nothing records what a given turn included or left out.
- **Memory and state can diverge.** A `project` belief can outlive the intention it was about being dropped; nothing links them (§52–53).

*Meanwhile:* one capped block for every page and every turn. *Related:* questions 12 and 22, `lumi.md` §6.

**25. What should Coherence not keep?** *(2026-09-13; from [AI & IA](../product/ai-and-information-architecture.md) §50–51)*
"Lumi should know enough to be genuinely useful without collecting information merely because it might someday be useful." Today, mail bodies are never stored (a lead keeps sender, subject and Lumi's line). The conversation, beliefs (retired softly) and events are kept indefinitely. Export and delete exist only as a cascade on the user row, and beyond `forget_belief` there is no way to ask for either. Every inference Lumi writes is durable, and everything goes to one model provider. Open: what gets a lifetime, which inferences should stay ephemeral, what could stay on the device, and how a deletion reaches events and beliefs.
*Meanwhile:* [`architecture.md`](../architecture.md) → Privacy posture. *Related:* question 21 (a second provider), [`pre-prod.md`](../pre-prod.md).

**23. How much reflection, and when back to action?** *(2026-09-13)*
The strategy wants Lumi to "move fluidly between practical and reflective conversation" and to tell useful reflection from rumination. The persona leans hard toward action: "A single concrete next step beats any amount of advice. When in doubt, say less." The action bias serves initiation (V§6). The risk is a Lumi who can't sit with a real question about direction or meaning (V§19). When does she stay in reflection, how does she notice it has become circling, and is reflective conversation something Home offers on purpose (EP§15: arriving, talking, *reflecting*)?
*Meanwhile:* action-weighted. *Related:* `lumi.md` §5, §14.

## Design

**13. What survives of the book?** *(2026-09-12)*
Ivory paper, serif type, fine rules, rationed ornaments and paper plates over paintings. In inhabited places, is the book the interface's language, or does it fade? EP§12 (empty space does work) holds either way.
*Meanwhile:* the shipped UI is still the book; Insights and Settings are plain ivory, and the Library is its painting with nothing on it.

**Art questions** (companion or resident, a layered "puppet" Lumi, the model sheet) are tracked in [`art-direction.md`](../art-direction.md) §6, §8 and §9, and not repeated here.
