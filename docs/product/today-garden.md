# Coherence — Today / Garden

*Reconciled product direction, approved 2026-09-13. Shared terms and the approved resolutions are in [Shared model and terminology](shared-model.md); source lineage and retained history are in the [reconciliation record](../living/reconciliation.md). Numbered sections retain the complete supplied document’s order. Examples and future possibilities illustrate direction; they are not a claim of implementation or an expansion of [V1 scope](../v1-plan.md). Unsettled choices remain in [Open questions](../living/open-questions.md).*

**Read with:** [Today as built](../today.md) · [Library](lists-library.md) · [Study](focus-study.md) · [AI architecture](ai-and-information-architecture.md).

## Purpose

This document defines the product philosophy, information hierarchy, AI behaviour, interaction model, and environmental metaphor for Today, represented within Coherence as the Garden.

Today is not intended to be a conventional daily task list.

It is the place where the broader understanding Coherence holds about the user's life is temporarily compressed into an answer to:

What deserves my attention today?

The Garden metaphor expresses the relationship Coherence wants the user to have with that question.

A garden is not completed. It is tended.

Some things need attention. Some things are growing without intervention. Some are newly planted. Some need rest. Some should be pruned. Some are ready to finish.

And critically:

A gardener does not tend everything every day.

This principle should shape both the information architecture and the emotional experience of Today.

## 1. Today is not the user's task database

The Today page should not simply display all Actions due today, all Actions manually marked for today, or the highest-priority items from every List.

Today is a contextual interpretation of the user's broader active-life model.

Lumi should consider relevant information such as explicit user priorities, deadlines, fixed commitments, manual ordering in Lists, active Threads, unfinished work, dependencies, things the user has been avoiding, recent conversations, what happened yesterday, available time, current capacity, urgency, importance, attention relevance, and things that can safely wait.

Then she proposes a manageable path through the day.

The Library holds more.

The Garden shows less.

That reduction is a feature.

## 2. Today is a temporary interpretation, not permanent truth

The Garden represents Lumi's current answer to:

Given everything we know right now, what seems worth tending today?

That answer is contextual and temporary.

It may change because capacity changes, something unexpected happens, a deadline becomes more urgent, the user changes their mind, new information arrives, something takes longer than expected, something becomes irrelevant, or the user simply wants a different day.

Changing Today should not require restructuring the user's broader organizational system.

The Library represents more durable held structure.

The Garden represents the current foreground.

## 3. Today is a path, not a pile

The dominant organizational model for Today should be a path through the day, not a collection of equally weighted obligations.

Conceptually:

RIGHT NOW\
Finish discussion post

↓

AFTER THAT\
Send invoice

↓

LATER\
Practicum · 5:00 PM

This is fundamentally different from seven checkboxes, a Kanban board, a calendar grid, a ranked task list, or a productivity dashboard.

The Garden should help answer:

Where do I put my attention now?

Then, once that changes:

What comes next?

The user should not repeatedly reprioritize the entire day.

## 4. One thing should dominate

At most moments, one thing should have clear visual and cognitive dominance.

For example:

Right now\
Finish discussion post\
School · \~40 min

Start with Lumi\
Not this

Everything else should be visually quieter.

This is not merely aesthetic minimalism. It is executive-function support.

The interface has already performed some of the prioritization work.

The user should be able to open Today while overwhelmed and understand almost immediately:

This is the thing we're considering right now.

## 5. The one-second test

Today should pass a particularly strict version of Coherence's one-second test.

Can an overwhelmed user understand what this page is asking of them within roughly one second?

If the first visual impression requires scanning several tasks, a calendar, a timer, progress statistics, reminders, quotes, notes, and multiple widgets, the page has failed.

Today should create orientation before offering detail.

## 6. Progressive disclosure

The further something is from the user's immediate attention, the less visual weight it should receive.

A useful hierarchy may be:

Right Now — one primary Action or Intention.\
After That — one or perhaps two likely next items.\
Later — fixed commitments or lower-attention items worth remembering.\
Everything Else — not currently visible unless requested.

The important principle is:

Distance from now should correspond to reduced cognitive prominence.

## 7. Everything else can wait

One of the Garden's most important functions is helping the user stop carrying what does not matter right now.

Lumi might say:

You've got practicum at 5\. Nothing else is especially time-sensitive.

or:

These three things are enough for today. Everything else can wait.

This is not motivational language. It is useful prioritization information.

The user can trust that Lumi has not forgotten everything else merely because it is not visible.

That trust is essential.

## 8. The Garden provides containment

The user may have dozens of unresolved things in their life.

The Garden creates a trustworthy boundary around what they are being asked to engage with now.

The user should increasingly be able to think:

If Lumi says these are the things worth tending today, I do not need to keep mentally scanning the Library in case I've forgotten something.

Coherence is not merely selecting Actions.

It is helping the user stop scanning.

Containment only works if Lumi is dependable enough that hidden things really have not been forgotten.

## 9. Intelligent omission is part of the feature

A successful Today page may appear extremely sparse despite Coherence holding substantial context.

Lumi may know about forty open Actions, eight active Threads, future deadlines, things the user has been avoiding, household responsibilities, ideas, appointments, and long-term intentions.

Today may still show:

Finish discussion post.

The system is useful partly because it knows what not to surface.

Today should therefore be evaluated not only on the quality of its recommendations but on the quality of its omissions.

## 10. Lumi curates; the user retains authority

Today should feel curated rather than mechanically generated.

Lumi may say:

Here's what I'm thinking for today.

I'd keep today pretty small.

This is the one thing I'd deal with first.

But Lumi's proposal is not a command.

The governing relationship remains:

Lumi proposes. The user decides.

The user should be able to reject the current Action, reorder the day, add something, remove something, defer something, tell Lumi something matters more, or decide the proposed plan is wrong without fighting the system.

## 11. Not this is a first-class interaction

The current recommendation should have an easy rejection path.

Not this does not mean: I failed.

It means: This recommendation does not fit my current state.

That is useful information.

Lumi can respond with light curiosity when useful.

Possible reasons include:

Too big.\
Too tired.\
Don't know how.\
Something else matters more.\
Bad timing.\
Just nope.

Depending on the answer, Lumi may reduce the first step, switch tasks, revise the plan, begin body doubling, defer something, question whether it needs doing, or simply accept the user's choice.

Resistance should modify the model, not create a failure state.

## 12. Do not over-interrogate resistance

Although Not this can reveal useful information, Lumi should not turn every rejected recommendation into a diagnostic interview.

Sometimes nope simply means nope.

Lumi should be capable of saying:

Fair. Let's do something else.

The purpose of understanding resistance is to reduce friction, not force explanation.

## 13. Capacity should materially change Today

Capacity is not decorative context.

If Lumi asks how much the user has today and the answer is not much, the page should actually change.

A low-capacity Today might become:

One important thing — Practicum paperwork.\
One easy win — Send invoice.\
Fixed commitment — Practicum · 5:00 PM.

Then:

That's enough.

The system should not show the same plan with sympathetic copy attached.

Capacity should change scope.

## 14. Low capacity should make the interface smaller

When capacity decreases, Today should generally become shorter, quieter, more selective, and less ambitious.

Not redder, more urgent, more motivational, more crowded, or more insistent.

A low-capacity state is planning information, not a productivity emergency.

## 15. High capacity should not become exploitation

If the user has lots of capacity, Coherence should not respond by filling every available hour.

High capacity means more may be possible. It does not mean the system should maximize extraction from available energy.

Lumi may propose additional work when appropriate while preserving breaks, flexibility, empty time, and stopping points.

The objective remains appropriate forward movement, not maximum throughput.

## 16. Fixed commitments are temporal landmarks

A calendar event and an Action are not the same thing.

If the user has Practicum at 5:00 PM, that commitment may matter to the shape of the day without becoming another checkbox.

Lumi can reason:

You've got practicum at 5, so I'd use the morning for the discussion post and keep the afternoon light.

Today should reason about the structure of time, not merely list events.

## 17. Time should guide without dominating

Coherence may eventually understand available windows, estimated duration, deadlines, appointments, and transition time.

But Today should resist becoming a minute-by-minute scheduler by default.

Prefer:

This probably fits before practicum.

over:

Discussion post: 10:15–10:57.

unless the user explicitly benefits from or requests that level of scheduling.

Time should support orientation. It should not automatically become control.

## 18. Estimated effort should remain approximate

Knowing that something is likely five minutes, thirty minutes, an hour, or substantial can help Lumi make better recommendations.

But effort estimates should not create false precision.

Prefer \~30–45 min over 37 minutes unless the estimate comes from meaningful evidence.

The purpose is to answer: Does this fit here?

## 19. Today should support initiation

The Garden does not end when the user chooses something.

It should naturally lead toward starting.

The primary action may be Start with Lumi.

From there, Lumi can determine whether the user needs a first step, clarification, task decomposition, body doubling, a timer, quiet presence, or nothing except permission to begin.

The transition from Garden to Study should feel natural:

This deserves attention.

becomes:

Let's give it attention.

## 20. Starting does not always mean entering Focus

Not every Action requires a formal Focus session.

If Lumi says Send the invoice; it'll take ten minutes, the best experience may be for the user to simply leave and do it.

The Garden should not funnel every Action into product engagement.

Start with Lumi is available when Lumi's presence is useful. It should not become mandatory workflow.

## 21. Today should adapt during the day

A morning plan should not become a contract.

As the day unfolds, Actions complete, things take longer than expected, capacity changes, commitments move, new information appears, and priorities shift.

Today should quietly recalculate at meaningful moments.

For example:

That took longer than we expected. I'd drop the other school thing today.

or:

You've got about forty minutes before you need to leave. Want something small?

The Garden is alive to the day.

## 22. Completing something should change the foreground

When the current Action completes, it does not need to remain prominently visible merely to provide satisfaction.

It can recede into the day's history.

Then After That can become Right Now.

The user experiences progression through changing attention rather than accumulating checkmarks.

## 23. Completion should be acknowledged proportionately

Lumi should not celebrate every completion dramatically.

Avoid confetti, giant animations, excessive praise, productivity points, and completion sounds designed to create reward loops.

Sometimes Done is enough.

Sometimes Nice. That's off your plate is appropriate.

If something was genuinely difficult or meaningful, Lumi may respond more warmly.

## 24. The Garden metaphor

The Garden exists because it provides a fundamentally different model of productivity from the checklist.

A checklist asks: What remains unfinished?

A garden asks: What needs attention?

A garden contains things at different stages: seeds, emerging growth, established things, resting things, overgrown things, things ready to harvest, and things no longer worth tending.

This supports personal productivity without treating incomplete work as failure.

## 25. Planting

Planting can represent the beginning of something.

I want to start thinking about this.

This is something I intend to cultivate.

Not every planted thing needs an immediate Action.

Some intentions require time before they become concrete.

The Garden metaphor therefore supports progressive structuring.

## 26. Tending

Tending represents giving attention to something already underway.

This is probably the Garden's central concept.

The question becomes:

What are we tending today?

rather than:

What are we completing today?

This allows meaningful work to count even when completion is not possible.

Writing one section of a paper, making one difficult phone call, or returning to something after avoiding it may all be successful tending.

## 27. Resting

Some things should be consciously allowed to rest.

This is different from forgetting them.

A resting Intention remains part of the broader model but does not currently deserve attention.

Lumi can help the user say Not today without converting that decision into guilt.

Healthy systems contain dormancy.

## 28. Pruning

Some things no longer belong.

An Action may become irrelevant. An Intention may no longer matter. A project may be abandoned. A commitment may have changed.

Pruning represents deliberate removal from active attention.

It should not necessarily mean destructive deletion.

Often it means:

This no longer needs to grow here.

## 29. Harvesting

Harvest can represent bringing something meaningfully to completion.

This metaphor should be used sparingly.

Not every checkbox needs a harvest animation.

The deeper idea is that some work reaches a natural point of completion, and that completion can feel satisfying without becoming a reward economy.

## 30. The metaphor should remain partly implicit

The Garden should not become a gardening simulator.

Users should not need to learn:

Seeds = Intentions.\
Water = Focus minutes.\
Flowers = completed tasks.\
Fertilizer = streak bonuses.

The metaphor should primarily shape atmosphere, language, visual growth, interaction philosophy, and how Lumi talks about attention.

The metaphor should deepen understanding, not create another system to learn.

## 31. A Garden is never finished

Traditional productivity systems often imply a fantasy state: everything is done.

Real life does not work that way.

There will always be something emerging, ongoing, waiting, or needing attention later.

The Garden normalizes this.

A successful day does not require an empty Garden.

It requires appropriate tending.

## 32. A new Garden should begin modestly

The user's first Garden should not already appear as an elaborate, perfectly established landscape.

It should feel welcoming, alive, modest, open, and full of potential.

There may be simple paths, young plants, open soil, a few established elements, and substantial breathing room.

The starting environment should not communicate emptiness or failure.

It communicates:

This place has room to become yours.

## 33. An established Garden should feel inhabited

Over time, the Garden may become richer, layered, established, slightly wild in places, familiar, and recognizably lived with.

The user may notice more established plants, paths, structures, subtle traces of history, or areas that have developed distinct character.

The feeling should be:

I've been tending this place for a while.

Not:

I reached Level 14\.

## 34. Environmental growth represents continuity, not output

This principle is non-negotiable.

The Garden should not become more beautiful because the user completed more tasks.

Avoid complete five tasks → grow flowers, finish a Focus session → earn seeds, or seven-day streak → unlock tree.

Environmental development should instead reflect time, accumulated history, recurring Threads, returning to the space, diversity of things cultivated, relationship with Coherence, and perhaps user preference.

The Garden is a representation of inhabitation, not productivity performance.

## 35. The Garden should never punish absence

If the user disappears for three weeks, the Garden does not die.

Plants do not wither as punishment.

Lumi is not disappointed.

The environment remains welcoming.

Re-entry should feel like coming back, not repairing the consequences of neglecting the app.

## 36. Visual richness and obligation density are independent

A mature Garden may eventually be visually rich with established vegetation, pathways, stone, walls, water, distant landscape, and signs of history while the productivity interface still shows only:

Right now — Send invoice.

This is desirable.

Environmental richness should not imply more things to do.

## 37. The Garden should not become decorative clutter

Environmental imagery is meaningful because the Garden is an actual environmental space.

That does not mean every functional element should receive botanical decoration.

Avoid flowers around every card, leaves as arbitrary dividers, vines around buttons, decorative gardening tools, ornamental seed packets, and lifestyle-style garden imagery with no functional purpose.

The Garden itself provides the scenery.

The interface layered onto it should remain crisp, restrained, and legible.

The environment can be expressive because the interface is quiet.

## 38. Functional UI should remain distinct from the environment

The user should immediately understand what is scenery, what is actionable, what Lumi is interacting with, and what represents their actual plan.

Potential techniques include restrained parchment or editorial surfaces, consistent typography, clear interaction states, subtle contrast between environmental and functional layers, generous whitespace, and limited controls.

The visual system should preserve Coherence's broader direction:

antique book × inhabited world × crisp modern interface.

## 39. Lumi inhabits the Garden

Lumi should eventually feel physically present within the Garden rather than merely appearing as a chatbot avatar floating over it.

She may wander slowly, stand near something currently being tended, inspect something, sit somewhere, look around, perform subtle idle animations, interact with environmental elements, or move toward the Study when Focus begins.

Her movement should reinforce:

Lumi is here with you.

It should not continually attract attention.

## 40. Lumi should not become the Garden's tour guide

Avoid:

Welcome to your Garden! Here we plant the seeds of productivity!

The metaphor should not require narration.

The user should gradually understand the Garden through use.

Lumi talks primarily because she has something useful to say, not because the product needs to explain its theme.

## 41. Lumi's physical behaviour can communicate attention

The Garden gives Lumi opportunities to communicate state without adding interface elements.

When considering today's plan, she may look toward a relevant area or pause thoughtfully.

When the user selects an Action, she may orient toward it.

When entering Focus, she may begin moving toward the Study.

When the user returns after being away, she may notice their arrival.

These behaviours should remain subtle.

## 42. The Garden can externalize attention spatially

Over time, the environment may help express what is currently foregrounded.

The currently tended area may be closer or more legible. Active context may have subtle environmental presence. Things not relevant today may recede. The path itself may help direct attention.

The environment can participate in the same compression performed by the interface.

This should not require literal mappings such as School tasks are roses.

## 43. Avoid spatial overload

If every Thread, Action, project, or category receives a permanent physical location in the Garden, the environment will eventually reproduce the same overload problem as a dashboard.

The Garden should not attempt to visualize the entire underlying model.

That is closer to the Library's role.

The Garden represents what deserves tending now.

## 44. The Garden and Library have different relationships to abundance

The Library may eventually communicate breadth:

Look at everything this life contains.

The Garden should communicate selectivity:

Look at what we're tending now.

Both can grow over time, but they express accumulation differently.

The Library can become expansive.

The Garden can become established.

Neither should become overwhelming.

## 45. Today should allow lightweight manual intervention

Although Lumi curates Today, the user should remain able to make quick changes without entering a planning workflow.

Possible interactions include dragging something above another item, removing something from Today, adding something important, telling Lumi to make the day smaller, telling Lumi something must happen, moving something to Later, or swapping the current Action.

These changes should update shared state where appropriate.

## 46. Adding something should be conversationally easy

If the user suddenly remembers:

Oh shit, I need to call the dentist today.

they should be able to tell Lumi.

Lumi can determine whether it belongs in Today, where it fits, whether something else should move, or whether the user merely wanted it remembered.

The system should not force task-entry administration at the moment of remembering.

## 47. Brain dumps should not flood the Garden

If the user gives Lumi fifteen things they are worried about, Today should not suddenly display fifteen new items.

Lumi can capture the broader context and say:

Okay. I've got them. Most of that does not need your attention today.

Then the Garden remains small.

This interaction embodies a central promise:

You can give Lumi the whole mess without having to look at the whole mess afterward.

## 48. The Garden should support explicit enough

Traditional productivity systems rarely know when to stop recommending work.

Coherence should.

At some point, Lumi should be capable of saying:

That's enough for today.

This may depend on what was accomplished, remaining commitments, current time, capacity, what still matters, and what can wait.

Enough should not be calculated purely from task count.

## 49. Leaving things unfinished can be coherent

A successful Today may end with unfinished work.

If capacity drops, Lumi may say:

I'd leave the room. Nothing bad happens if that waits.

That is not failure to complete the plan.

It is successful adaptation to reality.

## 50. Distinguish commitment from aspiration

People frequently overload daily plans because they mix things that actually need to happen with things it would be nice to do.

Today should help preserve this distinction.

Conceptually:

Needs tending.\
If there's room.

The exact labels can evolve.

Everything in the broader model should not become a promise to today's self.

## 51. Avoid the perfect-day fantasy

Today should not encourage users to construct an idealized version of themselves every morning.

Avoid implicitly asking:

What would the maximally disciplined version of you accomplish today?

Instead:

Given the actual day in front of us, what makes sense?

This includes actual capacity, time, obligations, emotional state, and priorities.

## 52. Plans are hypotheses

If Lumi proposes Discussion post → Invoice → Practicum and reality changes, the plan should not become a failed artifact.

A good Today architecture assumes:

Plans are hypotheses about the future.

Reality supplies new information.

Coherence adapts.

## 53. Today should not create overdue debt

Items proposed for Today that do not happen should not automatically become psychologically heavier tomorrow.

Avoid Yesterday: 3 incomplete or 5 overdue as the primary re-entry experience.

Instead, Lumi should reassess:

Does this still matter?\
Does it belong today?\
Should it return to the Library?\
Can it rest?\
Should it be pruned?

An unfinished Today item is not automatically tomorrow's failure.

## 54. Carryover should be intentional

Some things genuinely need to carry forward.

But carryover should result from renewed relevance, not database inertia.

If something remains important, Lumi can surface it again.

If it no longer fits, it can recede.

If it keeps returning, that pattern itself becomes useful information.

## 55. Repeated deferral is a signal, not a score

Repeated deferral may indicate initiation difficulty, unclear scope, emotional resistance, poor timing, incorrect priority, insufficient capacity, or an unnecessary commitment.

Lumi should interpret the pattern contextually.

Avoid Deferred 6× as a shaming foreground metric.

Prefer:

This keeps coming back. Want to figure out what's happening with it?

## 56. Today should work without a morning planning ritual

The user should not need to set up their day before Today becomes useful.

Coherence should prepare an initial interpretation automatically from existing context.

The user may open Today and find:

Here's what I'm thinking.

They can accept, change, or ignore it.

Mandatory planning rituals recreate the maintenance burden Coherence is designed to reduce.

## 57. Today should work whenever it is opened

The Garden is not only a morning experience.

A user may open it at 7 AM, noon, 4:30 PM, or 10 PM.

The interpretation should respond to the actual remaining day.

At 10 PM, Lumi may say:

At this point I'd only deal with the email. Everything else can wait until tomorrow.

Today means the day as it exists now, not the plan generated this morning.

## 58. Today should understand transitions

Sometimes the problem is not doing the next Action. It is moving between contexts.

Examples include finishing work and beginning school, leaving for an appointment, returning after lunch, or shifting from administrative to creative work.

Lumi may help with these transitions:

You've got twenty minutes before you need to leave. I wouldn't start the paper. Want to knock out the email?

## 59. Temporal landmarks should remain quiet

Fixed events can appear as subtle landmarks:

Later — Practicum · 5:00 PM.

The interface does not need to become a full calendar.

The purpose is to help the user orient to what the day has room for.

## 60. The Garden should not duplicate Lists

If the user wants to survey everything in School, Work, Personal, or Later, they should go to the Library.

Today should not become another place where the same lists appear with different filtering.

Library asks: What am I carrying?

Garden asks: What deserves tending today?

## 61. The Garden should not duplicate the Study

Today should not become a Focus interface.

Its job is selection and orientation.

Once the user commits attention, the Study can take over.

The Garden asks: What?

The Study asks: How do we stay with it?

## 62. The Garden should not duplicate Home

Home is where the user can arrive without structure.

The Garden is more opinionated.

Home can hold:

I don't know what I'm doing.

The Garden attempts to answer:

Here's what seems worth tending.

Today should remain useful without requiring conversation first.

## 63. Environmental interaction should remain optional

A user should be able to use Today efficiently without engaging deeply with the Garden metaphor.

Open Today → see Right Now → Start.

Another user may enjoy noticing environmental growth, watching Lumi wander, exploring established areas, or seeing subtle changes over time.

Both are valid.

The environmental layer should reward attention with meaning, not demand attention for functionality.

## 64. The Garden should reward return with familiarity

The Garden's emotional value should come partly from familiarity.

The user learns where Lumi tends to stand, the shape of the path, the distant landscape, small recurring details, and how the environment changes.

Returning can carry a subtle feeling of:

I'm back here.

## 65. Environmental change should be slow

Coherence should avoid constant novelty.

A Garden that changes dramatically every day will feel generated rather than inhabited.

Meaningful development should occur slowly enough that the user notices occasionally rather than the system announcing every change.

Subtle accumulated change better supports nostalgia and attachment.

## 66. Seasonal variation may eventually be appropriate

The Garden may eventually respond subtly to seasons, time of day, accumulated use, or local context.

The purpose would be continuity and inhabitation, not decorative novelty.

Any variation should preserve familiarity.

The Garden should remain recognizably the user's Garden.

## 67. Avoid reward loops disguised as environmental design

Even without explicit points, environmental design can accidentally become gamification.

Every Focus session makes a plant grow is still essentially an XP system.

Ask:

Would this environmental change make sense as accumulated history even if the user never knew what behaviour caused it?

If yes, it may fit.

If users begin completing tasks primarily to trigger environmental rewards, the design has moved too far toward gamification.

## 68. The Garden should represent care, not moral virtue

Gardening language can accidentally imply that a well-tended life is a good life.

Coherence should avoid moralizing organization.

The Garden is a metaphor for attention, not personal worth.

A messy period of life is not evidence that the user has failed to cultivate themselves properly.

The environment should remain generous toward illness, grief, burnout, distraction, chaos, and disengagement.

## 69. The Garden does not need the user

Avoid language such as:

Your poor plants missed you!

or:

The Garden needs you.

This creates emotional obligation toward the app.

The Garden does not need the user.

Lumi does not need the user.

They exist to support the user.

## 70. The Garden may eventually reflect Threads subtly

One promising future direction is allowing persistent Threads to influence the environment without becoming literal task objects.

Sustained areas of life might gradually correspond to distinct areas or qualities of the Garden.

This could create a sense that:

My life has shape here.

But risks include over-literal mapping, spatial clutter, confusing metaphor, turning categories into permanent identity, and making changes difficult to represent.

This remains exploratory.

## 71. Environmental history could become meaningful

A mature Garden might preserve traces of previous periods.

Not:

Here is the flower you earned by completing your taxes.

But perhaps:

This area feels older.\
That path has become established.\
Something that once occupied attention has become part of the background.

Environmental memory should remain subtle and poetic rather than informationally literal.

## 72. Reflection should be available, not required

At the end of the day, Lumi may occasionally help the user notice what changed, what remains, what can be released, or what should carry forward.

But an evening review should not become required system maintenance.

The user should be able to close Coherence and go to bed.

Lumi can reconstruct tomorrow without demanding a nightly ritual.

## 73. The Garden should degrade gracefully

If AI functionality is temporarily unavailable or context is incomplete, Today should still remain usable.

The interface should support manually selecting something, viewing a few relevant items, moving things, and starting Focus.

Lumi's intelligence makes the Garden substantially better.

The basic product should not become unusable when AI reasoning fails.

## 74. Recommendations should be explainable when useful

Most of the time, Lumi should not explain every prioritization decision.

But if the user asks Why this?, she should be able to answer naturally:

It's due tomorrow, you said yesterday that you wanted it off your plate, and it should fit before practicum.

The Garden's curation should feel intelligent rather than mysterious.

## 75. The user should be able to ask for a different kind of day

Lumi's curation should support natural requests such as:

Give me a really light day.\
I want to get a lot done today.\
I only want to deal with school.\
I don't want to touch work today.\
I have two hours. What matters?\
Can we just clear annoying little things?

These are contextual instructions about how attention should be allocated, not merely filters.

## 76. Today can contain different kinds of tending

Not all useful attention is task completion.

A day may appropriately include doing, deciding, planning, exploring, waiting, reflecting, resting, communicating, beginning, or finishing.

The Garden should not privilege easily measurable Actions over meaningful but less discrete activity.

## 77. The Garden should not turn life into agriculture

The gardening metaphor has limits.

Relationships are not crops. Rest is not fertilizer. Personal development is not a plant-growth mechanic.

The metaphor is strongest when describing attention, cultivation, timing, growth, rest, and selective care.

Outside those areas, plain language is often better.

## 78. The Garden is an attention environment

The deepest functional interpretation of Today is not daily task planner.

It is:

an environment for deciding what deserves cognitive foreground today.

Its job is to mediate between the complexity of the user's life and the limited bandwidth of present attention.

The broader system may contain enormous complexity.

The Garden should not.

## 79. The Garden should become more accurate, not more complicated

As Lumi learns more about the user, Today should improve through better selection, timing, estimates, understanding of capacity, recognition of avoidance, understanding of what matters, and suppression of irrelevant information.

The interface does not need to become more complex to represent this sophistication.

The smarter Lumi becomes, the simpler Today should feel.

## 80. Personalization should primarily change judgment

Many products express personalization through themes, widgets, layouts, and configurable dashboards.

The most valuable personalization in the Garden should be judgment.

Lumi learns what the user considers important, what fits their capacity, what kinds of work pair well together, what causes initiation difficulty, when something can safely wait, how much structure the user prefers, when to challenge, and when to simplify.

The Garden becomes personal because its curation increasingly feels like:

Yes. That's about right.

## 81. Capacity awareness should not become a daily questionnaire

Avoid turning Today into Energy 1–10, Mood 1–10, Focus 1–10, Motivation 1–10.

Lumi can ask lightweight questions when they materially improve the plan.

She may also learn from conversation, behaviour, available time, and recent activity without pretending to know more than she does.

## 82. Lumi should be cautious about inferred capacity

There is a difference between the user saying they are exhausted and Lumi inferring low capacity because little has been completed.

Low output does not necessarily imply low capacity.

It could reflect interruption, avoidance, different priorities, external circumstances, or work happening outside Coherence.

Capacity inference should rely on meaningful contextual signals rather than productivity metrics.

## 83. Attention should be negotiated, not dictated

The Garden represents collaboration between what the user explicitly wants, what Lumi understands, what circumstances require, and what capacity allows.

Today should feel neither fully manual nor fully automated.

The interaction is closer to:

Lumi: Here's what I'm thinking.\
User: Move that down.\
Lumi: Yep. Then I'd start here.

## 84. Manual changes should teach Lumi

When the user changes Today, the system should treat that as information.

But learning should remain cautious.

A single rearrangement should not become a permanent rule.

An individual rearrangement is contextual evidence, not automatically a permanent rule. Explicit user instructions remain authoritative within their stated scope; learning must not weaken a request such as “Do not foreground this today.”

## 85. Preserve user priority and Lumi recommendation separately

The system should be able to know:

The user explicitly ranked this highly.

and:

Lumi is currently recommending something else because of context.

This allows Lumi to say:

I know the paper matters more overall, but the insurance thing expires today. I'd knock that out first.

This is more intelligent than sorting everything by one priority value.

## 86. The Garden can surface conflict

Sometimes there is no obviously coherent plan.

Two important deadlines may conflict. Capacity may be insufficient. The user may have overcommitted. Personal and professional priorities may compete.

Lumi should not pretend there is always a clever optimization that makes everything fit.

Sometimes the useful response is:

I don't think all of this fits today.

Then help determine what can move.

## 87. Lumi can protect against overcommitment

Because Lumi sees broader context, she may notice the user adding more to Today than available time or capacity plausibly supports.

She can say:

We can add that, but I think something else needs to move.

This does not prevent the user from adding it.

Lumi proposes. The user decides.

## 88. Today should allow deliberate overflow

There may be days when the user knowingly chooses an ambitious plan.

Coherence should not become paternalistic.

If Lumi says That's a lot for today and the user responds I know; I need to try, the system can accept that.

Capacity-aware does not mean capacity-policing.

## 89. Unfinished work should remain emotionally neutral

Unfinished items should not gradually become red, flashing, increasingly saturated, or covered in warning icons unless there is genuine external consequence.

Visual urgency should represent actual urgency, not moral pressure.

An unfinished intention remains information. It does not become a visual accusation.

## 90. Actual urgency should still be visible

Avoiding guilt does not mean hiding consequences.

If something genuinely expires today, Lumi should communicate that clearly.

The product should distinguish real-world urgency from productivity-system urgency.

## 91. The Garden should support nothing

There may be days when the appropriate plan is extremely small.

There may even be times when Today contains no recommended discretionary work.

The interface should tolerate this gracefully.

Lumi might simply say:

Nothing here needs you right now.

Empty space should be allowed to mean there is space—not that the UI needs another widget.

## 92. The Garden should support days dominated by one thing

Sometimes one Thread genuinely occupies the day.

The Garden does not need to invent additional priorities to create visual balance.

Today may simply say:

This is the day.

Then support breaks, initiation, and return around that one thing.

## 93. The Garden should support fragmented days

Other days may contain appointments, travel, short work windows, and interruptions.

Today should adapt differently.

Instead of deep work, Lumi may surface a ten-minute email, one phone call, or preparation for the next commitment.

The system should reason about usable attention windows, not merely total available hours.

## 94. The Garden should support uncertainty about the day

Sometimes the user does not know what the day will allow.

Today can remain provisional.

Lumi might say:

Let's just deal with this first and see where we're at afterward.

Coherence does not need to predict the entire day in order to help with the next hour.

## 95. The Garden can narrow dynamically

As attention becomes more focused, Today may visually simplify further.

Initial Garden:\
Right Now — Discussion post.\
After That — Invoice.\
Later — Practicum.

Once the user commits to the discussion post, secondary information may recede further and the Study can take over.

This creates a natural progression:

orientation → selection → attention.

## 96. Returning from the Study should update Today

When a Focus session ends, the Garden should understand what happened.

Possible outcomes include completed, made progress, blocked, needs another session, discovered a new Action, or changed priority.

Lumi can use this to revise the remaining day.

The transition should feel continuous.

## 97. The Garden should support returning after distraction

The user may leave Coherence and return later.

Today should help answer:

Where were we?

The current foreground may still be appropriate, or enough time may have passed that Lumi should reassess.

Continuity should not mean blindly freezing the earlier plan.

## 98. Today should be resilient to external action

The user may complete something outside Coherence without marking it complete.

Correction should be easy:

Oh, I already did that.

Great. I'll clear it.

The system should not make state correction cumbersome.

## 99. Connected services should feed context, not dominate the Garden

Future integrations may include calendars, email, reminders, school systems, and other task sources.

These should help Lumi understand the user's world.

They should not automatically dump external information into Today.

A connected calendar with twelve events does not mean twelve cards should appear in the Garden.

Integration increases what Lumi knows.

The same principle remains:

Show less than you know.

## 100. The Garden should remain useful without integrations

Coherence should not require an elaborate connected ecosystem before Today becomes intelligent.

Conversation, manual ordering, existing state, and lightweight user context should already provide substantial value.

Integrations deepen understanding. They should not be prerequisites for basic coherence.

## 101. The Garden is not an analytics surface

Avoid filling Today with tasks completed, Focus minutes, productivity trends, weekly charts, streaks, and completion percentages.

These answer:

How productive have I been?

The Garden answers:

What deserves attention now?

## 102. The Garden is not a motivational surface

Do not decorate Today with inspirational productivity copy, even when the statements align with the philosophy.

The user does not need Coherence to continually announce its worldview.

They should experience the worldview through the product's behaviour.

## 103. Lumi supplies warmth

Today can remain visually and verbally restrained because Lumi exists.

Warmth comes from how she greets the user, what she remembers, what she chooses not to surface, how she reacts to resistance, humour, familiarity, quiet presence, and appropriate challenge.

The Garden does not need inspirational copy or decorative sentimentality to feel human.

## 104. Copy should be plain and contextual

Prefer:

You've got practicum at 5\. I'd deal with the discussion post first.

over:

Let's nurture your priorities and create space for what matters most.

Prefer:

I'd leave that for tomorrow.

over:

Give yourself permission to let this intention rest.

The metaphor can influence language occasionally. It should not make Lumi speak like a gardening-themed wellness coach.

## 105. Tending is one of the stronger metaphorical terms

Of the Garden vocabulary, tending is especially aligned with Coherence.

It communicates attention, care, continuation, non-completion, and appropriate effort without requiring a literal gardening mechanic.

What needs tending today? may therefore be appropriate in some contexts.

Even this should not need to appear constantly.

## 106. Environmental beauty should create invitation, not obligation

The Garden should be somewhere the user enjoys returning to.

Its beauty can support calm, curiosity, familiarity, contemplation, and gentle attachment.

But the environment should never communicate:

You should spend more time here.

The successful Garden often helps the user decide what matters and then leave.

## 107. The Garden's success is not measured by engagement

Useful questions include:

Did the user understand what to do next?\
Did the recommendation feel appropriate?\
Did Today reduce planning effort?\
Did the user successfully re-enter after interruption?\
Did the user feel less overwhelmed?\
Did the selected Action lead naturally into action?

Time spent looking at the Garden is not inherently positive.

A ten-second visit that creates clarity may be more successful than a twenty-minute planning session.

## 108. Reduce planning about planning

One common productivity failure mode is planning becoming the activity.

The user reorganizes, reprioritizes, adjusts categories, reviews schedules, changes tools, and then has less capacity left to act.

The Garden should deliberately reduce opportunities for endless daily optimization.

When the plan is good enough:

Start.

## 109. Today should support imperfect information

Lumi will sometimes make recommendations with incomplete context.

The system should not require perfect knowledge before being useful.

A reasonable recommendation can be framed as provisional:

Based on what I've got, I'd start here.

The architecture should prefer useful + revisable over perfectly informed but burdensome.

## 110. The Garden should build trust gradually

For AI curation to genuinely reduce executive burden, the user needs to trust that Lumi remembers important things, does not hide consequential deadlines, understands corrections, does not keep resurfacing irrelevant items, and is not secretly optimizing toward generic productivity.

That trust develops through repeated good judgment.

The Garden should not ask the user to surrender control before earning it.

## 111. User override should not damage future usefulness

If the user says:

Ignore your plan. I'm working on Coherence all day.

Lumi should adapt.

Manually overriding Today should not destroy underlying priority information unless the user intended to change it.

The architecture should distinguish a Today-specific choice from a durable priority change.

## 112. Today-specific state should be lightweight

The Garden may need temporary state such as current foreground, proposed next Action, today's capacity, today's intentional exclusions, current sequence, and temporary attention decisions.

This state should not automatically become permanent metadata.

I don't want to work on School today does not necessarily mean School is globally low priority.

Temporal scope matters.

## 113. Lumi should understand not today

Not today is a meaningful state.

It does not necessarily mean low priority, abandoned, deferred to tomorrow, or unimportant.

It means:

Do not put this in my cognitive foreground today.

That instruction should be respected without requiring precise rescheduling.

## 114. The Garden should support rest at multiple scales

A user may want not today, not this week, or I'm putting this project down for a while.

These should affect foregrounding differently.

The Garden can translate temporary rest into appropriate broader state without forcing exact dates when none are meaningful.

## 115. Tomorrow should not simply inherit Today

At the start of a new day, Lumi should reconsider the foreground.

Yesterday's unfinished plan is evidence. It is not today's plan.

Tomorrow's Garden should emerge from current state, remaining commitments, new temporal context, changed capacity, unfinished work, and relevant history rather than copying unfinished items forward.

## 116. Today should have memory without baggage

The Garden should remember enough about yesterday to be intelligent.

For example:

You made good progress on the paper yesterday. I'd pick it back up while the context is still fresh.

or:

We tried that yesterday and it wasn't happening. Want to approach it differently?

History should inform assistance, not become judgment.

## 117. There are multiple kinds of successful day

A successful day may be deep work, administrative clearing, maintenance, recovery, exploration, transition, or relational attention.

Coherence should not privilege one simply because it produces more checkmarks.

## 118. Preserve qualitative judgment

AI systems often gravitate toward what can be quantified.

The Garden should preserve qualitative reasoning.

For example:

This conversation with your supervisor seems more important than finishing another small task.

or:

You've been thinking about this idea all week. I actually think giving it an hour today makes sense.

These judgments depend on context and meaning.

## 119. The Garden should become a place of orientation

Over time, opening Today should create a learned expectation:

I don't have to figure out everything.

I can come here and see what matters now.

That expectation may itself reduce initiation burden.

## 120. Emotional objective

Before opening Today:

There are too many things.\
I don't know what matters.\
I don't know where to begin.\
Everything feels equally present.

After opening Today:

Okay.\
That's the thing.\
The rest can wait.

That transition is one of the clearest measures of whether the Garden is working.

## 121. Cognitive objective

The Garden should reduce the number of things the user must simultaneously remember, compare, evaluate, prioritize, schedule, suppress, and initiate.

Lumi carries more of that work.

The user's cognitive task becomes smaller:

Do I want to tend this now?

If yes: begin.

If no: adapt.

## 122. Architectural objective

The Garden is a projection and compression layer over Coherence's broader model.

It should not become a second source of truth.

Conceptually:

Threads / Intentions / Actions / Commitments / Context\
↓\
attention-selection reasoning\
↓\
Today / Garden\
↓\
current foreground\
↓\
Study / action

Today-specific state may influence the broader model where appropriate, but the Garden itself remains temporary.

## 123. Environmental objective

The Garden should make this attention model feel less mechanical.

The user is not operating a prioritization algorithm.

They are entering a familiar place and considering:

What needs tending?

Over time the environment becomes established and Lumi inhabits it, but its purpose remains:

This is where the complexity of life becomes a manageable field of attention.

## 124. Trust in containment must be earned

Containment only works if the user trusts Lumi not to suppress something consequential.

The system must become reliable about deadlines, fixed commitments, explicitly important items, user corrections, temporal changes, and things the user has deliberately foregrounded.

If Lumi repeatedly misses important things, the user will compensate by mentally holding everything again.

At that point the Garden has failed even if its recommendations are usually reasonable.

The system must be dependable enough that the user can safely stop monitoring the system.

## 125. The Garden should not create false certainty

Trust does not require Lumi to pretend she knows everything.

If context is incomplete:

Based on what I've got, this is where I'd start.

If two priorities genuinely conflict:

I'm not sure there's an obvious winner here.

The goal is trustworthy judgment, not artificial certainty.

## 126. The Garden can sometimes ask before curating

Most days should not require a planning interview.

But occasionally one high-value question may dramatically improve the plan.

For example:

You've got a lot competing today. How much have we got?

or:

Is the paper or the practicum paperwork more important to you today?

One good question can be preferable to elaborate inference.

## 127. Questions themselves have cognitive cost

Every question Lumi asks creates work for the user.

Avoid conversational habits such as:

What would you like to prioritize?\
How are you feeling about your workload?\
Which task feels most important?

when Lumi already has enough context to make a useful proposal.

The AI should not disguise decision transfer as supportive conversation.

Prefer:

I'd start with the practicum paperwork. It's the only thing with a real deadline today.

Then let the user disagree.

## 128. Make meaningful trade-offs visible

The Garden reduces decisions, but it should not hide real trade-offs.

For example:

If we do the paper this morning, the insurance call probably moves to tomorrow.

The user can then decide whether that is acceptable.

Coherence should reduce unnecessary decisions while preserving decisions that genuinely belong to the user.

## 129. Understand dependencies

Sometimes the best next Action is not the most important thing. It is the thing that unlocks something important.

Email supervisor may be a five-minute Action blocking Finalize practicum schedule.

Lumi should eventually recognize these relationships.

## 130. Small Actions can create disproportionate coherence

A useful Garden should sometimes prioritize an apparently minor Action because completing it reduces substantial cognitive noise.

Examples include sending the email everyone is waiting on, making the appointment, submitting the form, answering a blocking question, or deliberately moving something to Later.

The relevant question is not always What is the biggest task?

It may be:

What Action most reduces fragmentation right now?

## 131. Attention can be restored without completion

Sometimes the important outcome is not finishing something. It is restoring a usable relationship with it.

A user who has avoided a paper may successfully tend it by opening the document, reading the existing draft, figuring out where they got stuck, and writing one paragraph.

The paper remains unfinished, but coherence has increased.

## 132. Orientation is progress

If a vague overwhelming Intention becomes a clear next Action, that is useful work.

Before:

Deal with taxes.

After:

Download Airbnb earnings.

The larger problem remains unresolved, but the Thread is more coherent and actionable.

## 133. The Garden can surface a question instead of a task

Sometimes what deserves attention today is a decision rather than an Action.

For example:

Decide whether you're actually committing to Wednesday office hours.

or:

We need to figure out whether this project is still active before I keep surfacing its tasks.

Today is an attention environment, not merely an Action queue.

## 134. The Garden can surface maintenance of coherence itself

Occasionally the most useful thing may be resolving one meaningful ambiguity in the model.

This is different from routine system maintenance.

The user should not be asked to clean Coherence for its own sake.

But resolving an ambiguity that removes substantial cognitive clutter can itself deserve attention.

## 135. Do not overfit to productivity behaviour

If the user repeatedly chooses easy tasks, Lumi should not automatically conclude that easy tasks are the user's preferred priority.

Behaviour can reflect avoidance, circumstance, capacity, opportunity, preference, or randomness.

Learning from Today requires context.

## 136. User values should outweigh behavioural prediction

As Coherence becomes better at predicting what the user is likely to do, there is a danger of optimizing recommendations toward compliance.

The user may often choose small administrative tasks while actually caring deeply about writing and struggling to initiate it.

A useful companion should understand the difference between what the user tends to do and what the user says matters.

## 137. Lumi should sometimes protect meaningful difficult work

A sophisticated Garden may recognize:

This is harder to start, but it matters more.

Lumi might say:

I know the invoice would be easier, but you've been trying to get back into the paper all week. I'd actually start there today.

The user can disagree.

But Lumi should not always optimize for easiest completion.

## 138. Easy wins should be contextual, not formulaic

Do an easy win first is useful sometimes. It is not a universal productivity rule.

On one day, a quick Action may create momentum. On another, it may become avoidance of the meaningful thing.

Avoid embedding generic productivity advice as permanent algorithmic doctrine.

## 139. Learn intervention effectiveness

Over time, Lumi may learn which kinds of Today interactions actually help this user move.

Perhaps beginning with one easy Action helps on low-capacity mornings. Perhaps breaking down writing helps. Perhaps detailed schedules create resistance. Perhaps body doubling works particularly well for administrative work.

This learning should influence how Lumi supports attention, not merely which tasks she ranks.

## 140. Preserve room for spontaneity

A coherent day is not necessarily a fully planned day.

The user may become interested in something unexpected, follow a creative idea, decide to see someone, spend longer outside, or change priorities because something feels alive.

Coherence should not treat spontaneity as disruption to the plan.

The Garden should preserve enough openness that the user's life can still surprise them.

## 141. Not everything meaningful should enter Coherence

The product should resist totalizing the user's life.

Not every conversation, relationship, hobby, moment of rest, creative impulse, or household activity needs to become represented in the model.

The Garden should help with what benefits from support.

It should not imply that a coherent life is one completely mediated by Coherence.

## 142. The Garden should make itself unnecessary when appropriate

If the user wakes up knowing exactly what they want to do, they should not need to consult Today.

If they open Home and say I'm working on Coherence today, Lumi does not need to force them through a Garden-planning flow.

The Garden exists when orientation is useful. It is not a required ritual.

## 143. The Garden should support direct entry

Conversely, some users may want to open Coherence directly into Today.

That should be possible without first talking to Lumi.

The Garden should stand on its own as an immediately understandable surface.

Lumi's intelligence is embedded in its curation even when no conversation occurs.

## 144. The Garden and Lumi should feel integrated

Avoid the pattern:

static productivity dashboard + chatbot panel on the side.

Lumi's understanding should shape what appears, what disappears, ordering, copy, capacity adaptation, re-entry, interactions, and transitions.

The AI is not an add-on to Today.

The Garden itself is one expression of Lumi's understanding.

## 145. Do not expose AI machinery unnecessarily

The user does not need to see AI confidence 0.82, recommendation weights, or context-source counts during ordinary use.

Natural explanation is preferable:

I'd do this first because it's due today and should only take ten minutes.

The intelligence should be legible without becoming technical.

## 146. Accessibility must survive the metaphor

Environmental richness, drag interactions, animation, and visual hierarchy should never become the only way to understand or operate Today.

Important interactions should remain accessible through clear text, keyboard navigation, non-drag alternatives, sufficient contrast, understandable controls, reduced-motion support, and semantic structure.

## 147. Reduced motion should preserve presence

If the user prefers reduced motion, Lumi does not need to disappear and the Garden does not need to become visually dead.

Presence can remain through static posture changes, restrained environmental differences, text, and interaction.

Animation should enhance inhabitation, not be required for understanding.

## 148. Mobile should preserve hierarchy, not desktop scenery

The Garden may eventually have a rich desktop environment.

On smaller screens, the priority is preserving:

Right Now\
↓\
After That\
↓\
Later

and Lumi's presence.

Do not squeeze the entire environmental composition into a miniature desktop.

The spatial metaphor may become more suggestive on mobile while the cognitive model remains intact.

## 149. The Garden should remain fast

Environmental assets, Lumi animation, AI curation, and contextual reasoning must not make Today slow to enter.

The first useful state should appear quickly.

If AI curation needs additional time, the interface can show the last valid state or minimal orientation and progressively update.

A calm interface that makes the user wait is still friction.

## 150. Lumi should not recalculate visibly without reason

If Today constantly rearranges itself while the user looks at it, the Garden will feel unstable.

Contextual adaptation should generally occur at meaningful moments: opening Today, completing something, changing capacity, receiving consequential new information, user request, or returning after meaningful elapsed time.

The user should not feel that the ground beneath their priorities is continuously shifting.

## 151. Changes should preserve orientation

When Lumi updates Today, the user should understand what changed.

For larger changes she may say:

Since that meeting moved, I'd change the afternoon a bit.

This prevents intelligent adaptation from feeling arbitrary.

## 152. Today should have a stable visual grammar

Although contents change, the basic hierarchy should become familiar.

The user should learn where to look for what matters now, what comes next, fixed later commitments, Lumi, and the option to change the plan.

Consistency reduces cognitive load.

Environmental growth should not destabilize this grammar.

## 153. The Garden should be calmer than the user's internal state

When someone arrives overwhelmed, the interface should not mirror their overwhelm back at them.

It should perform transformation:

fragmentation\
↓\
selection\
↓\
orientation

The Garden is not a visualization of everything in the user's head.

It is a calmer interpretation of it.

## 154. The Garden should work even without aesthetic attachment

The environmental concept may become beautiful.

But the product should still work for someone who does not care about gardens, antique books, environmental storytelling, or Lumi's animations.

The underlying experience must remain strong:

intelligent curation + low cognitive load + easy correction + natural initiation.

Aesthetic attachment deepens the product. It cannot substitute for usefulness.

## 155. The Garden should be allowed to evolve

This document defines principles, not a frozen UI.

The eventual Today interface may differ significantly from current mockups.

Possible implementations might include a path, cards, spatial environmental interaction, conversational curation, subtle timeline elements, or combinations of these.

The implementation may change.

The underlying experience should remain:

The broader complexity of the user's life is compressed into a manageable, revisable answer to what deserves attention today.

## 156. What Today / Garden is not

The Garden is not:

A daily to-do list with flowers around it.\
A dashboard.\
A calendar replacement.\
A productivity scorecard.\
A gamified task garden.\
A place where every open task appears.\
A rigid daily schedule.\
A morning planning ritual the user must maintain.\
A system for maximizing the amount accomplished today.\
A motivational surface.\
A promise that today's plan will happen exactly as predicted.

It is:

A capacity-aware attention environment where Lumi helps the user decide what deserves tending now, keeps everything else safely in the background, and makes it easy to begin or change course.

## 157. Core experience test

When reviewing Today, ask:

Can an overwhelmed user understand what matters within roughly one second?

Is one thing clearly more important than everything else on the screen?

Is the system showing information because it is relevant now, or merely because it knows it?

Does Lumi's curation reduce the number of decisions the user must make?

Can the user disagree easily?

Does resistance change the plan rather than create failure?

Does capacity materially change what is proposed?

Can something be allowed to rest without becoming overdue debt?

Does unfinished work get reconsidered rather than blindly carried forward?

Does the Garden preserve actual urgency without manufacturing productivity urgency?

Does the user trust that hidden things have not been forgotten?

Does the page help the user stop mentally scanning everything else?

Does environmental richness represent continuity rather than achievement?

Could the user disappear for three weeks and return without punishment?

Is Lumi present without becoming distracting?

Is the Garden helping the user start, or encouraging more planning?

Can the user leave quickly once they know what to do?

And most importantly:

Does the user feel like they have fewer things to hold after opening Today than they did before?

If not, the Garden is not doing its job.

## 158. The Garden in one sentence

The Garden is where Lumi transforms the complexity of the user's active life into a small, humane, capacity-aware answer to the question:

What needs tending today?
