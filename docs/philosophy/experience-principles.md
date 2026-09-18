# Coherence — Product Experience Principles

*Shared definitions and the approved 2026-09-13 reconciliation: [Shared model and terminology](../product/shared-model.md). Examples illustrate principles; implementation and delivery scope remain separately documented.*

*Canonical. Written by Chanté, added 2026-09-12. Formatted as Markdown, substance unchanged. The source trailed off at the end of §24 ("It may simply not belong in"); Chanté confirmed on 2026-09-13 that it means simply "It may simply not belong." Companion to [`product-vision.md`](product-vision.md).*

## Purpose

This document translates the foundational philosophy of Coherence into practical principles for product, UX, AI, and interaction design.

The companion document, `product-vision.md`, describes **why** Coherence exists.

This document describes **how** Coherence should behave because of that philosophy.

These principles should be actively consulted when designing or reviewing:

- screens
- workflows
- AI behaviour
- task interactions
- notifications
- navigation
- onboarding
- planning
- focus sessions
- memory/context features
- prioritization
- re-entry experiences

They are not rigid UI specifications. Implementations may change substantially while still respecting them.

The relevant question is:

> Does the experience preserve the principle?

---

## 1. The system does the organizing

**Principle**

Whenever Coherence can reasonably carry organizational work for the user, it should.

The user should not become the administrator of their productivity system.

**Why**

Capturing, sorting, categorizing, prioritizing, reviewing, rescheduling, and cleaning up information all consume executive function.

A system intended to reduce executive-function burden should not unnecessarily transfer those responsibilities back onto the user.

**In practice**

If a user tells Lumi:

> I need to finish my paper, send Richard that email, get groceries, and deal with my insurance.

Lumi should be capable of inferring useful structure.

The user should not first have to:

- open four forms
- choose four categories
- assign four priorities
- select four projects
- decide four due dates

Lumi can propose the organization.

The user can correct it.

**Watch for**

- mandatory tagging
- elaborate task creation forms
- required project hierarchies
- inboxes requiring regular manual processing
- configuration before usefulness
- organizational systems that deteriorate unless continuously maintained

## 2. Show less than you know

**Principle**

Coherence should not display information simply because the system has it.

Show the information useful for the user's current decision.

**Why**

Organized information still requires interpretation.

A perfectly organized list of twenty tasks can still leave the user responsible for deciding which of twenty things deserves attention.

That is executive work.

**In practice**

Coherence may know:

- 47 open tasks
- 8 projects
- 4 upcoming deadlines
- 3 appointments
- 2 things the user has been avoiding

Today may still show:

> **Right now:** Finish discussion post.

with only quiet indications of what comes afterward.

The rest remains available without demanding immediate attention.

**Watch for**

- dashboards of metrics — counts, progress, scores, streaks. *(Narrowed 2026-09-18, Chanté's [decision](../living/decisions.md): state and shape at a glance — where things stand, how full the day is, when a rhythm happened — are allowed; judgement is not. It read "dashboards".)*
- widget accumulation
- badge counts
- dense metadata
- simultaneous competing calls to action
- displaying information "because users might want it"

## 3. One decision at a time

**Principle**

Whenever possible, reduce complex productivity states to the next meaningful decision.

**Why**

Overwhelm often comes not from the amount of work itself but from simultaneously holding too many unresolved choices.

**In practice**

Instead of:

> What do you want to work on?

followed by twelve tasks, Lumi may say:

> I think the discussion post makes the most sense first. Want to start there?

The user now has one decision:

> Yes / Not this.

If they choose "Not this," the next useful decision can emerge from that response.

**Watch for**

- choice overload
- menus masquerading as assistance
- asking the user questions Lumi could reasonably answer
- requiring several planning decisions before action can begin

## 4. Progressive disclosure over dashboards

**Principle**

Information should become visible as it becomes relevant.

Do not make users process the entire system at once.

**Why**

Coherence should feel quieter after opening it, not busier.

**In practice**

Today might reveal:

> Right Now

then:

> After That

then:

> Later

rather than presenting the complete day with equal visual weight.

Detailed task metadata can remain behind expansion.

Full lists live in Lists rather than appearing everywhere.

**Watch for**

- "at-a-glance" screens that require extensive scanning
- putting calendar, tasks, analytics, timers, notes, habits, weather, quotes, and progress on one page
- filling visual space because it exists

## 5. Lumi proposes; the user decides

**Principle**

AI should reduce decision burden without assuming authority over the user's life.

**Why**

Lumi can infer urgency, patterns, dependencies, and likely priorities.

Lumi cannot determine what ultimately matters to the user.

**In practice**

Prefer:

> Here's how I'd order these.

over:

> This is the correct priority.

Prefer:

> This seems worth doing first.

over:

> You should do this first.

Allow users to easily:

- reorder
- reject
- defer
- recategorize
- abandon
- correct

Lumi should learn from these corrections.

**Watch for**

- overly authoritative AI
- invisible prioritization logic
- recommendations that are difficult to override
- treating deadlines as equivalent to importance
- AI optimizing toward completion regardless of user values

## 6. Correction should be easier than configuration

**Principle**

It should usually be easier for the user to correct Lumi than to configure the system in advance.

**Why**

AI gives Coherence the ability to make useful first guesses.

Requiring users to configure every rule before the system can help recreates the maintenance burden Coherence is intended to remove.

**In practice**

Lumi categorizes:

> Renew insurance → Personal

If that's wrong, the user drags it to another category.

Lumi proposes an ordering.

The user drags something higher.

These corrections become useful context.

**Watch for**

- preference screens for behaviour Lumi could learn
- excessive onboarding questions
- rule builders
- requiring perfect metadata before AI can act

## 7. Resistance changes the plan

**Principle**

When the user resists a proposed action, treat that resistance as information.

Do not treat it as failure.

**Why**

"I can't do this" may mean many different things:

- too large
- unclear
- emotionally difficult
- boring
- low capacity
- wrong priority
- missing dependency
- poor timing
- simple activation difficulty

Pushing the same recommendation harder does not resolve those differences.

**In practice**

A primary task might offer:

> Start with Lumi
> Not this

Choosing "Not this" could lead to:

> Fair. What's getting in the way?

Possible lightweight responses:

- Too big
- Too tired
- Don't know how
- Something else matters more
- Just nope

The plan adapts accordingly.

**Watch for**

- failure states
- guilt
- repeated prompting toward the same rejected task
- assuming avoidance always means the user needs more motivation

## 8. Design for return, not perfect continuity

**Principle**

Every important workflow should assume the user may disappear.

Returning should be inexpensive.

**Why**

Human attention and routines are discontinuous.

Systems that work only when maintained consistently become increasingly difficult to return to after disruption.

**In practice**

If someone returns after two weeks, don't lead with:

> 38 overdue tasks.

Lumi might instead say:

> Hey. It's been a minute. Want me to figure out what's still relevant?

The system helps reconstruct the present.

This principle applies at smaller scales too.

If someone leaves halfway through a focus session, Coherence should help answer:

> Where were we?

**Watch for**

- stale plans presented as current
- accumulating overdue states
- broken streaks
- workflows that require cleanup before reuse
- assuming uninterrupted sessions

## 9. Capacity changes the plan

**Principle**

Available capacity is part of the planning context.

The interface and recommendations should respond to it.

**Why**

A plan appropriate for a high-capacity morning may be absurd on an exhausted evening.

Treating both states identically creates unnecessary failure.

**In practice**

Lumi may occasionally ask:

> How much have we got today?
> Not much · Normal-ish · Lots

A low-capacity response should make the plan smaller, not more alarming.

Perhaps:

> One important thing
> One easy win
> One fixed commitment
> Everything else can wait.

**Watch for**

- static daily expectations
- capacity tracking becoming another obligation
- quantifying mood unnecessarily
- treating reduced plans as inferior plans

## 10. Starting is its own interaction problem

**Principle**

Do not assume that knowing what to do means being able to begin doing it.

**Why**

Task initiation can fail even when planning is complete.

Providing additional planning in that state can increase friction.

**In practice**

If the user says:

> I know I need to write the paper. I just can't start.

Lumi might ask:

> Is the document open?

Then:

> Open it. I'll wait.

Then:

> Read the last thing you wrote.

The next action should sometimes be deliberately smaller than what would conventionally be considered meaningful progress.

Its purpose is to cross the activation threshold.

**Watch for**

- automatically generating elaborate task breakdowns
- mistaking initiation difficulty for lack of information
- requiring planning before starting
- measuring success only through completion

## 11. Presence without interruption

**Principle**

Lumi should be capable of being present without continually demanding attention.

**Why**

Body doubling derives some of its value from presence itself.

Constant interaction would turn support into distraction.

**In practice**

During Focus, Lumi may quietly:

- breathe
- blink
- sway
- read
- sit nearby
- occasionally look up

The user knows Lumi is there.

Lumi intervenes when useful, not because an engagement timer says it is time to speak.

**Watch for**

- excessive check-ins
- conversational noise
- animations that continually pull attention
- notifications designed primarily to increase engagement
- Lumi becoming another thing the user must respond to

## 12. Empty space does work

**Principle**

Whitespace is functional.

Do not fill it merely because additional information could fit.

**Why**

Visual quiet reduces scanning and helps establish hierarchy.

A sparse screen can communicate:

> There is only one thing you need to think about right now.

**In practice**

The primary Today task may occupy a surprisingly large amount of visual space.

That is not wasted space.

It is part of the prioritization system.

**Watch for**

- adding widgets to "balance" layouts
- decorative cards
- dense sidebars
- unused-space anxiety
- equating information density with usefulness

## 13. Warmth through behaviour, not slogans

**Principle**

Coherence should feel warm because of how it treats the user.

Not because it repeatedly tells them inspirational things.

**Why**

Generic motivational language can feel artificial, patronizing, or aesthetically disconnected from the product.

**In practice**

Warmth comes from Lumi:

- remembering where you left off
- noticing when something has been difficult
- making an appropriately dry joke
- sitting quietly during Focus
- welcoming you back without guilt
- knowing when to challenge you
- knowing when to let something go

Avoid decorative copy such as:

> Every small step is progress.
>
> A brighter tomorrow begins today.
>
> You've got this!

unless the specific conversational context genuinely makes such language natural.

**Watch for**

- motivational quotes
- wellness-app language
- excessive reassurance
- forced positivity
- generic encouragement

## 14. Growth reflects history, not achievement

**Principle**

When Coherence visually develops over time, that development should represent accumulated relationship and use—not a reward economy.

**Why**

The emerging environments of Coherence can create a sense of continuity and inhabitation.

Turning them into task-completion rewards would shift the product toward gamification and performance.

**In practice**

A Garden may become established because it has been tended over time.

A Library may expand because the user's life has accumulated more threads, knowledge, and history.

Home may gradually feel more inhabited.

These changes represent:

- continuity
- accumulated context
- history
- relationship

not:

> Complete five tasks to unlock a rose bush.

**Watch for**

- points
- currencies
- unlock requirements
- productivity XP
- completion-based decoration
- visual richness becoming a judgment of how productive the user has been

## 15. Metaphor should clarify behaviour

**Principle**

Environmental metaphors should express the cognitive purpose of a space.

They should not merely decorate conventional productivity screens.

**Why**

Coherence's emerging geography is meaningful because each environment describes a relationship to activity:

- **Home** — arrive and inhabit
- **Garden** — tend
- **Library** — organize and retrieve
- **Study** — attend

The metaphor becomes harmful if it obscures what the user can actually do.

**In practice**

The Garden can influence concepts such as:

- planting an intention
- tending active work
- letting something rest
- pruning something no longer relevant

But users should not need to decipher an elaborate gardening simulation to manage today's tasks.

**Watch for**

- metaphor becoming gimmick
- sacrificing usability for world-building
- literalizing every concept
- decorative scenery with no experiential purpose
- making Coherence feel like a game

## 16. Manual interactions should communicate meaning

**Principle**

When the user directly manipulates something, the interaction should teach Lumi something whenever appropriate.

**Why**

Manual organization is valuable when it expresses judgment rather than administrative maintenance.

**In practice**

In Lists:

- vertical dragging can communicate relative priority.
- horizontal dragging can communicate category.
- Choosing “Not today” communicates that Lumi should stop foregrounding it today. A list move called Later is not automatically the same operation; other rest decisions retain their intended timescale.
- Dropping something onto Lumi might communicate:

> Let's work on this together.

The interaction performs the action and updates the system's understanding simultaneously.

**Watch for**

- drag-and-drop used only as decoration
- requiring manual sorting Lumi could perform
- changes that aren't reflected in AI context
- separating visual organization from system understanding

## 17. The interface should expose confidence appropriately

**Principle**

Distinguish between what the user explicitly told Coherence and what Lumi inferred.

**Why**

AI-maintained organization depends on inference.

Inference is useful precisely because it reduces manual work, but it should not quietly harden into assumed truth.

**In practice**

Lumi may infer:

- category
- urgency
- likely effort
- relationship to a project
- whether something is stale

When confidence is low or consequences matter, Lumi should make the inference easy to inspect or correct.

Not every inference needs a warning label.

The interface should communicate uncertainty in proportion to its importance.

**Watch for**

- invisible consequential assumptions
- constantly asking confirmation for harmless guesses
- treating inferred metadata as user-authored truth

## 18. Preserve continuity across spaces

**Principle**

Home, Today, Lists, Focus, and future spaces should feel like different views into the same understanding of the user's life.

They should not become separate productivity modules.

**Why**

Fragmented tools create fragmented context.

The value of Coherence comes partly from Lumi carrying understanding between activities.

**In practice**

If the user tells Lumi something at Home, it may appear appropriately in Lists.

If they reorder it in Lists, Lumi understands the changed priority at Home.

If Today surfaces it, starting it can move naturally into Focus.

When Focus ends, Lumi knows what happened.

The user should not repeatedly re-explain the same task to different parts of the application.

**Watch for**

- isolated feature state
- separate task models for different screens
- context getting lost during navigation
- users repeatedly supplying information Coherence already has

## 19. The user should not have to understand the system to benefit from it

**Principle**

Coherence can be sophisticated internally while remaining simple externally.

**Why**

The user came to manage their life, not learn our productivity methodology.

**In practice**

Internally, Coherence may eventually reason about:

- priority
- capacity
- deadlines
- dependencies
- avoidance
- recency
- context
- confidence
- behavioural patterns

The user should still be able to say:

> Everything feels like a mess.

and receive useful help.

Advanced users can inspect or directly manipulate more structure when useful.

Understanding that structure should not be a prerequisite for receiving value.

**Watch for**

- teaching the system before using it
- productivity jargon
- complex onboarding
- requiring users to adopt Coherence's vocabulary
- exposing implementation concepts unnecessarily

## 20. Help the user leave

**Principle**

The successful endpoint of a Coherence interaction is often the user no longer needing Coherence.

**Why**

Coherence exists to support engagement with the user's actual life.

Time spent in the application is not inherently valuable.

Engagement is not the goal.

**In practice**

A highly successful interaction might be:

> **User:** What should I do first?
>
> **Lumi:** Send the invoice. It'll take about ten minutes and it's the only thing actually time-sensitive.
>
> **User:** Right.

The user closes Coherence and sends the invoice.

Success.

During Focus, Lumi supports attention rather than trying to create conversation.

When the user has enough momentum, Coherence gets out of the way.

**Watch for**

- engagement metrics becoming product goals
- unnecessary notifications
- infinite feeds
- conversational hooks designed to prolong sessions
- rewards intended to bring users back without functional reason
- features whose primary purpose is increasing time in app

---

## 21. The one-second test

For primary surfaces—especially Home, Today, and Focus—ask:

> Can an overwhelmed user understand what this page is asking of them within roughly one second?

If not, simplify.

This does not mean every feature must be simplistic.

It means the primary hierarchy should be immediately legible.

## 22. The cognitive-load test

Before adding something to a screen, ask:

> Does seeing this right now help the user take their next action?

If not:

- hide it
- defer it
- collapse it
- move it elsewhere
- let Lumi hold it

The fact that information is useful eventually does not make it useful now.

## 23. The maintenance test

Before introducing configuration or recurring user behaviour, ask:

> What happens if the user stops maintaining this for three weeks?

If the answer is:

> The system becomes messy and requires cleanup,

the design needs reconsideration.

Coherence should degrade gracefully.

Where possible, Lumi should help repair stale structure automatically.

## 24. The Coherence test

For meaningful product decisions, ask:

- Does this reduce the executive-function burden of using the system?
- Does it reduce fragmentation?
- Does it preserve user authority?
- Does it adapt to reality rather than enforce an ideal plan?
- Does it make starting easier?
- Does it make returning easier?
- Does it preserve continuity?
- Does it help the user understand what matters now?
- Does it help Lumi carry more context without requiring the user to carry more administration?
- Does it ultimately help the user engage with their life?

If not, the feature may be useful software.

It may simply not belong.
