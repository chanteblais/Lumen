# Spaces of Coherence

*v0.1 — DRAFT · 2026-09-13 · Chanté's text. The emerging spatial architecture: a direction, not a spec. Nothing in the product changes because this doc exists; each space's page follows it as that page is built or reshaped. Where the product stands today, and where this doc pulls against the others, is in §30 — read it before building from any section.*

**Who this is for:** Chanté and Claude, whenever work adds or moves a page, a nav item, a painted place, or a feature whose home isn't obvious. Before placing a feature, read §4.

**Where it sits:** `design-philosophy.md` is what the *interface* is; `art-direction.md` is what the *art* is (the character, the painted world, motion); this doc is what the *places* are — which cognitive mode each space holds and how context travels between them. `today.md` is the Garden's page spec; `features.md` is what ships.

**Note:** the text as received stops partway through §29. Everything before that point is here. The rest is still to come.

---

## Purpose

This document defines the emerging spatial architecture of Coherence.

Coherence is not conceived primarily as a collection of productivity features. Instead, its major functions are organized into **spaces**, each representing a different relationship between the user, their attention, and the things they are carrying.

The current core spaces are:

- **Home** — arrive, inhabit, converse
- **Today / Garden** — tend
- **Lists / Library** — organize, retrieve, orient
- **Focus / Study** — attend

These spaces correspond to familiar navigation concepts — chat, daily planning, lists, and focus — but the environmental model gives them a deeper experiential purpose.

The environments are not merely visual themes applied to conventional screens. **Each space should embody the cognitive activity that happens there.**

## 1. Why Coherence has spaces

Most productivity software is organized around functions. The user navigates between:

```
Dashboard · Tasks · Calendar · Projects · Analytics · Focus
```

This architecture is efficient, but it tends to frame productivity as operating machinery.

Coherence is interested in a different experience. A user may enter the product in very different states:

- uncertain
- overwhelmed
- ready to work
- reflective
- scattered
- curious
- returning after an absence
- trying to remember something
- trying to decide what matters
- already knowing exactly what needs doing

These states require different relationships to information and attention. The spaces of Coherence provide contexts for those relationships.

The user does not merely select a feature. They move somewhere appropriate to what they are trying to do.

## 2. Coherence has a geography

The current conceptual geography is:

| Space | Cognitive mode | Relationship | The question it asks |
|---|---|---|---|
| **Home** | arriving, reflecting, talking, orienting | inhabiting | *— the user can arrive here before knowing what they need* |
| **Today / Garden** | prioritizing, choosing, tending, adapting to capacity | cultivation | *What deserves attention today?* |
| **Lists / Library** | organizing, retrieving, surveying, rearranging | stewardship of accumulated context | *What am I holding, and where does it belong?* |
| **Focus / Study** | sustained attention, initiation, body doubling | attending | *What are we doing now?* |

These are not four independent tools. They are four ways of interacting with the same underlying life context.

Lumi moves between them with the user.

## 3. Navigation should remain understandable

The metaphorical architecture should deepen the experience without obscuring basic usability.

The user should not need to learn that *"The Conservatory"* means daily planning.

For this reason, primary navigation can remain straightforward:

```
Home · Today · Lists · Focus
```

while the environmental identity of each space becomes apparent through the experience itself.

Internally and in design documentation, we may refer to:

```
Home · Garden · Library · Study
```

The precise user-facing labels can evolve through testing.

> **Poetry should deepen clarity, not replace it.**

## 4. Spaces represent cognitive modes, not feature ownership

A feature should not automatically receive a new space.

The question is not *"Where do we put this feature?"* The better question is:

> **What cognitive mode does this interaction belong to?**

For example, a task may appear in several spaces:

- In the **Library**, the user may inspect and reorganize it.
- In the **Garden**, it may be surfaced because it deserves attention today.
- In the **Study**, it becomes the object of focused work.
- At **Home**, the user may simply talk to Lumi about why they have been avoiding it.

It is the same underlying object. What changes is the relationship to it.

This distinction should help prevent the product from fragmenting into modules.

## 5. Home — arriving and inhabiting

Home is the primary soft landing of Coherence. It should feel:

- safe
- familiar
- contemplative
- quiet
- nostalgic
- inhabited
- low-demand

**Home is not a dashboard.** It should not confront the user with everything requiring attention. Its fundamental message is:

> *You can arrive here before you know what you're doing.*

Lumi is present. The user can:

- talk
- think aloud
- brain dump
- ask what matters today
- return after an absence
- reflect
- complain
- explore an idea
- ask for help
- begin without a structured request

Home is where the relationship with Lumi is most conversational.

It is also where the distinction between **thought** and **task** matters. Not everything said at Home should be converted into productivity structure. Sometimes the user is simply thinking.

## 6. Home should become familiar

The word "Home" should eventually feel meaningful. The user returns to the same place. Lumi inhabits it.

There may be subtle continuity across time. The environment might slowly acquire traces of the user's history or preferences.

But Home should not become a customizable virtual room requiring maintenance. The user should not have to:

- decorate it
- purchase furniture
- organize objects
- unlock items
- maintain the environment

Its familiarity should emerge without creating another system to manage. The ideal feeling is:

> *I've been here before.*

Not:

> ~~*I need to configure my Home screen.*~~

## 7. Today — the Garden

Today is represented conceptually as a Garden.

This metaphor emerged from a fundamental shift in how Coherence understands productivity. Traditional task systems ask:

> *What remains incomplete?*

The Garden asks:

> **What needs tending today?**

A garden naturally contains things in different states. Some things are:

- newly planted
- actively growing
- waiting
- needing attention
- resting
- ready to finish
- no longer worth tending

Most importantly:

> **A gardener does not tend every plant every day.**

This makes the Garden particularly appropriate for capacity-aware daily planning.

## 8. The Garden is not a task garden

The Garden metaphor should not be literalized into a gamified task system. Avoid simplistic mappings such as:

- ~~Every task is a flower.~~
- ~~Completing a task makes the flower bloom.~~
- ~~Complete five tasks to unlock a tree.~~

That would turn the metaphor into a reward mechanic.

Instead, gardening should influence the **relationship and vocabulary** of the space. Possible concepts include:

| Word | Meaning |
|---|---|
| **Plant** | begin an intention |
| **Tend** | continue something already underway |
| **Let rest** | intentionally leave something alone |
| **Prune** | remove something that no longer matters |
| **Harvest** | bring something to completion |

These terms should only appear in the user interface when they feel natural and immediately understandable.

The metaphor should remain partly implicit.

## 9. A well-tended Garden represents continuity

The Garden may visually develop over time.

A new user might begin with something modest:

- open soil
- a few established plants
- simple paths
- significant empty space

A long-used Garden might feel:

- established
- layered
- cared for
- alive
- gently abundant

This development should not correspond directly to productivity output. A lush Garden should not mean *"This user completes lots of tasks."* It should mean something closer to:

> *This is a place that has been inhabited and tended over time.*

Growth represents continuity, relationship, and accumulated history. **Not achievement.**

## 10. The Garden should reduce the visible day

Although the Garden may eventually become visually rich, its productivity interface should remain cognitively sparse.

The user should not encounter twenty visible obligations scattered among beautiful plants. The environment and information hierarchy should work together to communicate:

> *There are many things in your life. Only a few need your attention here today.*

The Garden therefore supports the Today philosophy (`today.md`):

```
Right now
   ↓
After that
   ↓
Later
```

with everything else allowed to recede.

A visually established Garden can coexist with a very modest plan. This contrast is important.

> **Richness of environment does not imply density of obligation.**

## 11. Lists — the Library

Lists is conceptually represented as a Library.

The Library is where the broader structure Lumi is holding becomes visible. Current examples include:

- School
- Work
- Personal
- Ideas
- Later

The Library may eventually contain far richer forms of context than simple task lists. The core metaphor is:

> **Things have places, but they remain retrievable and rearrangeable.**

The Library represents organization without demanding constant administration.

## 12. The Library is not merely storage

The Library should not become a file cabinet. It represents the user's **accumulated threads**.

Over time it may hold:

- intentions
- projects
- tasks
- ideas
- recurring responsibilities
- useful context
- histories of work
- relationships between things
- perhaps eventually knowledge or notes

Its long-term value may be partly archival. The Library can answer *"What am I carrying?"* but eventually also:

- *What have I been thinking about?*
- *Where did this thread begin?*
- *What became of that idea?*
- *What belongs together?*

This makes the Library potentially one of the richest spaces in Coherence. Its complexity should emerge gradually rather than being imposed at onboarding.

## 13. The Library grows through expansion, not points

As the user's accumulated context grows, the Library may naturally become more extensive. Perhaps new shelving appears. Perhaps sections become visually distinct. Perhaps areas emerge around actual recurring domains of the user's life.

For one user these might become:

```
School · Psychology · Personal · Writing
```

For another:

```
Work · Family · Music · House
```

These structures should arise from what actually exists in the user's life.

The user is not "unlocking" Library sections. **The Library is making room.**

This distinction is central:

> **Expansion reflects accumulated life, not earned progress.**

## 14. Lists should remain manipulable

Although Lumi does much of the organizational work, the Library is where manual interaction can be especially valuable. The user may want to:

- reorder things
- move things between categories
- inspect context
- correct Lumi's assumptions
- explicitly change priority
- put something aside
- retrieve something forgotten

Dragging can carry semantic meaning. For example:

| Movement | Meaning |
|---|---|
| vertical movement | relative priority |
| movement between sections | category / context |
| movement to Later | stop foregrounding this for now |

These actions should update Lumi's understanding.

The Library is not separate from the AI. **It is a visible, manipulable representation of shared understanding.**

## 15. The Library should remain navigable as it grows

The archival metaphor creates an important design challenge.

A real library can contain thousands of books because it has systems for finding them. As Coherence accumulates context, it should become more useful, not increasingly overwhelming.

Potential future mechanisms may include:

- natural-language retrieval through Lumi
- semantic grouping
- emergent sections
- zooming into shelves / areas
- contextual search
- active versus archival layers
- visual indications of related threads

The user should never be expected to manually maintain an enormous taxonomy.

> **Lumi should help the Library organize itself.**

## 16. Focus — the Study

Focus is represented conceptually as the Study. The Study exists for one purpose:

> **Give attention to one thing.**

When the user enters, most of Coherence should recede. The Study may contain:

- the current task / intention
- a first action
- optional timer
- minimal controls
- Lumi

Very little else.

The environmental transition itself can help communicate:

> *We came here to do this now.*

## 17. The Study embodies body doubling

The Study is where Lumi's presence may become especially meaningful. The user can say:

> *Stay with me while I work on this.*

Lumi may settle somewhere nearby. She might:

- sit
- read
- quietly occupy herself
- breathe
- blink
- occasionally look up

She should not continually speak. The Study should feel like **shared quiet attention**.

- If the user becomes stuck: Lumi becomes available.
- If they become distracted: Lumi helps them return.
- If momentum takes over: Lumi gets out of the way.

## 18. Leaving the Study is not failure

Focus sessions should not create a performance contract. If the user:

- stops early
- gets distracted
- changes tasks
- needs a break
- abandons the session

the Study should not mark the attempt as failed. Lumi may simply help determine:

> *Where are we now?*

The Study exists to support attention. **Not measure obedience to a timer.**

## 19. Lumi is the continuity between spaces

The environments would risk feeling like separate themed tools without Lumi. Lumi connects them.

| Space | With Lumi |
|---|---|
| At Home | We talk. |
| In the Garden | We decide what deserves tending. |
| In the Library | We organize what we're carrying. |
| In the Study | We work together. |

Lumi carries context between them. This gives the user the sense that they are moving through one coherent environment with the same companion rather than launching separate productivity modules.

## 20. Information should travel with the user

The spaces should never create separate versions of the user's life.

- If something is discussed at **Home**, it may become structured context in the **Library**.
- If the user changes its priority in the **Library**, that should affect what appears in the **Garden**.
- If the **Garden** identifies it as the current priority, the user can enter the **Study** with it.
- If work happens in the **Study**, Lumi should know that when the user returns **Home**.

Conceptually:

```
Home      conversation / meaning
   ↓
Library   structure / context
   ↓
Garden    selection / attention
   ↓
Study     action
   ↓
shared state updates everywhere
```

This is not necessarily a linear workflow. The user may move freely between spaces. The important principle is:

> **Context travels.**

## 21. Movement between spaces should feel continuous

Navigation should be fast and practical. Environmental design should not introduce unnecessary loading, cinematic transitions, or interaction friction.

But subtle transitions may help reinforce spatial continuity. For example:

- Lumi may walk toward another area
- visual materials may shift gradually
- lighting may change
- architectural motifs may carry between spaces
- transitions may imply movement without literally animating a journey

These should remain lightweight. The user should never have to wait for world-building.

> **Atmosphere should accompany navigation, not obstruct it.**

## 22. The spaces should feel related

Home, Garden, Library, and Study should belong to the same world. They should share:

- material language
- typography
- architectural sensibility
- colour relationships
- age / history
- environmental logic
- Lumi

The Garden should not feel like a separate cottagecore application while the Library feels like dark academia and Home feels like a modern SaaS dashboard.

Each space can have a distinct emotional register while remaining recognizably part of Coherence. The overall visual language currently draws from:

```
antique book × quiet inhabited world × crisp modern interface
```

The environmental layer adds character. The interface layer preserves clarity.

## 23. Environments should not become scenery for scenery's sake

The spaces can be beautiful. But decorative richness should be treated carefully.

We have explicitly rejected interface imagery that feels like generic lifestyle decoration:

- coffee cups
- decorative books
- stock plants
- wellness imagery
- arbitrary cozy objects

Environmental elements should contribute to:

- place
- meaning
- continuity
- interaction
- atmosphere

A Library can contain books because it is a Library. That does not mean every UI card needs a stack of decorative books.

A Garden can contain plants because cultivation is the governing metaphor. That does not mean every task needs botanical decoration.

> **The environment earns imagery that the interface itself does not.**

## 24. Environmental richness and interface quiet are separate dimensions

This distinction is important. A space may eventually be visually rich while the functional interface remains extremely simple.

For example, a mature Garden may contain:

- established paths
- trees
- flowers
- walls
- distant landscape
- signs of years of tending

while the actual productivity information visible might still be:

```
Right now
Finish discussion post

After that
Send invoice
```

This is desirable. We should not equate visual richness with information density.

Likewise, a sparse new Garden should not imply that the user is failing. It simply represents a space earlier in its history.

## 25. Spaces can change with the relationship

The environments may gradually respond to accumulated use. This should happen slowly.

Potential forms of development include:

- subtle environmental growth
- new areas becoming relevant
- signs of previous activity
- objects associated with recurring contexts
- archival expansion
- seasonal variation
- Lumi developing additional behaviours within familiar places

These changes should feel **discovered rather than awarded**. Ideally, the user occasionally notices:

> *Oh. That's new.*

rather than receiving:

> ~~*Congratulations! You unlocked Garden Level 4.*~~

## 26. Avoid productivity gamification

The environmental architecture creates obvious opportunities for gamification. Most of them should be resisted.

Avoid:

- XP
- levels
- task-completion currencies
- daily streak rewards
- unlocking environments through productivity
- achievement badges
- completion-driven decoration
- punishing environmental decay

The Garden should not die because the user disappeared. The Library should not become dusty because they missed a week. Lumi should not become sad because they failed to complete tasks.

> **The world should welcome re-entry.**

## 27. Growth should not become judgment

This deserves explicit protection.

If environments change over time, users may infer meaning from those changes. We should avoid creating:

```
beautiful environment = productive person
sparse environment    = failing person
```

Environmental development should primarily reflect:

- duration
- accumulated context
- exploration
- relationship
- diversity of activity

rather than raw output.

A person living through a difficult period should not watch their world deteriorate as punishment.

## 28. The spaces should support different levels of engagement

Not every user will want to engage deeply with the environmental layer. Someone should be able to use Coherence very pragmatically:

```
Open Home → ask Lumi → start task → leave.
```

Another user may enjoy:

- wandering into the Library
- watching the Garden develop
- noticing Lumi's behaviours
- exploring accumulated history

Both should be valid.

> **The world should reward attention with meaning, not require attention for functionality.**

## 29. Lumi may eventually move independently

Currently, Lumi may simply occupy a corner or fixed location. Long-term, she can become more spatially present. She might:

- walk around Home
- wander through the Garden
- move between Library shelves

*[The text as received ends here, partway through §29.]*

---

## 30. Where the product stands, and where this doc pulls against the others

*Claude's addition, 2026-09-13, not Chanté's text. It keeps the direction above honest against what ships and what the other docs say. Update it when a space's page is built or a tension below is settled; a settled tension gets its `decisions.md` entry.*

### The spaces today

| Space | What exists (`features.md`) | Painted place |
|---|---|---|
| **Home** | `/` — the conversation, the greeting, re-entry, the companion bubble | yes — a lamplit room (`public/home-room.webp`) |
| **Garden** | `/today` — the path (Right now · After that · Later), capacity, *Not this* | yes — a daylit greenhouse (`public/today-room.webp`); Lumi stands in it from 1100px |
| **Library** | `/library` (was `/lists`, which redirects) — for now only the room: the list view (open intentions by list, tick, *Add something*) came off the page 2026-09-13. The lists are still kept and still feed Today; filing, ticking and correcting happen in conversation | yes — a lamplit reading room (`public/library-room.webp`); Lumi stands by the reading table from 1100px |
| **Study** | no page. Focus Together is a session bar inside Home (`features.md` → Home) | no |

**The nav today** reads **Home · Today · Library · Insights · Settings** — not the four of §3. *Library* is the first of §3's design names to reach the nav (Chanté, 2026-09-13, as §3's "labels can evolve" allows): it replaced *Lists* when its painting arrived. Today is still *Today*, not *Garden*. **Insights** (what Lumi noticed in the mail) and **Settings** have no space. By §4's test, Insights' single question (*do any of these still need doing?*) is Library work, stewardship of what you're carrying; whether it folds into the Library or stays its own item is open.

### Tensions to settle

1. **Dragging carries meaning (§14) vs the EF-burden log.** The log turned down drag-to-prioritise on the Lists mockup and deferred reordering (`ef-burden-log.md`, 2026-09-11; `today.md` → Lists). §14 brings it back as an *optional* correction that updates Lumi's understanding rather than a list to groom. The difference is real, but it needs its own row (logged 2026-09-13, `open`). One constraint either way: a drag is recorded as an event and Lumi derives from it; no priority field the user has to keep current.
2. **What the world responds to (§9, §26–27) vs `art-direction.md` §3 rule 1.** Art direction allows "a finished session might open a flower". This doc says growth should not follow output and lists *completion-driven decoration* under "avoid". Both rule out decay. They differ on whether a completion may be shown in the world at all. This doc is stricter; if it stands, rule 1 and bet 3 should say so.
3. **Is Lumi's World a feature? (`art-direction.md` §9, question 1).** §6 and §25–28 largely answer it: the world may change slowly with the relationship, is never tended, unlocked or awarded, and is never needed to use the app. There is no separate place called Lumi's World here. Left for Chanté to close.
4. **The four nav names (§3).** Adding *Focus* means a Study page. Today, focus is a bar in the conversation, started by Lumi, deliberately not something the user sets up. A Study page must keep that: entered with a thing, not configured.
5. **The garden's vocabulary (§8).** Plant · Tend · Let rest · Prune · Harvest do not appear in the UI today. The current words are *Done*, *Let go* and *Not this*. Any swap passes §8's own test (natural and immediately understandable) and goes through a voice-eval run, since the words are also Lumi's.
6. **Library sections emerge from life (§13) vs default lists.** Lists today start as School · Work · Personal · Later (`users.preferences.lists`), a default rather than something that emerged. Emergent sections need Lumi to propose and file them, never a taxonomy for the user to build (§15). The Library's painting has blank boards over its bays (repainted 2026-09-13; the version with words is a mockup), and Chanté's Library IA (`art/scenery/library/library-spatial-information-architecture.md`) makes them fixed architectural collection slots whose names emerge from each user's life. Who names a slot, and when, is part of this tension.
7. **Lumi moving between places (§21, §29).** Walking needs an in-betweened walk cycle and four isometric facings (`art-direction.md` §6–7; bet 4). Until then, continuity between spaces comes from light, material and her being there, not a journey.

### Already consistent

- **Imagery belongs to the environment, not the interface (§23–24)** is the line `design-philosophy.md` §2 (painted places, not pictures) and `today.md` principle 10 already draw.
- **Leaving the Study is not failure (§18)** is how focus sessions already work: *stopped early* and *abandoned* are outcomes, not failures, and re-entry asks *Where did we end up?*
- **Context travels (§20)** is the architecture: one state, read through the context block, written only by tools, every write an event (`architecture.md`). Every page's changes reach Lumi through *Recent changes*.
- **The Garden reduces the visible day (§10)** is `today.md` principles 1–4.
