# Coherence — Today / Garden

*Canonical. Written by Chanté, added 2026-09-13. Formatted as Markdown, substance unchanged; mockups of the page are set as code blocks. The text as received breaks partway through §77 and resumes near the end of a section that isn't known, before §120: §78–119 are missing, and the break is marked, not guessed. It is the Garden's place document, which [`PROJECT-CANON.md`](../../../../../PROJECT-CANON.md) listed as to come; [`today.md`](../../../../today.md) stays the spec of the page as built. The place around it is [Spaces of Coherence](spaces.md) §7–10, and the model it compresses is [AI & Information Architecture](../../../../product/ai-and-information-architecture.md) §14–18 and §29. Where it differs from what is decided or built: [decisions](../../../../living/decisions.md) → *Four places, each answering one question*, and [open questions](../living/open-questions.md) 2, 3, 5, 13, 14, 16, 17, 20, 22, 26 and 27.*

---

## Purpose

This document defines the product philosophy, information hierarchy, AI behaviour, interaction model, and environmental metaphor for **Today**, represented within Coherence as the **Garden**.

Today is not intended to be a conventional daily task list.

It is the place where the broader understanding Coherence holds about the user's life is temporarily compressed into an answer to:

> **What deserves my attention today?**

The Garden metaphor expresses the relationship Coherence wants the user to have with that question.

A garden is not completed.

It is tended.

Some things need attention.

Some things are growing without intervention.

Some things are newly planted.

Some things need rest.

Some things should be pruned.

Some things are ready to finish.

And critically:

> **A gardener does not tend everything every day.**

This principle should shape both the information architecture and the emotional experience of Today.

## 1. Today is not the user's task database

The Today page should not simply display:

> all Actions where due_date = today

or:

> all Actions the user marked for today

or:

> the highest-priority items from every List

Today is a **contextual interpretation** of the user's broader life model.

Lumi should consider relevant information such as:

- explicit user priorities
- deadlines
- fixed commitments
- manual ordering in Lists
- active Threads
- unfinished work
- dependencies
- things the user has been avoiding
- recent conversations
- what happened yesterday
- available time
- current capacity
- urgency
- importance
- attention relevance
- things that can safely wait

and propose a manageable path through the day.

The Library holds more.

The Garden shows less.

That reduction is a feature.

## 2. Today is a temporary interpretation, not permanent truth

The Garden represents Lumi's current answer to:

> Given everything we know right now, what seems worth tending today?

That answer is contextual and temporary.

It may change because:

- the user's capacity changes
- something unexpected happens
- a deadline becomes more urgent
- the user changes their mind
- new information arrives
- something takes longer than expected
- something becomes irrelevant
- the user simply decides they want a different day

Changing Today should not require restructuring the user's broader organizational system.

The Library represents more durable structure.

The Garden represents the **current foreground**.

This distinction should remain architecturally clear.

## 3. Today is a path, not a pile

The dominant organizational metaphor for Today should be a **path through the day**, not a collection of equally weighted obligations.

Conceptually:

```
RIGHT NOW
Finish discussion post
   ↓
AFTER THAT
Send invoice
   ↓
LATER
Practicum · 5:00 PM
```

This is fundamentally different from:

- seven checkboxes
- a Kanban board
- a calendar grid
- a ranked task list
- a productivity dashboard

The Garden should help answer:

> Where do I put my attention now?

Then, once that changes:

> What comes next?

The user should not repeatedly re-prioritize the entire day.

## 4. One thing should dominate

At most moments, one thing should have clear visual and cognitive dominance.

For example:

```
Right now

Finish discussion post
School · ~40 min

[ Start with Lumi ]
[ Not this ]
```

Everything else should be visually quieter.

This is not merely aesthetic minimalism.

It is part of Coherence's executive-function support.

The interface has already performed some of the prioritization work.

The user should be able to open Today while overwhelmed and understand almost immediately:

> **This is the thing we're considering right now.**

## 5. The one-second test

Today should pass a particularly strict version of Coherence's one-second test.

Ask:

> **Can an overwhelmed user understand what this page is asking of them within roughly one second?**

If the first visual impression requires scanning:

- several tasks
- a calendar
- a timer
- progress statistics
- reminders
- quotes
- notes
- multiple widgets

the page has failed.

Today should create orientation before offering detail.

## 6. Progressive disclosure

The further something is from the user's immediate attention, the less visual weight it should receive.

A useful hierarchy may be:

### Right Now

One primary Action or Intention.

### After That

One or perhaps two likely next items.

### Later

Fixed commitments or lower-attention items worth remembering.

### Everything Else

Not currently visible unless requested.

This structure should remain flexible.

The important principle is:

> **Distance from now should correspond to reduced cognitive prominence.**

## 7. Everything else can wait

One of the Garden's most important functions is not selecting what matters.

It is helping the user stop carrying what **doesn't** matter right now.

Lumi might say:

> You've got practicum at 5. Nothing else is especially time-sensitive.

or:

> These three things are enough for today. Everything else can wait.

This is not motivational language.

It is useful prioritization information.

The system is helping close unnecessary cognitive loops.

The user can trust:

> Lumi has not forgotten everything else merely because it isn't visible.

That trust is essential.

## 8. Intelligent omission is part of the feature

A successful Today page may appear extremely sparse despite Coherence holding substantial context.

This is intentional.

Lumi may know about:

- 40 open Actions
- 8 active Threads
- several future deadlines
- three things the user has been avoiding
- household responsibilities
- ideas
- appointments
- long-term intentions

Today may still show:

> Finish discussion post.

The system is useful partly because it knows what **not to surface**.

Today should therefore be evaluated not only on the quality of its recommendations but on the quality of its omissions.

## 9. Lumi curates; the user retains authority

Today should feel curated rather than mechanically generated.

Lumi may say:

> Here's what I'm thinking for today.

or:

> I'd keep today pretty small.

or:

> This is the one thing I'd deal with first.

But Lumi's proposal is not a command.

The governing relationship remains:

> **Lumi proposes. The user decides.**

The user should be able to:

- reject the current Action
- reorder the day
- add something
- remove something
- defer something
- tell Lumi something matters more
- decide that the proposed plan is wrong

without fighting the system.

## 10. "Not this" is a first-class interaction

The current recommendation should have an easy rejection path.

Conceptually:

```
Start with Lumi
Not this
```

"Not this" does not mean:

> I failed.

It means:

> This recommendation does not fit my current state.

That is useful information.

Lumi can respond with curiosity.

For example:

> Fair. What's getting in the way?

Possible lightweight responses might include:

- Too big
- Too tired
- Don't know how
- Something else matters more
- Bad timing
- Just nope

Depending on the answer, Lumi may:

- reduce the first step
- switch tasks
- revise the plan
- begin a body-double interaction
- defer something
- question whether it needs doing
- simply accept the user's choice

> **Resistance should modify the model, not create a failure state.**

## 11. Do not over-interrogate resistance

Although "Not this" can reveal useful information, Lumi should not turn every rejected recommendation into a diagnostic interview.

Sometimes:

> Nope.

really does just mean:

> Nope.

Lumi should be capable of saying:

> Fair. Let's do something else.

The purpose of understanding resistance is to reduce friction.

Not to force the user to explain themselves.

## 12. Capacity should materially change Today

Capacity is not decorative context.

If Lumi asks:

> How much have we got today?

and the user responds:

> Not much.

the page should actually change.

A low-capacity Today might become:

```
One important thing
Practicum paperwork

One easy win
Send invoice

Fixed commitment
Practicum · 5:00 PM
```

Then:

> That's enough.

The system should not show the same plan with a sympathetic message attached.

Capacity should change **scope**.

## 13. Low capacity should make the interface smaller

This principle deserves explicit protection.

When capacity decreases:

Today should generally become:

- shorter
- quieter
- more selective
- less ambitious

Not:

- redder
- more urgent
- more motivational
- more crowded
- more insistent

A low-capacity state is not a productivity emergency.

It is planning information.

## 14. High capacity should not become exploitation

The inverse also matters.

If the user says:

> Lots.

Coherence should not respond by filling every available hour.

High capacity means more may be possible.

It does not mean the system should maximize extraction from the user's available energy.

Lumi might propose additional work when appropriate.

She should still preserve:

- breaks
- flexibility
- empty time
- stopping points

The objective remains **appropriate forward movement**, not maximum throughput.

## 15. Today should understand fixed commitments differently

A calendar event and an Action are not the same thing.

If the user has:

> Practicum · 5:00 PM

that commitment may matter to the shape of the day without becoming another checkbox.

Fixed commitments can serve as **temporal landmarks**.

For example:

> You've got practicum at 5, so I'd use the morning for the discussion post and keep the afternoon light.

This is more useful than simply displaying:

> □ Practicum

among tasks.

Today should reason about the structure of time, not merely list events.

## 16. Time should guide without dominating

Coherence may eventually understand:

- available windows
- estimated duration
- deadlines
- appointments
- transition time

But Today should resist becoming a minute-by-minute scheduler by default.

Many users experience rigid schedules as another structure to fail.

Prefer:

> This probably fits before practicum.

over:

> Discussion post: 10:15–10:57.

unless the user explicitly benefits from or requests that level of scheduling.

Time should support orientation.

It should not automatically become control.

## 17. Estimated effort should remain approximate

Knowing that something is likely:

- 5 minutes
- 30 minutes
- an hour
- substantial

can help Lumi make better recommendations.

But effort estimates should not create false precision.

Prefer:

> ~30–45 min

over:

> 37 minutes

unless the estimate comes from meaningful historical evidence.

The purpose is to help answer:

> Does this fit here?

not to optimize every minute.

## 18. Today should support initiation

The Garden does not end when the user chooses something.

It should naturally lead toward starting.

The primary action may be:

> **Start with Lumi**

From there, Lumi can determine whether the user needs:

- a first step
- clarification
- task decomposition
- body doubling
- a timer
- quiet presence
- nothing except permission to begin

The transition from Garden to Study should feel natural.

Conceptually:

> **This deserves attention.**

becomes:

> **Let's give it attention.**

## 19. Starting does not always mean entering Focus

Not every Action requires a formal Focus session.

If Lumi says:

> Send the invoice. It'll take ten minutes.

the best experience may be:

> Go do it.

The user leaves Coherence.

The Garden should not funnel every Action into product engagement.

"Start with Lumi" is available when Lumi's presence is useful.

It should not become a mandatory workflow.

## 20. Today should adapt during the day

A morning plan should not become a contract.

As the day unfolds:

- Actions complete
- Actions take longer than expected
- capacity changes
- commitments move
- new information appears
- priorities shift

Today should be capable of quietly recalculating.

For example:

> That took longer than we expected. I'd drop the other school thing today.

or:

> You've got about forty minutes before you need to leave. Want something small?

The Garden is alive to the day.

It should not require the user to manually rebuild the plan whenever reality changes.

## 21. Completing something should change the foreground

When the current Action completes, the interface can gently transition.

The completed item does not need to remain prominently visible merely to provide satisfaction.

It may move upward, recede, or become part of the day's history.

Then:

**After That**

can become:

**Right Now**

The user experiences progression through changing attention rather than accumulating checkmarks.

## 22. Completion should be acknowledged proportionately

Lumi should not celebrate every completion dramatically.

Avoid:

- confetti
- giant animations
- excessive praise
- productivity points
- completion sounds designed to create reward loops

Sometimes:

> Done.

is enough.

Sometimes:

> Nice. That's off your plate.

is appropriate.

If something was genuinely difficult or meaningful, Lumi may respond more warmly.

The response should reflect the context.

## 23. The Garden metaphor

The Garden exists because it provides a fundamentally different model of productivity from the checklist.

A checklist asks:

> What remains unfinished?

A garden asks:

> **What needs attention?**

A garden contains things at different stages.

Some are:

- seeds
- emerging
- actively growing
- established
- resting
- overgrown
- ready to harvest
- no longer worth tending

This provides a useful conceptual vocabulary for personal productivity without treating incomplete work as failure.

## 24. Planting

Planting can represent the beginning of something.

Conceptually:

> I want to start thinking about this.

or:

> This is something I intend to cultivate.

Not every planted thing needs an immediate Action.

Some intentions require time before they become concrete.

The Garden metaphor therefore supports Coherence's broader concept of **progressive structuring**.

A seed does not need to already know what kind of tree it will become.

## 25. Tending

Tending represents giving attention to something already underway.

This is probably the Garden's central action.

The question becomes:

> What are we tending today?

rather than:

> What are we completing today?

This allows meaningful work to count even when completion is not possible.

Writing one section of a paper may be successful tending.

Making one difficult phone call may be successful tending.

Returning to something after avoiding it may be successful tending.

## 26. Resting

Some things should be consciously allowed to rest.

This is different from forgetting them.

A resting Intention remains part of the broader model but does not currently deserve attention.

Lumi may help the user say:

> Not today.

without converting that decision into guilt.

This is one of the places where the Garden metaphor becomes especially useful.

Healthy systems contain dormancy.

## 27. Pruning

Some things no longer belong.

An Action may become irrelevant.

An Intention may no longer matter.

A project may have been abandoned.

A commitment may have changed.

Pruning represents deliberate removal from active attention.

It should not necessarily mean destructive deletion.

Often it means:

> This no longer needs to grow here.

The underlying history can remain.

## 28. Harvesting

Harvest can represent bringing something meaningfully to completion.

This metaphor should be used sparingly.

Not every checkbox needs to produce a harvest animation.

The deeper idea is that some work reaches a natural point of completion.

The Garden should allow that completion to feel satisfying without turning it into a reward economy.

## 29. The metaphor should remain partly implicit

The Garden should not become a gardening simulator.

Users should not need to understand:

> Seeds = Intentions
> Water = Focus minutes
> Flowers = Completed tasks
> Fertilizer = Streak bonuses

That would undermine the philosophy.

The metaphor should primarily shape:

- atmosphere
- language
- visual growth
- interaction philosophy
- how Lumi talks about attention

Use literal gardening language only when it feels natural.

> **The metaphor should deepen understanding, not create another system to learn.**

## 30. A Garden is never "finished"

This is philosophically important.

Traditional productivity systems often imply a fantasy state:

> Everything is done.

Real life does not work that way.

There will always be:

- something emerging
- something ongoing
- something waiting
- something needing attention later

The Garden normalizes this.

A successful day does not require an empty Garden.

It requires appropriate tending.

## 31. A new Garden should begin modestly

The user's first Garden should not already appear as an elaborate, perfectly established landscape.

It should feel:

- welcoming
- alive
- modest
- open
- full of potential

There may be:

- simple paths
- young plants
- open soil
- a few established elements
- substantial breathing room

The starting environment should not communicate emptiness or failure.

It communicates:

> **This place has room to become yours.**

## 32. An established Garden should feel inhabited

Over time, the Garden may become:

- richer
- layered
- established
- slightly wild in places
- familiar
- recognizably lived with

The user may notice:

- more established plants
- paths
- structures
- subtle traces of history
- areas that have developed distinct character

The feeling should be:

> I've been tending this place for a while.

Not:

> I reached Level 14.

## 33. Environmental growth represents continuity, not output

This principle is non-negotiable.

The Garden should not become more beautiful because the user completed more tasks.

Avoid:

> Complete five tasks → grow flowers.

> Finish a Focus session → earn seeds.

> Seven-day streak → unlock tree.

Environmental development should instead reflect things such as:

- time
- accumulated history
- recurring Threads
- returning to the space
- diversity of things cultivated
- relationship with Coherence
- perhaps user preference

The Garden is a representation of **inhabitation**, not productivity performance.

## 34. The Garden should never punish absence

If the user disappears for three weeks:

the Garden does not die.

Plants do not wither as punishment.

Lumi is not disappointed.

The environment should remain welcoming.

There may even be something beautiful about returning to a Garden that continued existing while the user was away.

Re-entry should feel like:

> Coming back.

Not:

> Repairing the consequences of neglecting the app.

## 35. Visual richness and obligation density are independent

A mature Garden may eventually be visually rich.

It may contain:

- established vegetation
- pathways
- stone
- walls
- water
- distant landscape
- signs of history

while the actual productivity interface still shows:

> **Right now**

> Send invoice.

This is desirable.

Environmental richness should not imply:

> More things to do.

The world can become fuller while the cognitive interface remains quiet.

## 36. The Garden should not become decorative clutter

Environmental imagery is meaningful here because the Garden is an actual environmental space.

But that does not mean every functional element should receive botanical decoration.

Avoid:

- flowers around every card
- leaves as arbitrary dividers
- vines around buttons
- decorative gardening tools
- ornamental seed packets
- lifestyle-style garden imagery with no functional or environmental purpose

The Garden itself provides the scenery.

The interface layered onto it should remain crisp, restrained, and legible.

> **The environment can be expressive because the interface is quiet.**

## 37. Functional UI should remain visually distinct from the environment

The user should immediately understand:

- what is scenery
- what Lumi is interacting with
- what is actionable
- what represents their actual plan

The Garden should not obscure the interface.

Potential techniques include:

- restrained parchment/editorial surfaces
- consistent typography
- clear interaction states
- subtle contrast between environmental and functional layers
- generous whitespace
- limited controls

The visual system should preserve Coherence's broader:

> **antique book × inhabited world × crisp modern interface**

direction.

## 38. Lumi inhabits the Garden

Lumi should eventually feel physically present within the Garden rather than merely appearing as a chatbot avatar floating over it.

She may:

- wander slowly
- stand near something currently being tended
- inspect something
- sit somewhere
- look around
- perform subtle idle animations
- interact with environmental elements
- move toward the Study when Focus begins

Her movement should reinforce:

> **Lumi is here with you.**

It should not continually attract attention.

## 39. Lumi should not become the Garden's tour guide

The existence of an environmental world creates a temptation for Lumi to constantly explain it.

Avoid:

> Welcome to your Garden! Here we plant the seeds of productivity!

The metaphor should not require narration.

The user should gradually understand the Garden through use.

Lumi talks primarily because she has something useful to say.

Not because the product needs to explain its theme.

## 40. Lumi's physical behaviour can communicate attention

The Garden gives Lumi opportunities to communicate state without adding interface elements.

For example:

When considering today's plan:

- Lumi may look toward the relevant area
- pause thoughtfully
- inspect something

When the user selects an Action:

- Lumi may orient toward it

When entering Focus:

- Lumi may begin moving toward the Study

When the user returns after being away:

- Lumi may notice their arrival

These behaviours should remain subtle.

Character animation should support understanding and presence rather than become entertainment competing with the user's attention.

## 41. The Garden can externalize attention spatially

Over time, the environment may help express what is currently foregrounded.

This should be explored carefully.

Potentially:

- the currently tended area is closer or more visually legible
- active Threads have subtle environmental presence
- things not relevant today recede
- the path itself helps direct attention

The environment could therefore participate in the same compression performed by the interface.

This should not require literal mappings such as:

> School tasks are roses.

The spatial language can remain abstract and atmospheric.

## 42. Avoid spatial overload

If every Thread, Action, project, or category receives a permanent physical location in the Garden, the environment will eventually reproduce the same overload problem as a dashboard.

The Garden should not attempt to visualize the entire underlying model.

That is closer to the Library's role.

The Garden represents **what deserves tending now**.

Its spatial design should preserve that selectivity.

## 43. The Garden and Library have different relationships to abundance

This distinction is important.

The **Library** may eventually communicate breadth:

> Look at everything this life contains.

The **Garden** should communicate selectivity:

> Look at what we're tending now.

Both can grow over time.

But they express accumulation differently.

The Library can become expansive.

The Garden can become established.

Neither should become overwhelming.

## 44. Today should allow lightweight manual intervention

Although Lumi curates Today, the user should remain able to make quick changes without entering a planning workflow.

Possible interactions include:

- drag something above another item
- remove something from Today
- add something important
- tell Lumi to make the day smaller
- tell Lumi something must happen
- move something to Later
- swap the current Action

These changes should update shared state where appropriate.

The user should not need to enter a separate "Edit Day" mode merely to disagree with Lumi.

## 45. Adding something should be conversationally easy

If the user suddenly remembers:

> Oh shit, I need to call the dentist today.

they should be able to tell Lumi.

Lumi can determine:

- whether it belongs in Today
- where it fits
- whether something else should move
- whether the user merely wanted it remembered

The system should not force the user into task-entry administration at the moment of remembering.

## 46. Brain dumps should not flood the Garden

If the user gives Lumi fifteen things they are worried about, Today should not suddenly display fifteen new items.

Lumi can capture the broader context into the shared model and then say:

> Okay. I've got them. Most of that does not need your attention today.

Then the Garden remains small.

This interaction embodies one of Coherence's central promises:

> **You can give Lumi the whole mess without having to look at the whole mess afterward.**

## 47. The Garden should support explicit "enough"

Traditional productivity systems rarely know when to stop recommending work.

Coherence should.

At some point, Lumi should be capable of saying:

> That's enough for today.

This may depend on:

- what was accomplished
- remaining commitments
- current time
- capacity
- what still matters
- what can wait

"Enough" should not be calculated purely from task count.

It is contextual.

This is an important counterweight to systems optimized for endless productivity.

## 48. Leaving things unfinished can be coherent

A successful Today may end with unfinished work.

For example:

The user intended to:

- finish discussion post
- send invoice
- clean room

They finish the discussion post and invoice.

Capacity drops.

Lumi may say:

> I'd leave the room. Nothing bad happens if that waits.

That is not failure to complete the plan.

It is **successful adaptation to reality**.

The Garden should normalize changing what is tended as conditions change.

## 49. The Garden should help distinguish commitment from aspiration

People frequently overload daily plans because they mix:

> things that actually need to happen

with:

> things it would be nice to do

Today should help preserve this distinction.

For example:

```
Needs tending
Send insurance documents

If there's room
Clean room
```

This does not necessarily require those exact labels.

The underlying principle is that Lumi should understand **degrees of commitment**.

Everything appearing in the user's broader model should not become a promise to today's self.

## 50. Avoid the "perfect day" fantasy

Today should not encourage users to construct an idealized version of themselves every morning.

Avoid workflows that implicitly ask:

> What would the maximally disciplined version of you accomplish today?

Instead:

> **Given the actual day in front of us, what makes sense?**

This includes:

- actual capacity
- actual time
- actual obligations
- actual emotional state
- actual priorities

The Garden should help the user inhabit the day they have.

Not continually compare it to the day they imagined.

## 51. Planning should be revisable without feeling broken

If Lumi proposes:

> Discussion post → Invoice → Practicum

and the user instead spends the morning dealing with an unexpected problem, the plan should not become a failed artifact.

It should simply update.

A good Today architecture assumes:

> **Plans are hypotheses about the future.**

Reality supplies new information.

Coherence adapts.

## 52. Today should not create overdue debt

Items proposed for Today that do not happen should not automatically become psychologically heavier tomorrow.

Avoid:

> Yesterday: 3 incomplete

or:

> 5 overdue

as the primary re-entry experience.

Instead, Lumi should reassess:

> Does this still matter?

> Does it belong today?

> Should it return to the Library?

> Can it rest?

> Should it be pruned?

An unfinished Today item is not automatically tomorrow's failure.

## 53. Carryover should be intentional

Some things genuinely do need to carry forward.

But carryover should result from renewed relevance, not database inertia.

If something remains important:

Lumi can surface it again.

If it no longer fits:

it can recede.

If it keeps returning:

that pattern itself becomes useful information.

For example:

> We've put this on Today four times now. Something seems to be getting in the way.

That is more useful than turning the item increasingly red.

## 54. Repeated deferral is a signal, not a score

Repeated deferral may indicate:

- initiation difficulty
- unclear scope
- emotional resistance
- poor timing
- incorrect priority
- insufficient capacity
- an unnecessary commitment

Lumi should interpret the pattern contextually.

Avoid:

> Deferred 6× ⚠️

unless the user specifically wants that information.

Prefer:

> This keeps coming back. Want to figure out what's happening with it?

## 55. Today should work without a morning planning ritual

The user should not need to "set up their day" before Today becomes useful.

Coherence should be capable of preparing an initial interpretation automatically from existing context.

The user may open Today and find:

> Here's what I'm thinking.

They can accept, change, or ignore it.

This is important because mandatory planning rituals recreate the maintenance burden Coherence is designed to reduce.

A morning conversation with Lumi can be useful.

It should not be required.

## 56. Today should also work when opened late

The Garden is not only a morning experience.

A user may open it at:

- 7:00 AM
- noon
- 4:30 PM
- 10:00 PM

The interpretation should respond to the actual remaining day.

At 10:00 PM, Lumi should not present the same plan she would have shown at 9:00 AM.

She may say:

> At this point I'd only deal with the email. Everything else can wait until tomorrow.

Today means:

> **the day as it exists now**

not:

> the plan generated this morning.

## 57. Today should understand transitions

Sometimes the problem is not doing the next Action.

It is moving between contexts.

Examples:

- finishing work and beginning school
- leaving for an appointment
- returning after lunch
- shifting from administrative work to creative work

Lumi may eventually help with these transitions.

For example:

> You've got twenty minutes before you need to leave. I wouldn't start the paper. Want to knock out the email?

This is another form of attention selection.

## 58. The Garden can hold temporal landmarks quietly

Fixed events can appear as subtle landmarks in the day.

For example:

```
Later
Practicum · 5:00 PM
```

The interface does not need to become a full calendar.

The purpose is to help the user orient:

> What does the day have room for?

Calendar depth can live elsewhere or be progressively disclosed.

## 59. The Garden should not duplicate Lists

If the user wants to survey everything in:

- School
- Work
- Personal
- Later

they should go to the Library.

Today should not become another place where the same lists appear with slightly different filtering.

Each space should preserve its cognitive role.

**Library:** What am I carrying?

**Garden:** What deserves tending today?

This distinction should remain visible in both UI and architecture.

## 60. The Garden should not duplicate the Study

Likewise, Today should not become a Focus interface.

Its job is selection and orientation.

Once the user commits attention:

the Study can take over.

The Garden asks:

> What?

The Study asks:

> How do we stay with it?

There may be a seamless transition between them, but their cognitive functions remain distinct.

## 61. The Garden should not duplicate Home

Home is where the user can arrive without structure.

The Garden is more opinionated.

Home can hold:

> I don't know what I'm doing.

The Garden attempts to answer:

> Here's what seems worth tending.

The user may reach the Garden through conversation at Home.

But Today should remain useful without requiring conversation first.

## 62. Environmental interaction should remain optional

A user should be able to use Today efficiently without engaging deeply with the Garden metaphor.

For example:

```
open Today
   ↓
see Right Now
   ↓
Start
```

That should work.

Another user may enjoy:

- noticing environmental growth
- watching Lumi wander
- exploring established areas
- seeing subtle changes over time

Both are valid.

The environmental layer should reward attention with meaning.

It should not demand attention for functionality.

## 63. The Garden should reward return with familiarity

The Garden's emotional value should come partly from familiarity.

The user learns:

- where Lumi tends to stand
- the shape of the path
- the distant landscape
- small recurring details
- how the environment changes

Returning can therefore carry a subtle feeling of:

> I'm back here.

This supports Coherence's broader emphasis on re-entry.

The world itself becomes part of continuity.

## 64. Seasonal and contextual change may eventually be appropriate

The Garden may eventually respond subtly to:

- seasons
- time of day
- accumulated use
- perhaps local context

This should be explored carefully.

The purpose would be to reinforce:

- time
- continuity
- inhabitation

not create decorative novelty.

Any environmental variation should preserve familiarity.

The Garden should remain recognizable as **the user's Garden**.

## 65. Environmental change should be slow

Coherence should avoid constant novelty.

A Garden that changes dramatically every day will feel generated rather than inhabited.

Meaningful environmental development should generally occur slowly enough that:

> the user notices occasionally

rather than:

> the system announces every change.

Subtle accumulated change better supports nostalgia and attachment.

## 66. Avoid reward loops disguised as environmental design

Even without explicit points, environmental design can accidentally become gamification.

For example:

> Every Focus session makes a plant grow.

is still essentially an XP system.

The question should be:

> Would this environmental change make sense as accumulated history even if the user never knew what behaviour caused it?

If yes, it may fit.

If the user begins completing tasks primarily to trigger environmental rewards, we have probably moved too far toward gamification.

## 67. The Garden should represent care, not moral virtue

Gardening language can accidentally imply:

> A well-tended life is a good life.

Coherence should avoid moralizing organization.

The Garden is a metaphor for attention.

Not personal worth.

A messy period of life is not evidence that the user has failed to cultivate themselves properly.

The environment should remain generous toward periods of:

- illness
- grief
- burnout
- distraction
- chaos
- disengagement

The Garden exists to help orient the user within reality.

Not judge the reality.

## 68. Lumi should not anthropomorphize the Garden excessively

Avoid language such as:

> Your poor plants missed you!

or:

> The Garden needs you.

This creates emotional obligation toward the app.

The Garden does not need the user.

Lumi does not need the user.

They exist to support the user.

Returning can be warm without manufacturing dependency.

## 69. The Garden may eventually reflect Threads subtly

One promising future direction is allowing persistent Threads to influence the environment without becoming literal task objects.

For example, sustained areas of life might gradually correspond to distinct areas or qualities of the Garden.

This could create a sense that:

> My life has shape here.

However, this remains exploratory.

Risks include:

- over-literal mapping
- spatial clutter
- confusing metaphor
- turning life categories into permanent identity
- making changes in life difficult to represent

Any such system should emerge from actual use rather than being imposed prematurely.

## 70. Environmental history could become meaningful

A mature Garden might eventually preserve traces of previous periods.

Not:

> Here is the flower you earned by completing your taxes.

But perhaps:

> This area feels older.

> That path has become established.

> Something that once occupied a lot of attention has become part of the background.

This kind of environmental memory could reinforce Coherence's interest in **continuity across time**.

It should remain subtle and poetic rather than informationally literal.

## 71. Today should support reflection without requiring it

At the end of the day, Lumi may occasionally help the user notice:

- what changed
- what remains
- what can be released
- what should carry forward

But an evening review should not become required system maintenance.

The user should be able to close Coherence and go to bed.

Lumi can reconstruct tomorrow without demanding a nightly ritual.

Reflection should be available when useful.

Not mandatory for system health.

## 72. The Garden should degrade gracefully

If AI functionality is temporarily unavailable or context is incomplete, Today should still remain usable.

The underlying interface should support:

- manually selecting something
- viewing a few relevant items
- moving things
- starting Focus

Lumi's intelligence makes the Garden substantially better.

The basic product should not become unusable when AI reasoning fails.

This is both a technical and experience principle.

## 73. Recommendations should be explainable when useful

Most of the time, Lumi should not explain every prioritization decision.

That would create noise.

But if the user asks:

> Why this?

Lumi should be able to answer:

> It's due tomorrow, you said yesterday that you wanted it off your plate, and it should fit before practicum.

This reinforces user authority.

The Garden's curation should feel intelligent rather than mysterious.

## 74. The user should be able to ask for a different kind of day

Lumi's curation should support natural requests such as:

> Give me a really light day.

> I want to get a lot done today.

> I only want to deal with school.

> I don't want to touch work today.

> I have two hours. What matters?

> Can we just clear annoying little things?

These are not merely filters.

They are contextual instructions about **how attention should be allocated**.

The Garden should respond naturally.

## 75. Today can contain different kinds of tending

Not all useful attention is task completion.

A day may appropriately include:

- doing
- deciding
- planning
- exploring
- waiting
- reflecting
- resting
- communicating
- beginning
- finishing

The Garden should not silently privilege easily measurable actions over meaningful but less discrete activity.

This follows from the broader Thread / Intention / Action architecture.

## 76. The Garden should not turn life into agriculture

The gardening metaphor has limits.

Relationships are not crops.

Rest is not fertilizer.

Personal development is not a plant-growth mechanic.

Not every aspect of life needs to be translated into gardening language.

The metaphor is strongest when describing:

> **attention, cultivation, timing, growth, rest, and selective care.**

Outside those areas, plain language is often better.

## 77. The Garden is an attention environment

The deepest functional interpretation of Today is not:

> daily task planner

*[The text as received breaks here, partway through §77, and resumes partway through a later section: §78–119 are missing, and the section the lines below end is not known. They are kept as received, up to §120.]*

too many things.

I don't know what matters.

I don't know where to begin.

Everything feels equally present.

**After opening Today:**

> Okay.

> That's the thing.

> The rest can wait.

That transition is one of the clearest measures of whether the Garden is working.

## 120. The cognitive objective

The Garden should reduce the number of things the user must simultaneously:

- remember
- compare
- evaluate
- prioritize
- schedule
- suppress
- initiate

Lumi carries more of that work.

The user's cognitive task becomes smaller:

> **Do I want to tend this now?**

If yes:

begin.

If no:

adapt.

## 121. The architectural objective

The Garden is a **projection and compression layer** over Coherence's broader model.

It should not become a second source of truth.

Conceptually:

```
Threads / Intentions / Actions / Commitments / Context
   ↓
attention-selection reasoning
   ↓
Today / Garden
   ↓
current foreground
   ↓
Study / action
```

Today-specific state may influence the broader model where appropriate.

But the Garden itself remains temporary.

It answers:

> **What deserves attention given the present conditions?**

## 122. The environmental objective

The Garden should make this attention model feel less mechanical.

The user is not operating a prioritization algorithm.

They are entering a familiar place and considering:

> What needs tending?

Over time, the environment becomes established.

Lumi inhabits it.

The Garden accumulates history.

But its purpose remains clear:

> **This is where the complexity of life becomes a manageable field of attention.**

## 123. The Garden should create containment

One subtle function of Today is **containment**.

The user may have dozens of unresolved things in their life.

The Garden creates a boundary around what they are being asked to engage with now.

That boundary should feel trustworthy.

The user should increasingly be able to think:

> If Lumi says these are the things worth tending today, I don't need to keep mentally checking the Library every twenty minutes in case I've forgotten something.

This is an important form of cognitive relief.

Coherence is not merely selecting Actions.

It is helping the user **stop scanning**.

## 124. Trust in containment must be earned

Containment only works if the user trusts Lumi not to suppress something consequential.

That means the system must become reliable about:

- deadlines
- fixed commitments
- explicitly important items
- user corrections
- temporal changes
- things the user has deliberately foregrounded

If Lumi repeatedly misses important things, the user will compensate by mentally holding everything again.

At that point the Garden has failed even if its recommendations are usually reasonable.

A core technical requirement behind the calm interface is therefore:

> **The system must be dependable enough that the user can safely stop monitoring the system.**

This may be one of the most important long-term measures of Coherence's success.

## 125. The Garden should not create false certainty

Trust does not require Lumi to pretend she knows everything.

If relevant context is incomplete, she can say:

> Based on what I've got, this is where I'd start.

If two priorities genuinely conflict:

> I'm not sure there's an obvious winner here.

If the user may have forgotten something:

> I think this is the shape of the day. Anything important I'm missing?

The goal is trustworthy judgment.

Not artificial certainty.

## 126. The Garden can sometimes ask before curating

Most days should not require a planning interview.

But occasionally one high-value question may dramatically improve the plan.

For example:

> You've got a lot competing today. How much have we got?

or:

> Is the paper or the practicum paperwork more important to you today?

One good question can be preferable to an elaborate inference.

The standard should be:

> **Does asking this meaningfully reduce uncertainty that matters?**

If not, Lumi should make a reasonable proposal.

## 127. Questions themselves have cognitive cost

Every question Lumi asks creates work for the user.

Therefore the system should avoid conversational habits such as:

> What would you like to prioritize?

> How are you feeling about your workload?

> Which task feels most important?

when Lumi already has enough context to make a useful first proposal.

The AI should not disguise decision transfer as supportive conversation.

Prefer:

> I'd start with the practicum paperwork. It's the only thing with a real deadline today.

Then let the user disagree.

## 128. Today should make trade-offs visible when they matter

The Garden reduces decisions, but it should not hide meaningful trade-offs.

For example:

> If we do the paper this morning, the insurance call probably moves to tomorrow.

That may be useful information.

The user can then decide:

> That's fine.

or:

> No, insurance needs to happen.

Coherence should reduce unnecessary decisions while preserving decisions that genuinely belong to the user.

## 129. The Garden should understand dependencies

Sometimes the best next Action is not the most important thing.

It is the thing that unlocks something important.

For example:

> Email supervisor

may be a five-minute Action blocking:

> finalize practicum schedule.

Lumi should eventually recognize these relationships.

The Garden can then say:

> I'd send the email first. Everything else on practicum is waiting on that anyway.

This is contextual prioritization rather than static ranking.

## 130. Small Actions can create disproportionate coherence

A useful Garden should sometimes prioritize an apparently minor Action because completing it reduces substantial cognitive noise.

Examples:

- send the email everyone is waiting on
- make the appointment
- submit the form
- answer the question blocking someone else
- put something deliberately into Later

The relevant question is not always:

> What is the biggest task?

It may be:

> **What Action most reduces fragmentation right now?**

This connects Today directly to the deeper philosophy of Coherence.

## 131. Attention can be restored without completion

Sometimes the important outcome is not finishing something.

It is restoring a usable relationship with it.

For example:

The user has avoided a paper for a week.

Today may successfully tend that Thread by:

- opening the document
- reading the existing draft
- figuring out where they got stuck
- writing one paragraph

The paper remains unfinished.

But coherence has increased.

The user knows where they are again.

That should count as meaningful progress within Lumi's understanding even if no checkbox disappears.

## 132. The Garden should recognize orientation as progress

Similarly, the user may spend time figuring out:

> What actually needs to happen here?

If a vague, overwhelming Intention becomes a clear next Action, that is useful work.

For example:

**Before:**

> Deal with taxes.

**After:**

> Download Airbnb earnings.

The user may not have completed the tax problem.

But the Thread is now more coherent and more actionable.

Coherence should value this kind of progress without needing to gamify or score it.

## 133. The Garden should be capable of surfacing a question instead of a task

Sometimes what deserves attention today is not an Action.

It may be a decision.

For example:

> **Right now**
>
> Decide whether you're actually committing to Wednesday office hours.

or:

> We need to figure out whether this project is still active before I keep surfacing its tasks.

This follows from the broader architecture:

Today is an attention environment.

Not merely an Action queue.

## 134. The Garden can surface maintenance of coherence itself

Occasionally the most useful thing may be resolving ambiguity in the system.

For example:

> You've got three things hanging off this project, but I think the project itself may be dead. Want to sort that out?

This is different from routine system maintenance.

The user should not be asked to clean Coherence for its own sake.

But resolving one meaningful ambiguity may remove substantial cognitive clutter.

The distinction is:

> **maintaining the user's life model because it helps the user**

rather than:

> **maintaining the database because the database requires it.**

## 135. The Garden should not overfit to productivity behaviour

If the user repeatedly chooses easy tasks, Lumi should not automatically conclude:

> Easy tasks are this user's preferred priority.

Behaviour can reflect:

- avoidance
- circumstance
- capacity
- opportunity
- preference
- randomness

Learning from Today requires context.

Lumi should avoid turning observed behaviour into simplistic optimization.

## 136. User values should outweigh behavioural prediction

As Coherence becomes better at predicting what the user is likely to do, there is a danger of optimizing recommendations toward compliance.

For example:

> The user usually chooses small administrative tasks, therefore show more small administrative tasks.

But perhaps the user actually cares deeply about writing and struggles to initiate it.

A useful companion should not merely predict behaviour.

It should understand the difference between:

> **what the user tends to do**

and:

> **what the user says matters.**

The Garden should help bridge that gap without becoming coercive.

## 137. Lumi should sometimes protect meaningful difficult work

A sophisticated Garden may occasionally recognize:

> This is harder to start, but it matters more.

Lumi might say:

> I know the invoice would be easier, but you've been trying to get back into the paper all week. I'd actually start there today.

The user can disagree.

But Lumi should not always optimize for easiest completion.

Task initiation support exists partly so meaningful difficult work can receive attention too.

## 138. Easy wins should be contextual, not formulaic

"Do an easy win first" is useful sometimes.

It is not a universal productivity rule.

For one user or one day, a quick Action may create momentum.

On another day, it may become avoidance of the meaningful thing.

Lumi should reason contextually.

Avoid embedding generic productivity advice as permanent algorithmic doctrine.

## 139. The Garden should learn intervention effectiveness

Over time, Lumi may learn which kinds of Today interactions actually help this user move.

For example:

- beginning with one easy Action helps on low-capacity mornings
- breaking down writing tasks helps
- detailed schedules create resistance
- body doubling works particularly well for administrative work
- direct recommendations work better than open-ended questions

This learning should influence **how Lumi supports attention**, not merely which tasks she ranks.

Personalization therefore includes intervention strategy as well as prioritization.

## 140. The Garden should preserve room for spontaneity

A coherent day is not necessarily a fully planned day.

The user may:

- become interested in something unexpected
- follow a creative idea
- decide to see someone
- spend longer outside
- change priorities because something feels alive

Coherence should not treat spontaneity as disruption to the plan.

The Garden should preserve enough openness that the user's life can still surprise them.

## 141. Not everything meaningful should enter Coherence

The product should resist totalizing the user's life.

Not every:

- conversation
- relationship
- hobby
- moment of rest
- creative impulse
- household activity

needs to become represented in the model.

The Garden should help with what benefits from support.

It should not imply that a coherent life is one completely mediated by Coherence.

## 142. The Garden should make itself unnecessary when appropriate

If the user wakes up knowing exactly what they want to do:

they should not need to consult Today.

If they open Home and say:

> I'm working on Coherence today.

Lumi does not need to force them through a Garden-planning flow.

The Garden exists when orientation is useful.

It is not a required ritual.

## 143. The Garden should support direct entry

Conversely, some users may want to open Coherence directly into Today.

That should be possible without first talking to Lumi.

The Garden should stand on its own as an immediately understandable surface.

Lumi's intelligence is embedded in its curation even when no conversation occurs.

## 144. The Garden and Lumi should feel integrated

Avoid the pattern:

> static productivity dashboard + chatbot panel on the side.

Lumi's understanding should shape:

- what appears
- what disappears
- ordering
- copy
- capacity adaptation
- re-entry
- interactions
- transitions

The AI is not an add-on to Today.

> **The Garden itself is one expression of Lumi's understanding.**

## 145. Today should not expose AI machinery unnecessarily

The user does not need to see:

> AI confidence: 0.82

> Recommendation reason weights

> Context sources: 14

unless debugging or advanced inspection genuinely requires it.

Natural explanation is preferable:

> I'd do this first because it's due today and should only take ten minutes.

The intelligence should be legible without becoming technical.

## 146. The Garden should preserve accessibility beneath metaphor

Environmental richness, drag interactions, animation, and visual hierarchy should never become the only way to understand or operate Today.

Important interactions should remain accessible through:

- clear text
- keyboard navigation
- non-drag alternatives
- sufficient contrast
- understandable controls
- reduced-motion support
- semantic structure

The metaphor should enrich the experience without becoming an accessibility barrier.

## 147. Reduced motion should preserve presence

If the user prefers reduced motion:

Lumi does not need to disappear.

The Garden does not need to become visually dead.

Presence can remain through:

- static posture changes
- subtle state transitions
- restrained environmental differences
- text and interaction

Animation should enhance inhabitation.

It should not be required for understanding.

## 148. Mobile should preserve the hierarchy, not the desktop layout

The Garden may eventually have a rich desktop environment.

On smaller screens, the priority is preserving:

```
Right Now
   ↓
After That
   ↓
Later
```

and Lumi's presence.

Do not attempt to squeeze the entire environmental composition into a miniature desktop.

The spatial metaphor may need to become more suggestive on mobile.

The cognitive model should remain intact.

## 149. The Garden should remain fast

Environmental assets, Lumi animation, AI curation, and contextual reasoning must not make Today feel slow to enter.

The first useful state should appear quickly.

If AI curation requires additional time, the interface can:

- show the last valid state
- show a minimal orientation
- progressively update

rather than presenting a long loading experience.

A calm interface that makes the user wait is still friction.

## 150. Lumi should not recalculate visibly without reason

If Today is constantly rearranging itself while the user looks at it, the Garden will feel unstable.

Contextual adaptation should generally occur at meaningful moments:

- opening Today
- completing something
- changing capacity
- receiving consequential new information
- user request
- returning after meaningful elapsed time

The user should not feel that the ground beneath their priorities is continuously shifting.

## 151. Changes should preserve orientation

When Lumi updates Today, the user should understand what changed.

For small changes, this may be obvious through subtle movement.

For larger changes, Lumi may say:

> Since that meeting moved, I'd change the afternoon a bit.

This prevents intelligent adaptation from feeling arbitrary.

## 152. Today should have a stable visual grammar

Although the contents change, the basic hierarchy should become familiar.

The user should learn where to look for:

- what matters now
- what comes next
- fixed later commitments
- Lumi
- the option to change the plan

Consistency reduces cognitive load.

Environmental growth should not destabilize this grammar.

## 153. The Garden should be visually calmer than the user's internal state

This is an important design test.

When someone arrives overwhelmed, the interface should not mirror their overwhelm back at them.

It should perform transformation:

```
fragmentation
   ↓
selection
   ↓
orientation
```

The Garden is not a visualization of everything in the user's head.

It is a **calmer interpretation of it**.

## 154. The Garden should never require aesthetic appreciation

The environmental concept may become beautiful.

But the product should still work for someone who does not care about:

- antique books
- gardens
- environmental storytelling
- Lumi's animations

The underlying experience must remain strong:

> intelligent curation + low cognitive load + easy correction + natural initiation.

Aesthetic attachment deepens the product.

It cannot substitute for usefulness.

## 155. The Garden should be allowed to evolve

This document defines principles, not a frozen UI.

The eventual Today interface may differ significantly from current mockups.

Possible future implementations might include:

- a path
- cards
- spatial environmental interaction
- conversational curation
- subtle timeline elements
- combinations of these

The implementation may change.

The underlying experience should remain:

> **The broader complexity of the user's life is compressed into a manageable, revisable answer to what deserves attention today.**

## 156. What Today / Garden is not

The Garden is not:

- **A daily to-do list with flowers around it.**
- **A dashboard.**
- **A calendar replacement.**
- **A productivity scorecard.**
- **A gamified task garden.**
- **A place where every open task appears.**
- **A rigid daily schedule.**
- **A morning planning ritual the user must maintain.**
- **A system for maximizing the amount accomplished today.**
- **A motivational surface.**
- **A promise that today's plan will happen exactly as predicted.**

It is:

> **A capacity-aware attention environment where Lumi helps the user decide what deserves tending now, keeps everything else safely in the background, and makes it easy to begin or change course.**

## 157. Core experience test

When reviewing Today, ask:

- **Can an overwhelmed user understand what matters within roughly one second?**
- **Is one thing clearly more important than everything else on the screen?**
- **Is the system showing information because it is relevant now, or merely because it knows it?**
- **Does Lumi's curation reduce the number of decisions the user must make?**
- **Can the user disagree easily?**
- **Does resistance change the plan rather than create failure?**
- **Does capacity materially change what is proposed?**
- **Can something be allowed to rest without becoming overdue debt?**
- **Does unfinished work get reconsidered rather than blindly carried forward?**
- **Does the Garden preserve actual urgency without manufacturing productivity urgency?**
- **Does the user trust that hidden things have not been forgotten?**
- **Does the page help the user stop mentally scanning everything else?**
- **Does environmental richness represent continuity rather than achievement?**
- **Could the user disappear for three weeks and return without punishment?**
- **Is Lumi present without becoming distracting?**
- **Is the Garden helping the user start, or encouraging more planning?**
- **Can the user leave quickly once they know what to do?**

And most importantly:

> **Does the user feel like they have fewer things to hold after opening Today than they did before?**

If not, the Garden is not doing its job.

## 158. The Garden in one sentence

> **The Garden is where Lumi transforms the complexity of the user's active life into a small, humane, capacity-aware answer to the question: What needs tending today?**
