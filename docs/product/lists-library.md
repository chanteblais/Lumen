# Coherence — Lists / Library

*Reconciled product direction, approved 2026-09-13. Shared terms and the approved resolutions are in [Shared model and terminology](shared-model.md); source lineage and retained history are in the [reconciliation record](../living/reconciliation.md). Numbered sections retain the complete supplied document’s order. Examples and future possibilities illustrate direction; they are not a claim of implementation or an expansion of [V1 scope](../v1-plan.md). Unsettled choices remain in [Open questions](../living/open-questions.md).*

**Read with:** [AI architecture](ai-and-information-architecture.md) · [Garden](today-garden.md) · [Spatial design proposal](../../art/scenery/library/library-spatial-information-architecture.md).

## Purpose

This document defines the product philosophy, information hierarchy, interaction model, AI behaviour, and environmental metaphor for Lists, represented within Coherence as the Library.

The Library is where the broader structure Lumi is holding becomes visible, navigable, and correctable.

It is not simply a task-list screen with a library aesthetic.

Its central design problem is:

How do we make the complexity Lumi is holding visible and manipulable without making the user responsible for maintaining that complexity?

The Library should allow the user to orient themselves within the broader shape of their life while preserving Coherence’s foundational division of labour:

Lumi carries organizational burden. The user retains authority.

The Library therefore exists between two undesirable extremes:

A completely opaque AI system whose understanding cannot be inspected or corrected.

And a conventional productivity database the user must continuously organize by hand.

The Library should provide legibility without administrative burden.

## 1. The Library is a window into Lumi’s model

The Library should not be treated as the entirety of Coherence’s underlying information model.

Internally, Coherence may eventually understand:

- Threads\
- Intentions\
- Actions\
- commitments\
- deadlines\
- relationships\
- events\
- priorities\
- user corrections\
- contextual information\
- history\
- inferred patterns\
- attention relevance\
- archival information

The user should not need to inspect or understand all of this structure.

The Library exposes the parts of the model that are useful for orientation and direct manipulation.

It is therefore a projection of Lumi’s understanding rather than a raw database browser.

## 2. The Library answers a different question from the Garden

The Garden asks:

What deserves tending today?

The Library asks:

What am I carrying, and how is it organized?

This distinction should remain clear.

The Garden intentionally suppresses most of the broader model.

The Library allows the user to step back and see more.

That does not mean the Library should show everything simultaneously.

It means the user can deliberately explore more when broader orientation is useful.

## 3. The Library represents breadth without demanding attention

A user may have many active areas of life.

For example:

- School\
- Work\
- Personal\
- Coherence\
- Practicum\
- Finances\
- Home\
- Ideas

The existence of these things does not mean they deserve attention today.

The Library can safely hold greater breadth because entering it is an intentional shift into an organizational mode.

The user is choosing to ask:

What is here?

rather than:

What do I need to do right now?

This makes the Library the appropriate place for complexity to become somewhat more visible.

## 4. Lists are an initial interaction model, not necessarily the final ontology

The first useful version of the Library may look like familiar categorized lists:

School\
Work\
Personal\
Later

This is a good starting point because it is immediately understandable.

But these categories should not prematurely define the entire architecture of the user’s life.

Over time, Coherence may understand richer structures through Threads.

For example:

School\
  → Practicum\
  → Counselling coursework

Personal\
  → Home\
  → Finances

Creative\
  → Coherence\
  → Glåüm\
  → Writing

The visible Library should evolve as the underlying model becomes richer.

The user should not be required to design this taxonomy upfront.

## 5. Structure should emerge from the life

A core principle of the Library is:

The organization should increasingly reflect what actually exists in the user’s life.

One person’s Library might naturally develop around:

School · Psychology · Personal · Writing

Another might develop around:

Work · Family · Music · House

Another:

Clients · Research · Business · Art

The system should not impose a universal project-management hierarchy.

Lumi can infer recurring domains and relationships over time.

The user can correct and reshape them.

The Library makes room for the life rather than asking the life to fit a template.

## 6. The Library should organize itself

If the user gives Lumi a brain dump containing twelve unrelated things, they should not then need to manually file all twelve.

Lumi can make reasonable first guesses.

For example:

Finish discussion post → School\
Send invoice → Work\
Renew insurance → Personal\
Look into domain names → Coherence

Then the user can correct what Lumi misunderstood.

The governing principle remains:

Correction should be easier than configuration.

## 7. Manual organization should express judgment

Manual interaction in the Library is valuable when it communicates something meaningful.

The user should not be manually sorting things merely because the system requires clerical maintenance.

Instead, actions such as dragging can express judgment.

For example:

Vertical movement\
→ relative priority

Movement between sections\
→ category or context

Movement to Later\
→ stop foregrounding this for now

Movement into an active Thread\
→ this belongs with that context

These actions should update Lumi’s understanding.

The user is not maintaining the database.

They are communicating meaning through direct manipulation.

## 8. Priority should feel spatial before it feels numerical

The Library should favour intuitive ordering over explicit priority scores.

Instead of requiring:

Priority: 1\
Priority: 2\
Priority: 3

The user can simply move something higher.

Higher means:

This matters more relative to these other things.

This is both easier to understand and more expressive.

The underlying system may use richer priority reasoning, but the interaction does not need to expose that machinery.

## 9. User ordering and Lumi’s reasoning can coexist

The user’s manual ordering is important evidence.

It is not the only evidence.

Lumi may know:

- something is due tomorrow\
- another item blocks several others\
- something has been repeatedly deferred\
- a task is inappropriate for current capacity

This allows interactions such as:

I know you’ve got the paper above this, but the insurance renewal expires today. I’d deal with that first.

The Library preserves the user’s expressed structure.

The Garden can make contextual recommendations from that structure plus current conditions.

## 10. Categories should remain easy to change

The user’s understanding of where something belongs may change.

An item initially placed in School may later become part of a broader Practicum Thread.

A personal idea may become a real project.

A work project may become archival.

Moving something should feel natural and inexpensive.

The information architecture should support evolution rather than treating categories as permanent identity.

## 11. The Library should tolerate ambiguity

Not everything has an obvious shelf.

Examples:

- an idea the user may pursue someday\
- a question they keep returning to\
- a possible career change\
- something that spans Work and Personal

Lumi should not force arbitrary categorization merely because the interface prefers neatness.

Some things may remain:

- loosely categorized\
- connected to multiple Threads\
- temporarily unshelved\
- in an Ideas or Emerging area

The Library should be organized without pretending life is perfectly categorical.

## 12. Threads should become increasingly important

As Coherence develops, the Library should move beyond flat lists toward persistent Threads.

A Thread preserves continuity around an area of life.

For example:

Practicum

might connect:

- email Richard\
- Wednesday office hours\
- supervision\
- client outreach\
- practicum hours\
- school requirements\
- conversations with Lumi about confidence\
- relevant decisions\
- completed Actions

Without a Thread model, these appear as disconnected tasks.

With a Thread, Lumi understands the larger context.

The Library is likely to become the primary place where Threads can be explored.

## 13. A Thread is not necessarily a project

The term Thread is intentionally broader than Project.

A Thread may be:

- a project\
- a responsibility\
- a relationship\
- an area of study\
- an ongoing question\
- a creative idea\
- a recurring concern\
- a domain of life

Some Threads have clear completion states.

Others persist for years.

The Library should accommodate both without forcing everything into project-management language.

## 14. The Library may eventually hold more than productivity

The long-term potential of the Library extends beyond tasks.

Because Lumi preserves context across conversation and action, the Library may eventually contain or retrieve:

- ideas\
- notes\
- decisions\
- relevant conversations\
- project histories\
- conceptual development\
- recurring questions\
- references\
- relationships between thoughts

This creates a bridge between productivity and personal knowledge management.

The user should not have to maintain a separate second-brain system manually for this value to emerge.

## 15. The Library as a self-organizing second brain

A conventional second brain often requires substantial maintenance:

- capture\
- tagging\
- linking\
- filing\
- reviewing\
- restructuring

That can reproduce the same executive-function problem Coherence is designed to solve.

The Library offers another possibility:

A personal knowledge system that organizes itself largely through the user living, talking, deciding, and working with Lumi.

The user creates meaning through interaction.

Lumi helps preserve and organize the resulting context.

This is a long-term direction rather than a V1 requirement.

But the architecture should avoid foreclosing it.

## 16. The Library should become richer as context accumulates

Unlike Today, which should remain deliberately small, the Library may genuinely expand over time.

This expansion can represent:

- accumulated Threads\
- history\
- ideas\
- projects\
- knowledge\
- recurring areas of life

The Library becomes richer because the user’s life has accumulated context.

Not because the user earned upgrades.

Expansion reflects accumulated life, not points.

## 17. Growth should create room

When the Library develops, the metaphor should be:

We need more room for what exists.

Not:

You unlocked another shelf.

New sections may emerge because the user has developed a substantial body of context around something.

For example:

Coherence may begin as an item under Ideas.

Over time, it becomes substantial enough to have its own section.

The environment responds by making room.

This is a much more meaningful form of growth than gamified unlocking.

## 18. The Library should not become a productivity trophy room

Avoid environmental representations such as:

- shelves filling because tasks were completed\
- books awarded for Focus streaks\
- decorative objects unlocked through productivity\
- achievements displayed as trophies

The Library represents what has accumulated in the user’s life and thinking.

It does not display how well they performed.

## 19. Active and archival layers should differ

As the Library grows, not everything should remain equally visible.

Some Threads are active.

Some are resting.

Some are historical.

Some are archival.

The Library should support this naturally.

Conceptually:

Active shelves\
→ things currently shaping the user’s life

Deeper archive\
→ things worth preserving but not foregrounding

This allows breadth without requiring everything to remain visually present forever.

## 20. Archival does not mean forgotten

Something can recede without disappearing.

A project completed two years ago may no longer belong in the active Library.

But the user may later ask:

What did I decide when I was working on that?

Lumi should still be able to retrieve it.

This mirrors Coherence’s broader memory philosophy:

relevance can decay while history remains retrievable.

## 21. The Library should help old things recede

The user should not need regular archive-cleaning rituals.

Lumi can help notice:

- inactive Threads\
- stale Actions\
- completed projects\
- old Ideas\
- categories that are no longer useful

She may suggest:

This hasn’t been active in a while. Want me to put it in the archive?

Or, for low-consequence cases, active views may simply become quieter while history remains preserved.

The Library should maintain itself conservatively.

## 22. Search should eventually feel like asking Lumi

Traditional search will still be useful.

But one of the Library’s strongest long-term interactions may be natural retrieval.

The user might ask:

What happened with that idea I had about the podcast?

Show me everything related to practicum.

When did I first start thinking about Coherence?

What have I been circling around lately?

Lumi should be able to navigate the Library conceptually and retrieve relevant context.

This is more powerful than requiring the user to remember:

- filename\
- category\
- tag\
- folder\
- date

The user remembers meaning.

Lumi helps retrieve structure.

## 23. Retrieval should tolerate imperfect memory

Human recall is approximate.

The user may remember:

that thing about education and identity

rather than:

Chapter Research / Education Policy / Sources / June 2026

The Library should be designed around semantic retrieval as well as explicit organization.

The user should not need to remember how something was filed in order to find it.

## 24. The Library should preserve provenance

When Lumi retrieves something, it may matter where it came from.

For example:

- user explicitly said this\
- this came from a project note\
- this was inferred from several Actions\
- this was discussed in a conversation months ago

The interface should not constantly expose provenance.

But the underlying model should preserve enough to answer:

Where did that come from?

when useful.

## 25. Zooming is a natural interaction model

The Library lends itself naturally to progressive spatial disclosure.

At the broadest level, the user sees the Library as a whole.

They may then move toward or select a section.

For example:

Library

↓

School

↓

Practicum

↓

specific Threads / Actions / history

This mirrors how physical libraries manage complexity:

room → section → shelf → item

The user does not need to see every item from the doorway.

## 26. Zooming should correspond to increasing detail

As the user moves deeper into the Library, more information can become available.

At a broad level:

- major areas\
- active Threads\
- relative shape

At a closer level:

- Intentions\
- Actions\
- ordering\
- relationships

At an individual Thread level:

- history\
- notes\
- related conversations\
- decisions\
- completed Actions\
- relevant context

This provides progressive disclosure through space.

## 27. The Library should not require literal shelf simulation

The physical-library metaphor is useful.

It should not become cumbersome.

Avoid requiring users to:

- drag virtual books between literal shelves\
- read tiny spine labels\
- navigate a 3D environment to find information\
- manually choose physical shelf positions

The metaphor should support orientation and meaning.

The interface should remain efficient.

A shelf may function as a visual grouping rather than a literal inventory mechanic.

## 28. Broad view and functional view may coexist

The Library may have an environmental overview that communicates place and accumulated structure.

Selecting an area may transition into a cleaner functional view optimized for reading and manipulation.

For example:

Established Library environment

↓ click School section

Closer shelf / section view

↓ select Practicum

Crisp Thread interface

This may allow environmental richness without sacrificing usability.

## 29. The Library should feel established, not cluttered

A mature Library may become visually rich.

It should feel:

- accumulated\
- layered\
- archival\
- warm\
- inhabited\
- quietly mysterious

It should not feel:

- messy\
- crowded\
- visually noisy\
- impossible to navigate

A real library can contain enormous complexity because its structure creates confidence that things can be found.

The digital Library should create the same feeling.

## 30. The Library’s emotional promise is retrievability

The Garden’s emotional promise is:

You do not have to think about everything today.

The Library’s emotional promise is:

You do not have to remember where everything went.

The user should gradually trust:

If it mattered enough to keep, Lumi can probably help me find it again.

That trust can reduce another form of cognitive burden: fear of losing the thread.

## 31. The Library should preserve abandoned ideas without keeping them active

Creative and exploratory work frequently produces things that matter even when they are not pursued.

An abandoned idea should not necessarily vanish.

It may become archival.

Years later it may connect meaningfully to something new.

The Library should support this kind of continuity without keeping every abandoned possibility in the active foreground.

## 32. The Library can preserve intellectual genealogy

For evolving ideas, it may be useful to understand:

- where the idea began\
- how it changed\
- what influenced it\
- what was rejected\
- what questions remain

This is particularly valuable for:

- research\
- writing\
- creative projects\
- theories\
- long-running design work

The Library can therefore preserve not just conclusions but meaningful evolution.

## 33. The Library should distinguish current understanding from historical understanding

A Thread may contain ideas that were later revised.

The Library should avoid presenting every historical statement as equally current.

Where relevant, Lumi should understand:

previous understanding\
→ revised by\
→ current understanding

History remains accessible.

Current truth remains legible.

## 34. The Library should support relationships across sections

Real life does not respect categories.

A Thread may relate simultaneously to:

- School and Work\
- Personal and Creative\
- Finances and Home\
- a person and several projects\
- one idea and multiple areas of life

The underlying model should support relationships that cross visible shelves.

The Library’s categories are navigation aids, not walls in the user’s life.

## 35. Cross-links should not become manual maintenance

The user should not need to create every relationship by hand.

Lumi can infer likely relationships from conversation, shared context, and activity.

When useful, the user can correct them.

A rich relational model should emerge from use rather than requiring the user to build a graph database of themselves.

## 36. The Library should make related context discoverable

When exploring a Thread, Lumi may surface relevant nearby context:

- related Threads\
- unresolved Intentions\
- recent Actions\
- important decisions\
- relevant historical conversations

This should help the user recover the shape of something without flooding them with every semantic match.

Retrieval should support orientation.

## 37. The Library should not turn history into surveillance

A rich archive could easily become unsettling if presented as behavioural monitoring.

Avoid framing such as:

You spent 37 hours on this Thread.

You abandoned 14 related tasks.

You mentioned this person 63 times.

History should primarily support:

- continuity\
- retrieval\
- understanding\
- reconstruction\
- meaningful reflection

not measurement for its own sake.

## 38. The Library should preserve useful forgetting

Not everything deserves permanent prominence.

Old material should be allowed to become harder to encounter accidentally while remaining retrievable deliberately.

This is the spatial counterpart of relevance decay.

A physical library contains books the user has not seen in years.

Their continued existence does not require them to remain on the desk.

## 39. Lumi should know where things are without requiring the user to know

The Library becomes particularly valuable when the system’s organization exceeds what the user can consciously remember.

The user may ask:

Where did we put that thing about domains?

Lumi should ideally know.

This allows organizational sophistication to grow without increasing the user’s memory burden.

## 40. The Library should support browsing as well as searching

Not every retrieval begins with a precise question.

Sometimes the user wants to browse:

- what they have been thinking about\
- active creative Threads\
- old Ideas\
- current School work

The Library should support both:

I know what I’m looking for.

and:

I want to see what’s here.

Browsing should remain calm and structured rather than feed-like.

## 41. The Library must not become an infinite feed

Avoid algorithmic discovery patterns designed to keep the user browsing.

The Library is not social media for the user’s own memories.

If Lumi surfaces related material, it should be because it is useful to the user’s current purpose.

The Library exists to retrieve and orient, not maximize engagement.

## 42. The Library should support direct action

Although the Library is primarily organizational, the user should be able to move naturally from orientation into action.

For example:

select an Action\
→ Start with Lumi\
→ enter Study

Or:

drag an Action onto Lumi\
→ Lumi examines it\
→ Want to start this together?

The transition should preserve context.

## 43. Dropping something onto Lumi can be meaningful

One promising diegetic interaction is allowing the user to give something directly to Lumi.

This should communicate:

Help me with this.

or:

Let’s work on this together.

Lumi may react physically before the conversational transition.

This combines:

- direct manipulation\
- character presence\
- application state\
- body doubling

It should remain optional and have an accessible non-drag alternative.

## 44. Lumi inhabits the Library

Lumi should eventually feel like she belongs there.

She may:

- wander between areas\
- inspect a shelf\
- retrieve something\
- carry a book or symbolic object\
- sit and read\
- look toward the section the user selects

These behaviours reinforce the idea that Lumi helps hold and retrieve context.

They should remain subtle and functional rather than becoming elaborate animation sequences.

## 45. Lumi can embody retrieval

When the user asks Lumi to find something, the interface may eventually express retrieval spatially.

For example, Lumi may move toward the relevant area while the interface transitions into it.

This can make AI retrieval feel embodied without forcing the user to navigate manually.

The interaction should remain fast.

World-building must not create latency theatre.

## 46. The Library should feel like the same world as Home and Garden

The Library may have a distinct emotional register:

- quieter\
- more archival\
- more enclosed\
- more contemplative

But it should remain recognizably part of Coherence.

Shared qualities may include:

- warm ivory and aged materials\
- restrained celestial motifs\
- antique/editorial typography\
- fine linework\
- familiar architectural language\
- Lumi

Avoid turning the Library into generic dark academia.

## 47. Antique does not mean cluttered

The Library can draw from old books, archives, card catalogues, marginalia, shelves, brass details, and worn materials.

But the functional interface should remain crisp.

Avoid:

- decorative piles of books everywhere\
- illegible handwriting\
- excessive sepia\
- ornamental borders around every element\
- dense vintage ephemera

The aesthetic should feel inherited and thoughtful rather than themed.

## 48. Empty space remains functional

Even in a mature Library, not every surface needs content.

Whitespace and visual quiet help the user understand structure.

A library feels navigable partly because aisles, sections, and gaps create orientation.

Digital space should serve the same purpose.

## 49. The Library should not expose implementation ontology unnecessarily

The underlying system may distinguish:

Thread\
Intention\
Action\
Event\
Commitment\
Memory\
Inference

The user does not necessarily need to learn these terms.

The visible Library should use language that feels natural.

Architectural precision should not become product jargon.

## 50. The Library should be usable before it becomes magical

*Scope note: the examples below describe a possible minimal Library, not an approved addition to the delivery plan. Search, grouping and direct manipulation must be scheduled explicitly; see [V1 plan](../v1-plan.md).*

V1 does not need a self-organizing knowledge palace.

A strong initial Library can simply provide:

- School / Work / Personal / Later\
- Actions and Intentions\
- drag-to-reorder\
- drag-to-recategorize\
- basic Thread grouping\
- conversational capture through Lumi\
- search\
- easy correction

The important thing is establishing the conceptual seams that allow the richer Library to emerge later.

## 51. V1 should prove the division of labour

The first Library should demonstrate:

The user can tell Lumi what they are carrying.

Lumi can organize it.

The user can see what Lumi did.

The user can correct it easily.

Those corrections affect Lumi’s understanding.

If this loop feels good, the deeper Library architecture has a strong foundation.

## 52. The Library should remain useful without AI

If AI is temporarily unavailable, the user should still be able to:

- view their structure\
- reorder things\
- move things\
- search explicit text\
- inspect Threads\
- begin work

AI should make organization dramatically easier.

It should not make the user’s own information inaccessible when unavailable.

## 53. AI should improve organization without destabilizing it

Lumi may notice better ways to group things over time.

But the Library should not continuously reorganize itself visibly without the user understanding why.

Major structural changes should be:

- proposed\
- gradual\
- explainable\
- easy to reverse

A self-organizing Library should still feel like the user’s Library.

## 54. Stability matters

Users build spatial and conceptual memory.

If sections constantly move, rename, merge, and disappear, the Library will stop feeling familiar.

The system should distinguish between:

useful adaptation

and

organizational churn.

As the Library matures, its broad structure should become increasingly stable unless the user’s life genuinely changes.

## 55. New structure should emerge conservatively

Lumi should not create a new major section every time a topic appears repeatedly for a week.

Emergence should reflect sustained context.

A possible progression might be:

loose items\
→ recognizable Thread\
→ substantial recurring domain\
→ potential Library section

The threshold should be high enough that new architecture feels meaningful.

## 56. The Library should make restructuring easy when life changes

Stability does not mean permanence.

People:

- finish school\
- change careers\
- move\
- begin relationships\
- end projects\
- develop new interests

The Library should adapt to these transitions without requiring a complete manual reorganization.

Old sections can recede.

New ones can emerge.

History remains available.

## 57. The Library can reflect multiple timescales

The Library naturally spans more time than Today.

It may contain:

- immediate Actions\
- ongoing Intentions\
- active Threads\
- long-term projects\
- archived history

This makes it one of the places where Coherence’s multi-timescale model becomes visible.

The interface should help distinguish these scales without forcing them into one flat list.

## 58. The Library should help recover dormant Threads

Sometimes the user deliberately wants to revisit something old.

For example:

What happened to that book idea?

Lumi can retrieve the dormant Thread and help reconstruct:

- where it began\
- where it stopped\
- what remained unresolved\
- whether the user wants to reactivate it

This is re-entry at a larger timescale.

## 59. Reactivation should not create backlog guilt

When an old Thread returns, Coherence should not surface every unfinished Action from its previous life as overdue.

Lumi should help reassess:

What is still relevant now?

Dormant context provides continuity.

It does not create debt.

## 60. The Library should support deliberate archival exploration

Archival material may eventually become a meaningful space in its own right.

The user might explore:

- previous projects\
- old ideas\
- completed periods of life\
- intellectual development

This should feel more like revisiting history than reviewing performance.

The archive can become nostalgic without becoming sentimental or gamified.

## 61. The Library may become personally meaningful

Over years, the Library could become more than a productivity interface.

It may contain traces of:

- things the user built\
- questions they wrestled with\
- ideas that changed\
- periods of life\
- recurring themes\
- things they cared about

That accumulated context can create genuine attachment.

The value is not that the Library stores everything.

It is that it preserves enough continuity for the user to recognize themselves across time.

## 62. The Library should not totalize the person

Even a rich Library remains a partial model.

It should never imply:

This is your life.

It is:

This is some of what you have chosen to carry here.

People remain larger than the system’s representation of them.

This humility should influence both AI behaviour and interface language.

## 63. The Library’s knowledge should remain correctable

If Lumi has misunderstood a Thread, relationship, category, or historical interpretation, the user should be able to say so naturally.

For example:

That wasn’t actually part of Practicum.

I don’t care about that anymore.

Those two things are related.

That idea changed later.

Correction should update the current model while preserving useful provenance where appropriate.

## 64. The Library should explain itself when needed

If the user asks:

Why is this under Work?

Lumi might answer:

You originally mentioned it while we were talking about your contract work. I may have filed it too broadly.

Then the user can correct it.

The Library should be legible without constantly displaying AI metadata.

## 65. The Library should reduce fear of forgetting

A major cognitive burden is the feeling:

If I stop thinking about this, I will lose it.

A trustworthy Library can gradually replace that with:

I can let this recede. Lumi can help me find it later.

This is a profound form of cognitive offloading.

It allows attention to become more selective because preservation no longer requires constant mental rehearsal.

## 66. Preservation enables backgrounding

This connects the Library directly to the Garden.

The Garden can confidently say:

Everything else can wait.

only if the user trusts that everything else has somewhere safe to go.

The Library provides that containment.

The relationship is therefore:

Library\
→ preserves breadth

Garden\
→ selects from breadth

Study\
→ attends to one thing

The Library makes intelligent omission psychologically possible.

## 67. The Library and Garden form a foreground/background system

Conceptually:

Library = broader held context

Garden = today’s foreground

Study = present attention

Movement between these states should not require duplicating information.

Instead, Coherence changes the degree of foregrounding.

This is one of the core information-design patterns of the product.

## 68. Home and Library should interact naturally

The user may discuss something at Home and later want to see how Lumi is holding it.

For example:

User: I’ve been talking about practicum a lot. Show me what you’ve got around that.

Lumi can move with the user into the Library and open the relevant Thread.

Conversely, while browsing the Library, the user may want to talk about what they find.

The spaces should remain permeable through Lumi.

## 69. The Library should support serendipity carefully

One appealing long-term possibility is Lumi noticing meaningful connections between old and new Threads.

For example:

This idea is similar to something you were thinking about last spring.

That can be valuable.

But it should be contextual and sparse.

The Library should not constantly surface “memories” merely to create delight or engagement.

Serendipity should serve understanding.

## 70. The Library should not become nostalgic manipulation

As the archive becomes personal, the product could exploit nostalgia to increase attachment.

Avoid mechanisms such as:

Remember this day three years ago?

unless the user explicitly wants that kind of reflection and it serves a meaningful purpose.

Personal history deserves restraint.

## 71. The Library should support privacy by design

The Library may eventually contain highly revealing aggregated context.

Its architecture should consider:

- what is stored\
- what is sent to model providers\
- what can remain local\
- deletion\
- archival retention\
- access controls\
- export\
- user inspection

The richer the Library becomes, the more important user trust becomes.

## 72. Users should eventually be able to take their Library with them

Long-term, Coherence should avoid creating value that exists only as inaccessible proprietary memory.

Users should have meaningful ways to export important context and history.

The exact format is unresolved.

But portability aligns with the principle that the Library exists for the user rather than owning the user’s accumulated life context.

## 73. The Library should support accessibility beneath spatial metaphor

The environmental and zooming concepts must not become the only navigation mechanism.

Users should be able to access the same structure through:

- clear text navigation\
- keyboard controls\
- search\
- semantic headings\
- non-drag alternatives\
- screen-reader-friendly hierarchy

The Library can feel spatial without requiring spatial ability.

## 74. Mobile should preserve conceptual depth without reproducing the room

On mobile, the broad Library environment may need to become more abstract.

The essential hierarchy remains:

areas\
→ Threads\
→ Intentions / Actions / history

Do not attempt to shrink an elaborate bookshelf environment onto a phone screen.

The metaphor can be suggested while the functional hierarchy remains clear.

## 75. The Library should be fast to enter

A rich environmental space must not create friction.

The user may simply need to check:

What was that thing under School?

The Library should become useful immediately.

Environmental assets and semantic retrieval should enhance the experience without delaying basic access.

## 76. The Library should have a stable visual grammar

As it grows, users should learn where to look for:

- major areas\
- active Threads\
- priority order\
- archival material\
- search / Lumi retrieval

Environmental expansion should preserve this grammar.

Familiarity is part of the Library’s value.

## 77. The Library should feel calmer after organization, not busier

When Lumi organizes a brain dump, the result should create relief.

The user should not think:

Great, now I have twelve beautifully categorized cards to manage.

They should think:

Okay. Lumi has them.

Organization is successful when it reduces mental holding.

## 78. The Library should not demand review rituals

Avoid requiring:

- weekly inbox processing\
- mandatory archive reviews\
- regular taxonomy cleanup\
- project audits

These may be useful optional practices for some users.

They should not be necessary to keep the Library healthy.

The system should increasingly maintain itself.

## 79. The Library should support intentional review when useful

Although mandatory review is undesirable, deliberate reflection can be valuable.

A user might ask:

What have I got going on in School right now?

What Threads have gone quiet?

What ideas have I left sitting around?

Lumi can provide useful synthesis without turning review into maintenance.

## 80. The Library can compress as well as expand

As life changes, the Library may become smaller in some areas.

Several Threads may become archival.

A category may disappear from active navigation.

This is healthy.

Growth is not one-directional accumulation.

A coherent archive makes room by allowing some things to recede.

## 81. The Library should reflect changing identity without freezing it

Because sections may correspond to major areas of life, the system should avoid turning them into fixed identity claims.

The user may stop being a student.

A creative hobby may become work.

A career may become history.

The Library should preserve continuity while allowing the present structure to change.

## 82. The Library should make breadth feel held

The desired emotional transition is approximately:

Before:

There are so many things floating around. I’m afraid I’m forgetting something.

After:

Okay. They’re somewhere. I can find them when I need them.

The Library is successful when complexity feels held rather than merely displayed.

## 83. The Library’s cognitive objective

The Library should reduce the amount the user must manually:

- remember\
- categorize\
- connect\
- file\
- retrieve\
- review\
- archive\
- reconstruct

Lumi carries more of this work while keeping the resulting model inspectable and correctable.

## 84. The Library’s architectural objective

The Library is a projection over Coherence’s broader shared model.

It should expose enough structure for:

- orientation\
- correction\
- prioritization\
- retrieval\
- exploration

without becoming the canonical database itself.

Conceptually:

active life model\
↓\
Library projection\
↓\
areas / Threads\
↓\
Intentions / Actions / context\
↓\
history / archive

The same underlying state continues to inform Home, Garden, and Study.

## 85. The Library’s environmental objective

The physical-library metaphor should communicate:

- preservation\
- retrievability\
- accumulated history\
- organization\
- expansion\
- quiet discovery

A mature Library should feel like a place that has grown around the user’s life.

Its visual richness should make accumulated complexity feel beautiful and navigable rather than burdensome.

## 86. What the Library is not

The Library is not:

A conventional task manager with books around it.

A manual second-brain system.

A folder hierarchy the user must maintain.

A 3D file browser.

A productivity trophy room.

An infinite memory feed.

A complete representation of the user as a person.

A place where everything remains equally active forever.

It is:

A self-organizing, user-correctable view into the broader context Lumi is holding, designed to make accumulated life and thought retrievable without requiring the user to continuously maintain the archive themselves.

## 87. Core experience test

When reviewing the Library, ask:

Does entering the Library help the user understand what they are carrying?

Can Lumi do most initial organization automatically?

Are manual interactions communicating judgment rather than clerical maintenance?

Can the user correct Lumi easily?

Does manual ordering meaningfully inform priority?

Can structure emerge from the user’s actual life rather than a fixed taxonomy?

Can Threads preserve continuity beyond flat tasks?

Can old material recede without disappearing?

Can the user retrieve something without remembering exactly where it was filed?

Does zooming reveal complexity progressively rather than all at once?

Does the Library become richer without becoming harder to navigate?

Does environmental growth represent accumulated context rather than achievement?

Can Lumi retrieve and explain context naturally?

Can the user disappear for months and later recover a dormant Thread without backlog guilt?

Does the Library preserve history without turning it into surveillance?

Does it remain useful when AI is unavailable?

Does the user feel safer allowing things to leave their immediate attention because they trust they can find them again?

And most importantly:

Does the Library hold more so the user has to remember and maintain less?

## 88. The Library in one sentence

The Library is where the broader context of the user’s life becomes organized, retrievable, and gently explorable—an evolving archive that Lumi helps maintain so the user can safely let things leave the foreground without losing the thread.
