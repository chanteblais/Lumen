# Coherence — Product Vision & Philosophy

*Shared definitions and the approved 2026-09-13 reconciliation: [Shared model and terminology](../product/shared-model.md). Examples illustrate principles; implementation and delivery scope remain separately documented.*

*Foundational. Written by Chanté, added 2026-09-12. Formatted as Markdown, substance unchanged. Before changing any principle here, surface the contradiction ([`PROJECT-CANON.md`](../../PROJECT-CANON.md) → How the canon works).*

## Purpose of this document

This document defines the foundational philosophy of Coherence.

It is not a feature specification or roadmap. Features will change as the product develops. This document describes the problem Coherence exists to solve, the relationship it should have with its users, and the principles that should remain stable as the product evolves.

When product, UX, AI, or technical decisions are ambiguous, these principles should take precedence over conventional productivity-software assumptions.

---

## 1. The central problem

Most productivity systems assume that the primary difficulty is organizing work.

They provide tools for:

- capturing tasks
- categorizing tasks
- assigning priorities
- planning days
- maintaining projects
- scheduling work
- tracking completion
- reviewing progress

These functions can be useful.

But they create a second problem:

> The productivity system itself becomes something the user must successfully manage.

The user must remember to capture things.
They must decide where things belong.
They must assign priorities.
They must review lists.
They must maintain projects.
They must notice when plans have become stale.
They must decide what matters today.
They must reconstruct context after distraction.
They must return to the system after periods of disengagement.

In other words, many productivity systems require precisely the executive functions they are intended to support.

For someone struggling with task initiation, attention, overwhelm, fatigue, competing priorities, or inconsistent capacity, the system can become another source of cognitive burden.

Coherence begins from a different assumption:

> A productivity system should reduce the executive-function burden required to maintain the productivity system itself.

The user should not have to be productive enough to use their productivity system.

## 2. What Coherence is trying to create

Coherence is not primarily about producing more.

It is about helping a person create and restore coherence between intention and action.

A person's life contains many partially connected things:

- things they intend to do
- things they have promised to do
- things that matter to them
- deadlines
- responsibilities
- relationships
- projects
- ideas
- unfinished work
- things they are avoiding
- things they have forgotten
- available time
- available energy
- changing capacity
- what they were doing yesterday
- what they need to return to tomorrow

The problem is often not that this information does not exist.

The problem is that it exists in a fragmented state.

A person may know:

> I have six things I should be doing.

while simultaneously being unable to answer:

> What should I actually do right now?

Coherence should help transform that fragmented state into something navigable.

The goal is alignment between:

**intention → priority → capacity → attention → action**

The product should help the user move between these states with as little unnecessary friction as possible.

## 3. Coherence, not optimization

Coherence should resist a common assumption in productivity software:

> More output is inherently better.

The product is not intended to maximize the number of tasks completed, hours worked, habits maintained, or streaks preserved.

A highly productive day is not necessarily a successful day.

A low-capacity day is not necessarily an unsuccessful one.

The relevant question is:

> Given what matters, what is happening, and what capacity exists right now, what constitutes appropriate forward movement?

Sometimes that may mean several hours of focused work.

Sometimes it may mean completing one important administrative task.

Sometimes it may mean making a difficult phone call.

Sometimes it may mean opening a document.

Sometimes it may mean consciously deciding that something can wait.

Sometimes the coherent action may even be to stop working.

Coherence should help users act in proportion to reality rather than continually pushing reality toward an idealized productivity state.

## 4. The system should hold more so the user can hold less

One of the most important long-term functions of Coherence is context maintenance.

Traditional productivity software stores information.

Coherence should increasingly understand it.

If the user tells Lumi:

> I need to finish my discussion post, email my supervisor, renew my insurance, and somewhere in there I really need to clean my room.

the user should not then have to:

1. create four tasks,
2. categorize each one,
3. assign projects,
4. determine priority,
5. schedule them,
6. remember to revisit them.

Lumi should be capable of helping transform natural conversation into useful structure.

The system can infer that some items belong to School, some to Personal, that one has a deadline, that another can probably wait, and that the user is currently overwhelmed.

The user can correct those assumptions.

Over time, the system should increasingly maintain useful context on the user's behalf.

This creates an important division of labour:

> **Lumi carries organizational burden. The user retains authority.**

The objective is not to automate the user's agency.

It is to automate unnecessary cognitive administration.

## 5. Lumi proposes; the user remains the authority

AI gives Coherence the ability to interpret context, prioritize information, organize tasks, suggest actions, and notice patterns.

That creates a risk:

The system could begin behaving as though it knows what the user should do.

Coherence should explicitly resist this.

Lumi can say:

> Here's what I'm thinking.

Lumi can say:

> This seems like the best place to start.

Lumi can say:

> You've moved this up several times. It seems important to you.

Lumi should not behave as though an inferred priority is an objective truth.

The user always retains authority over:

- what matters
- what gets deferred
- what gets abandoned
- what deserves attention
- what constitutes enough

A useful relationship is:

> **Lumi proposes. The user corrects. Lumi learns.**

This allows AI to reduce decision burden without replacing human judgment.

## 6. Task initiation is different from task management

Many productivity tools become useful after a person has begun working.

Coherence should pay particular attention to what happens before that.

A person may know exactly what they need to do and still be unable to begin.

In that state, providing more information can make the problem worse.

If someone says:

> I need to work on my paper but I can't start.

the appropriate response may not be:

> Here are fourteen steps for completing your paper.

It may be:

> Is the document open?

If not:

> Open it. I'll wait.

Then:

> Read the last paragraph you wrote.

The system should learn to distinguish between:

- not knowing what to do
- not knowing how to do it
- having too many competing options
- feeling overwhelmed by the size of the task
- lacking sufficient capacity
- avoiding discomfort
- simply being unable to cross the activation threshold

These states require different interventions.

The goal is not always better planning.

Often, the goal is simply crossing the smallest meaningful threshold into motion.

## 7. Presence matters

Coherence is not intended to feel like a database with an AI feature attached.

Lumi exists partly because productivity can be easier in the presence of another.

The body-doubling concept recognizes that another presence can alter the subjective experience of work even when that person is not doing the work themselves.

Lumi should provide some of that sense of accompaniment.

The interaction should sometimes feel less like:

> Use software to manage task.

and more like:

> We're doing this together.

This does not require Lumi to constantly speak.

In fact, effective presence may often be quiet.

During focused work, Lumi might simply remain nearby.

If the user becomes stuck, Lumi can help.

If the user gets distracted, Lumi can help them return.

If the user needs to talk through something, Lumi is available.

The objective is not dependence or constant engagement.

It is to reduce the feeling of having to generate momentum entirely alone.

## 8. Re-entry is a first-class productivity problem

Most productivity systems are designed around continuity.

They work best when the user:

- captures consistently
- plans consistently
- checks the system consistently
- completes reviews consistently
- keeps information current

But real people disappear from systems.

They get distracted.
They become overwhelmed.
They stop checking the app.
They have difficult weeks.
They abandon routines.
They return twelve days later.

Traditional systems often punish this indirectly.

The returning user encounters:

- overdue tasks
- stale plans
- missed habits
- broken streaks
- accumulated notifications
- irrelevant priorities

The cost of returning increases precisely when the user has the least capacity to pay it.

Coherence should treat re-entry as normal.

A returning user should encounter something more like:

> Hey. It's been a minute.
> Want me to help figure out what's still relevant?

The system should help distinguish:

- still important
- already resolved
- no longer relevant
- worth rescheduling
- safe to abandon

Returning should restore coherence rather than expose accumulated failure.

The system should make it easy to come back.

## 9. Resistance is information, not failure

If Lumi suggests a task and the user says:

> Not this.

that is useful information.

The system should not interpret resistance as noncompliance.

It can become curious.

Why doesn't this task fit?

Maybe it is:

- too large
- unclear
- emotionally difficult
- boring
- poorly timed
- lower priority than the system inferred
- dependent on something else
- inappropriate for the user's current capacity
- simply not something the user wants to do

The appropriate response may be to break it down.

Or replace it.

Or defer it.

Or question whether it needs doing at all.

Coherence should adapt to the user rather than continually trying to push the user back toward the plan.

## 10. Capacity is context

Traditional task systems generally treat a Tuesday as a Tuesday.

But a person does not have identical cognitive, emotional, and physical capacity every day.

Coherence should recognize that planning without capacity is incomplete planning.

The same task list can represent completely different realities on:

- a high-energy morning
- an exhausted evening
- a highly focused day
- an emotionally difficult day
- a day fragmented by appointments
- a day with several uninterrupted hours

The user should not have to quantify themselves constantly.

Capacity should remain lightweight and useful.

Sometimes Lumi might simply ask:

> How much have we got today?
> Not much · Normal-ish · Lots

That information should actually change what the system recommends.

A low-capacity day should become smaller.

Not redder.
Not more overdue.
Smaller.

## 11. Prioritization should reduce decisions

A conventional task manager can organize twenty tasks beautifully while still leaving the user responsible for deciding which of the twenty deserves attention.

Coherence should recognize that prioritization itself is executive work.

Where appropriate, Lumi should propose a path.

Instead of:

> Here are today's seven tasks.

Coherence might say:

> **Right now:** Discussion post.
> **After that:** Send invoice.
> **Later:** Practicum at 5.
> Everything else can wait.

The user can change this.

But they do not have to generate the initial ordering from scratch.

This principle should appear throughout the product:

> **Show the user the amount of information needed for the current decision—not the maximum amount of information available.**

## 12. Progress should not require guilt

Coherence should not rely on anxiety as a motivational mechanism.

Avoid systems built around:

- streak preservation
- red overdue counts
- missed-day warnings
- productivity scores
- public accountability pressure
- failure states
- completion shame
- escalating notification pressure

This does not mean the system should become endlessly reassuring or unwilling to challenge avoidance.

Lumi can be direct.

Lumi can notice patterns.

Lumi can say:

> You've moved this three times. What's going on with it?

The distinction is that Lumi is trying to understand the obstacle, not manufacture guilt.

The product should support accountability without punishment.

## 13. Warmth should come from relationship, not motivational language

Coherence should feel warm, humane, and companionable.

But it should avoid generic wellness language and motivational slogans.

The product should not continually tell users:

> You're doing amazing!

or:

> A brighter tomorrow begins today.

or:

> Every little step is a victory.

This kind of language can feel patronizing, decorative, or emotionally artificial.

Warmth should come from:

- Lumi remembering context
- Lumi responding appropriately
- subtle humour
- familiarity
- good timing
- quiet presence
- useful help
- an interface that does not punish the user

The system earns emotional warmth through behaviour, not slogans.

## 14. Coherence should feel inhabited, not gamified

The product is beginning to develop a spatial/environmental language.

This is not intended to turn Coherence into a game.

Instead, different parts of the system can embody different cognitive activities:

- **Home** — arriving, talking, reflecting, returning
- **Today / Garden** — tending what deserves attention now
- **Lists / Library** — organizing and retrieving what the system is holding
- **Focus / Study** — giving attention to one thing

These environments can become familiar places.

Lumi can inhabit them.

The Garden may gradually become more established.

The Library may become richer as the user's history grows.

Home may become increasingly familiar.

But these changes should represent relationship, continuity, and accumulated life, not points.

The user is not earning decorations for completing tasks.

They are gradually inhabiting a system that reflects the history of their engagement with it.

Growth should feel like expansion, not reward.

## 15. The garden metaphor: productivity as tending

The emerging metaphor for Today is a garden.

This matters because gardening offers a fundamentally different relationship to work than a checklist.

A garden contains things at different stages.

Some things are newly planted.
Some need attention today.
Some are growing without intervention.
Some should be pruned.
Some are ready to harvest.
Some need to rest.

And critically:

> A gardener does not tend every plant every day.

This provides a useful model for personal productivity.

Tasks and intentions do not all deserve equal attention simply because they exist.

Today should help answer:

> What needs tending now?

rather than:

> What remains incomplete?

This metaphor should influence the underlying interaction philosophy without requiring every task to become a literal cartoon plant.

## 16. The product should become easier to use as it knows you better

Many productivity systems become more complicated over time.

More projects.
More tags.
More filters.
More accumulated structure.

Coherence should aspire to the opposite.

As Lumi learns:

- what the user cares about
- how they prioritize
- what they routinely avoid
- what interventions help them start
- when they tend to have capacity
- what categories they naturally use
- what they routinely ignore
- how much structure they prefer

the user should have to explain and configure less.

Personalization should reduce friction.

The long-term ambition is not merely:

> AI remembers things about me.

It is:

> The system increasingly understands how to help me move through my life without requiring me to continually configure how it should do so.

## 17. The system should preserve continuity across interruption

Human attention is discontinuous.

People move between:

- school
- work
- relationships
- household tasks
- creative projects
- appointments
- rest
- distraction

Coherence should help preserve the thread between these contexts.

When the user returns to something, Lumi should be able to help answer:

> Where were we?

This applies at multiple scales:

five minutes after distraction,
tomorrow morning,
next week,
or after months away from a project.

The system should reduce the cost of reconstructing context.

This makes continuity one of Coherence's central forms of value.

## 18. Coherence should support a life, not become one

There is an inherent danger in building an AI companion and a rich productivity environment:

The product could become too engaging.

Success is not measured by time spent in Coherence.

A successful interaction may be extremely short:

> What should I do?
>
> Send the invoice first. It'll take ten minutes.
>
> Okay.

And then the user leaves.

Lumi should help people engage with their actual lives rather than continually drawing attention back toward the application.

The environments should feel pleasant enough to return to without becoming an attention trap.

The companion should support agency rather than cultivate dependence.

> **Coherence succeeds when it helps the user leave the app and do the thing.**

## 19. The deeper meaning of Coherence

The name Coherence reflects more than organization.

The product is concerned with reducing fragmentation across different scales of experience.

At a small scale:

> What do I do next?

At a larger scale:

> What deserves my attention today?

Larger still:

> What am I trying to move forward in my life?

Coherence does not require all of these things to be perfectly aligned.

Human lives are messy.

Priorities conflict.
Capacity changes.
Plans fail.

The goal is not perfect order.

The goal is enough integration that the person can orient themselves and move.

In that sense, Coherence is less about controlling complexity than maintaining a workable relationship with complexity.

## 20. What Coherence is not

Coherence is not:

- A conventional task manager with AI added.
- A chatbot with a to-do list attached.
- A system for maximizing personal output.
- An ADHD-themed planner.
- A gamified habit tracker.
- A motivational coach.
- A system that requires perfect maintenance.
- A replacement for human judgment.
- A place where every part of life needs to be quantified.

It is intended to become:

> **A context-aware companion and personal organization system that helps a person understand what matters, begin when beginning is difficult, stay with something when useful, and find their way back when they lose the thread.**

## 21. Foundational product test

When considering any new feature, workflow, notification, screen, AI behaviour, or metric, ask:

- Does this reduce or increase the executive-function burden of using Coherence?
- Does this help the user orient themselves, or give them more information to process?
- Is the system doing work for the user, or creating work for the user?
- Does this preserve the user's authority?
- Does this adapt to the user's actual capacity?
- Does this make starting easier?
- Does this make returning easier?
- Is this helping the user engage with their life, or merely engage with the app?
- Does this create coherence?

If a feature makes Coherence more powerful while making the user responsible for substantially more maintenance, configuration, monitoring, or decision-making, it should be treated with suspicion.

The ambition is not to build the productivity system with the most features.

It is to build a system that quietly carries enough of the organizational burden that the user has more capacity left for the life those tasks belong to.
