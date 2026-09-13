# Coherence — AI & Information Architecture

*Canonical. Written by Chanté, added 2026-09-13. Formatted as Markdown, substance unchanged. It arrived in three pastes, the first of them twice; the duplicate is dropped and the parts are joined where they broke (in §23 and §50). This is the **why** of the AI layer. [`architecture.md`](../architecture.md) and [`domain.md`](../domain.md) are the **how** as built. Where the two differ: [decisions](../living/decisions.md) → *Coherence remembers; Lumi understands*, and [open questions](../living/open-questions.md) 10, 11, 12, 19, 22, 24 and 25. The places it projects into are [Spaces of Coherence](spaces.md).*

---

## Purpose

This document defines the conceptual architecture underlying Coherence's AI, information model, memory, and shared application state.

It describes what the system needs to understand and preserve, rather than prescribing a final database schema, model provider, vector store, agent framework, or implementation technology.

The implementation will evolve.

The conceptual distinctions in this document should remain durable unless product experience demonstrates that they are wrong.

The central architectural objective is:

> **Coherence should become more sophisticated internally so that it can become simpler externally.**

The user should not have to understand the complexity of the system in order to benefit from it.

At the deepest level:

> **Coherence is not building an AI that knows the user's to-do list. It is building an evolving model of what is happening in the user's life, what matters within it, and what deserves attention now.**

## 1. The central architectural idea

Coherence should not be implemented as:

```
chatbot + task database
```

Nor should Lumi's intelligence live primarily inside a growing conversation transcript.

Instead, Coherence should maintain a shared, evolving model of the user's active life that Lumi can understand, update, reason over, and present differently depending on what the user is doing.

Conceptually:

```
Life
  ↓
Evolving model
  ↓
Relevant context
  ↓
Today
  ↓
Now
```

At the interaction level:

```
Conversation / behaviour
  ↓
Interpretation
  ↓
Shared structured state
  ↓
Contextual reasoning
  ↓
Relevant projection into a space
  ↓
User action / correction
  ↓
Shared state updates
```

Home, Garden, Library, and Study are therefore not separate productivity modules.

They are different views into the same underlying understanding.

## 2. Model the user's active life, not merely their tasks

The information architecture should begin from a broader question than:

> *What tasks does this person have?*

Lumi may need to understand:

- ongoing areas of life
- projects
- responsibilities
- relationships
- intentions
- concrete actions
- fixed commitments
- deadlines
- ideas
- questions
- things the user is waiting for
- things they are avoiding
- relevant observations
- current capacity
- what happened previously
- what they were doing before an interruption
- what they have deliberately decided can wait

Some of these things are actionable.

Some are not.

But they may all be relevant to understanding what is happening in the user's life.

The architecture should preserve this richness without exposing it as complexity the user must manually maintain.

## 3. Threads, Intentions, Actions, and Context

A flat `Task` model is too narrow for Coherence.

The system needs to represent several different kinds of things.

These names are working conceptual terms rather than final database entities.

### Thread

A Thread is a persistent subject, domain, project, relationship, question, or area of life that provides context across time.

Examples:

- Practicum
- Coherence
- Taxes
- Moving
- A relationship
- Career transition
- A creative theory or idea
- School
- A house project

A Thread does not necessarily require action.

Its purpose is to preserve continuity and relationships among things that would otherwise appear fragmented.

Threads may become richer over time.

They may contain intentions, actions, commitments, conversations, ideas, history, and related threads.

The Library may eventually become one of the primary places where Threads become visible and retrievable.

### Intention

An Intention represents something the user wants, needs, expects, or means to move toward.

Examples:

- Become established at practicum
- Figure out what I owe in taxes
- Develop Coherence into a usable prototype
- Spend more time writing
- Get the house ready for winter
- Decide whether this project is still worth pursuing

Intentions may initially be vague.

They can become clearer through conversation and action.

An Intention does not need to be immediately reducible to a checkbox.

### Action

An Action is something sufficiently concrete that the user can meaningfully do it.

Examples:

- Email Richard
- Open the practicum reflection
- Download Airbnb earnings
- Register the domain
- Call the insurance company
- Read the last paragraph of the paper

Actions may serve Intentions and belong to Threads.

They may also exist independently.

### Commitments and other contextual objects

The architecture should remain capable of representing information that matters without forcing everything into the Thread → Intention → Action hierarchy.

Examples include:

- fixed appointments
- recurring responsibilities
- deadlines
- waiting states
- ideas
- observations
- preferences
- relevant facts
- unresolved questions
- external dependencies

The purpose of this model is not to create a more elaborate project-management ontology.

It is to give Lumi enough structure to understand the user's life without requiring the user to manually maintain that structure.

## 4. Conversation is an interface, not the database

Natural conversation is one of the primary ways users interact with Coherence.

But conversation itself should not be the only durable representation of what the user has communicated.

If the user says:

> *I need to submit my practicum reflection by Friday.*

the system should not require Lumi to rediscover that fact by rereading an old transcript every time it becomes relevant.

The conversation is evidence of something more durable:

- there is an Action or Intention related to the practicum reflection
- it belongs to a broader practicum Thread
- it has a known deadline
- it is likely related to School
- it is currently unresolved

Coherence should preserve the useful structure that emerges from conversation.

The transcript may remain important for:

- provenance
- nuance
- conversational continuity
- semantic retrieval
- reconstructing meaning
- preserving important history

But the transcript should not be treated as the canonical application state.

## 5. Do not turn every conversation into a task

The inverse problem is equally important.

Not everything the user says should become structured productivity data.

If the user says:

> *I've been thinking about whether I actually want to stay in this field.*

that is not automatically:

```
□ Decide whether to change careers
```

Lumi should distinguish among:

- thoughts
- questions
- ideas
- commitments
- intentions
- actions
- projects
- reflections
- possibilities
- observations

Some information may be worth remembering without becoming actionable.

Some may matter only conversationally.

Some may become part of a Thread.

Some may eventually develop into an Intention.

> **Structure should emerge when structure is useful.**

## 6. Support progressive structuring

Human intentions are often ambiguous.

Examples:

> *Maybe I should look into moving.*

> *I really need to do something about my website.*

> *I want to write more.*

Coherence should not force premature precision.

Something may begin as a thought.

It may become a Thread.

A clearer Intention may emerge.

Concrete Actions may eventually follow.

Conceptually:

```
thought
  ↓
emerging thread or intention
  ↓
clearer intention
  ↓
concrete action
```

The user should not have to formally administer these transitions.

Lumi should help structure things progressively as structure becomes useful.

## 7. State should be richer than Open / Complete

Traditional task systems often reduce work to:

```
Open / Complete
```

Coherence needs a richer understanding.

Potential conceptual states may include:

- emerging
- active
- waiting
- scheduled
- resting
- blocked
- completed
- abandoned
- stale
- archived

These are not necessarily final database enums.

Some may ultimately be inferred states rather than explicit values.

The purpose is to recognize that:

> **Not currently being worked on does not necessarily mean incomplete failure.**

Something may be intentionally resting.

Something may be waiting on another person.

Something may no longer matter.

Something may still be an idea rather than a commitment.

The information architecture should preserve those distinctions.

## 8. Events and change through time

Current state tells Lumi where things are.

Events help Lumi understand how they got there.

Important events may include:

- an intention being expressed
- an action being created
- a priority being changed
- something being deferred
- something being completed
- a Focus session beginning
- a Focus session ending
- the user becoming stuck
- the user returning after an interruption
- a deadline passing
- an item being moved between categories
- Lumi making an inference
- the user correcting that inference
- something becoming stale
- something being archived

Event history should not exist primarily for analytics.

Its value is continuity.

It allows Lumi to distinguish:

> *This task is low on the list.*

from:

> *This task has been moved downward three times.*

And:

> *This task was forgotten.*

from:

> *The user deliberately decided this can wait.*

And:

> *This Focus session lasted twelve minutes.*

from:

> *The user stopped after twelve minutes because they had achieved enough momentum to continue elsewhere.*

State describes the present.

Events preserve meaningful change.

## 9. Distinguish state from history

The system should preserve both:

> **what is true now**

and

> **how we got here**

For example:

**Current state:**

```
Practicum reflection — completed.
```

**History:**

```
created → deferred twice → discussed with Lumi → broken down → Focus session → completed
```

The current interface usually needs the first.

Lumi may occasionally benefit from the second.

This distinction allows Coherence to remain visually simple without losing useful historical context.

## 10. Explicit truth and inferred understanding are different

Coherence will depend heavily on AI inference.

Therefore, the system must distinguish between different epistemic kinds of information.

### Explicit information

Something the user directly communicated.

Example:

> *The assignment is due Friday.*

### Observed information

Something the system directly observed.

Example:

> *The user moved this intention upward three times.*

### Inferred information

Something Lumi concluded from context.

Example:

> *This appears to be high priority.*

### Derived information

Something deterministically calculated.

Example:

> *Friday is two days away.*

These forms of information should not be treated as identical.

Where useful, the system should preserve:

- source
- confidence
- timestamp
- whether the user confirmed it
- whether it has subsequently been contradicted
- supporting observations

This becomes increasingly important as Lumi gains more autonomy.

## 11. Provenance matters

When Coherence believes something, it should ideally be possible to understand why.

For example:

```
Deadline: September 18
Source: user explicitly stated it.

Category: School
Source: inferred from practicum context.

Priority: elevated
Sources: deadline proximity + user manually moved it upward yesterday.
```

This does not mean the UI should expose provenance constantly.

Most of the time, that would create unnecessary cognitive load.

But the underlying system should preserve enough provenance to:

- resolve contradictions
- correct mistakes
- explain consequential recommendations
- update stale information
- distinguish user intent from AI interpretation

## 12. User correction is high-value information

When the user corrects Lumi, that action should do more than change the immediate UI.

It should update the shared model.

Examples:

- The user drags an intention from Work to Personal.
- The user moves something from position 7 to position 1.
- The user says: *No, this isn't actually urgent.*
- The user repeatedly rejects something Lumi keeps surfacing.

These are meaningful signals.

Coherence should interpret correction as:

> **new information about the user's understanding of their own life.**

The system should learn from corrections without overgeneralizing from a single interaction.

## 13. Correction should be easier than configuration

Because Lumi can make useful first guesses, users should usually correct the system rather than configure everything in advance.

The architecture should support:

```
inference
  ↓
easy correction
  ↓
updated understanding
```

rather than:

```
configuration
  ↓
configuration
  ↓
more configuration
  ↓
eventual usefulness
```

This principle should influence both data modelling and AI operations.

## 14. Importance, urgency, priority, and attention are different

Coherence should distinguish among several related concepts.

### Importance

How much something matters.

### Urgency

How time-sensitive something is.

### Priority

Its relative ordering among competing things.

### Attention relevance

Whether it deserves to occupy the user's cognitive foreground right now.

These are not interchangeable.

Something may be deeply important without deserving attention today.

Something may be urgent but trivial.

Something may be high priority but inappropriate for the user's current capacity.

Something may deserve immediate attention because it is the smallest dependency blocking several other things.

The Garden is fundamentally an **attention-selection system**.

Its job is not to display everything important.

Its job is to determine:

> *What deserves tending now?*

The Study compresses this further:

> *What are we attending to right now?*

## 15. Priority is multidimensional

Coherence should avoid treating priority as a single static field.

Something may deserve attention for several different reasons.

Potential signals include:

- explicit user priority
- deadline proximity
- consequence of delay
- dependency relationships
- manual ordering
- recurrence
- current relevance
- estimated effort
- available time
- capacity fit
- emotional importance
- avoidance history
- previous deferrals
- relationship to current goals
- fixed external commitments

These signals can conflict.

For example:

A task may have no deadline but matter deeply.

Another may be urgent but trivial.

Another may be important but inappropriate for the user's current capacity.

Therefore:

> **Priority should be reasoned about contextually rather than stored as a universal truth.**

The architecture may still use numerical or categorical representations internally.

But the product should not reduce priority conceptually to a single number.

## 16. Manual ordering is a first-class signal

The Lists / Library interaction introduces an important form of user-authored priority.

If the user manually drags something higher, that action communicates:

> *This deserves more attention relative to these other things.*

This signal should be preserved.

Lumi may still have reasons to recommend something else.

For example:

> *I know you've got the paper above this, but your insurance renewal is due today. I'd deal with that first.*

That is useful precisely because the system understands both:

> **user-expressed priority**

and

> **contextual urgency**

rather than silently replacing one with the other.

## 17. Capacity is part of context

Capacity should influence recommendations without becoming another elaborate tracking system.

Potential capacity context may include:

- user-stated capacity
- available time
- time of day
- recent Focus activity
- current commitments
- perhaps eventually patterns learned over time

The system may reason:

> *This is important, but it requires two uninterrupted hours and the user has forty minutes.*

or:

> *The user explicitly said they have almost no capacity today. Suggesting three cognitively demanding tasks is inappropriate.*

Capacity is therefore part of selection and planning context.

It should not become a score permanently attached to the user.

## 18. Foregrounding and backgrounding

Intelligent context selection is not only the ability to retrieve relevant information.

It is also the ability to suppress irrelevant information.

This is one of Coherence's central forms of value.

When Lumi says:

> *These three things are enough for today. Everything else can wait.*

the system is performing useful cognitive work by deciding what does not need to occupy the user's attention.

Coherence should therefore reason about both:

- what should enter the foreground
- what can safely remain in the background

The system knowing something does not imply the user needs to see it.

The system remembering something does not imply Lumi should mention it.

The system considering something important does not imply it belongs in Today.

> **Good context selection is partly intelligent omission.**

## 19. Shared state underlies every space

Home, Garden, Library, and Study should operate on shared underlying state.

For example:

At Home, the user says:

> *I need to deal with my insurance this week.*

Lumi interprets this as an Intention or Action connected to the user's Personal context.

It becomes visible in the Library.

Context suggests it is becoming time-sensitive.

The Garden surfaces it tomorrow.

The user selects:

> *Start with Lumi.*

The Study receives the same underlying object and begins a Focus interaction.

The user completes the relevant action.

That state change is reflected everywhere.

When the user returns Home, Lumi already knows:

> *Insurance is dealt with.*

No manual synchronization should be required.

## 20. Spaces are projections, not containers

This distinction should influence implementation.

An intention does not "belong to Today" as a separate copy.

Today is a projection of relevant shared context.

Likewise, Focus should not create its own independent task representation.

Conceptually:

- **Library** — exposes more of the user's broader model
- **Garden** — selects what deserves attention today
- **Study** — selects the current object of attention
- **Home** — provides conversational access to the system without requiring the user to inspect its structure

The same underlying entity may appear differently in each space.

## 21. Information should travel with the user

The user should never repeatedly explain the same thing to different parts of Coherence.

If something is discussed at Home:
it may become structured context in the Library.

If the user changes its priority in the Library:
that should affect what appears in the Garden.

If the Garden identifies it as the current priority:
the user can enter the Study with it.

If work happens in the Study:
Lumi should know that when the user returns Home.

The spaces are not separate tools.

They are different cognitive relationships with the same model.

> **Context travels.**

## 22. Lumi needs relevant context, not all context

As Coherence grows, the system may eventually contain:

- years of conversation
- hundreds or thousands of intentions and actions
- completed projects
- user preferences
- patterns
- archived material
- relationship context
- interaction history
- accumulated Threads

Lumi should not receive all of this on every model invocation.

More context is not automatically better context.

The system needs a **context-selection layer**.

Its job is to answer:

> *What does Lumi need to know for this interaction?*

Potential signals include:

- current space
- current conversation
- active intention
- current day
- recent interactions
- related Threads
- relevant deadlines
- explicit user query
- semantic similarity
- current capacity
- user preferences
- recent Focus state
- attention relevance
- temporal recency

The goal is:

> **minimum sufficient context with high relevance.**

## 23. Context should be assembled deliberately

A future Lumi request might conceptually receive context in layers.

### Stable user context

Longer-lived preferences and relevant working patterns.

### Current state

Today's date, capacity, current commitments, active intention.

### Space context

The user is currently in Home, Garden, Library, or Study.

### Relevant structured context

Threads, Intentions, Actions, commitments, and relationships relevant to the current interaction.

### Recent conversational context

Enough recent dialogue to preserve conversational continuity without treating the entire transcript as working memory.

### Retrieved historical context

Older conversations, events, Threads, or observations that are specifically relevant to what is happening now.

This layered approach should be preferred over simply increasing the model's context window indefinitely.

The objective is not maximum memory retrieval.

It is **appropriate context at the appropriate moment**.

## 24. Memory is not one thing

"Memory" in Coherence will likely consist of several fundamentally different kinds of information.

These should not be collapsed prematurely into a generic memory store.

Potential categories include:

### Working context

What is happening right now.

Examples:

- current conversation
- current Action
- current Focus session
- immediate obstacle
- current capacity

### Application state

The current structured model of the user's active life.

Examples:

- Threads
- Intentions
- Actions
- categories
- deadlines
- commitments
- relationships
- current statuses

### Episodic history

What happened previously.

Examples:

- a Focus session
- a conversation about an intention
- a task being repeatedly deferred
- a decision being made
- a period of disengagement and return

### User preferences

Relatively durable information about how the user prefers to interact.

Examples:

- prefers concise responses during Focus
- responds well to humour
- dislikes excessive encouragement
- tends to prefer manual ordering over numeric priority

### Learned patterns

Tentative observations derived from repeated behaviour.

Examples:

- unclear first steps frequently block initiation
- administrative tasks are easier earlier in the day
- shorter Focus sessions appear more effective

### Semantic knowledge

Ideas, notes, conversations, relationships, and accumulated context that may become relevant through meaning rather than explicit structure.

### Historical state

How Threads, Intentions, projects, and priorities evolved over time.

Different kinds of memory may require different:

- storage
- retrieval
- decay
- confidence
- privacy
- update
- deletion

strategies.

A dedicated memory architecture document may eventually be warranted as the system develops.

## 25. Relevance should change over time

Nothing should remain equally salient forever simply because it once mattered.

Coherence needs a concept of **relevance decay**.

This does not necessarily mean destructive forgetting.

Instead, information can gradually become less likely to enter active context unless reinforced by:

- repetition
- explicit importance
- ongoing relationships
- deadlines
- recent activity
- semantic relevance
- renewed user attention

A preference repeatedly demonstrated over months may strengthen.

A tentative inference made once may weaken.

An abandoned Action may move out of active context while remaining historically retrievable.

A Thread not mentioned for a year may become archival without disappearing.

This prevents Coherence from developing the same problem as poorly maintained productivity systems:

> **Everything that has ever mattered continues mattering forever.**

Forgetting, backgrounding, and archival are therefore part of coherence maintenance.

## 26. Forgetting can be intelligent

A useful memory system is not one that remembers everything equally.

It is one that maintains useful distinctions between:

- active
- potentially relevant
- historical
- archival
- no longer useful

Coherence should become capable of allowing information to recede.

This may happen through:

- lower retrieval probability
- reduced attention relevance
- archival status
- weakening confidence in old inferences
- superseding old information with newer information

Destructive deletion should remain distinct from relevance decay.

The fact that something is no longer useful in active context does not mean it must cease to exist.

## 27. Learned patterns require restraint

One of Coherence's long-term opportunities is allowing Lumi to notice patterns.

For example:

> *You seem to get stuck more often when the first step isn't clear.*

or:

> *Forty-five-minute Focus sessions seem to work better for you than ninety-minute ones.*

or:

> *You've tended to move administrative things earlier once they become time-sensitive.*

These observations can be useful.

They can also become intrusive or confidently wrong.

Therefore learned patterns should ideally have:

- supporting evidence
- confidence
- recency
- opportunities for correction
- mechanisms for weakening or revision

Lumi should not turn three observations into a permanent identity claim.

Prefer:

> *I've noticed this a few times.*

over:

> *You always do this.*

Patterns should remain hypotheses that can become stronger, weaker, or obsolete.

## 28. Lumi reasons across multiple timescales

The user's life exists simultaneously at several temporal scales.

Coherence should be capable of reasoning across them.

### Now

*What should I do next?*

### Today

*What deserves tending?*

### Near-term

*What is approaching over the next several days or weeks?*

### Ongoing

*What active Threads, Intentions, commitments, and relationships currently shape my life?*

### Long-term

*What am I cultivating, becoming, building, or moving toward?*

These scales should influence one another without collapsing together.

A long-term Intention may influence today's priorities.

A deadline tomorrow may temporarily override a larger goal.

A low-capacity day may change what happens now without changing what matters long-term.

Something important to the user's life may deserve no attention today.

Coherence should help maintain alignment across scales while recognizing that perfect alignment is neither possible nor required.

## 29. The Garden is a temporal compression layer

The Garden / Today should not merely query:

```
Actions where due_date = today
```

It represents a contextual compression of the broader model.

It asks:

> *Given what matters, what is approaching, what happened recently, what the user has told us, and what capacity exists today, what deserves attention?*

That selection may include:

- something due today
- something important but not urgent
- something that has been repeatedly avoided
- a small dependency blocking a larger Thread
- a fixed commitment
- something worth deliberately allowing to rest

The Garden therefore sits between the broader life model and immediate action.

Conceptually:

```
broader active life
  ↓
what deserves tending today
  ↓
what deserves attention now
```

This is one of the central compression mechanisms in Coherence.

## 30. The Study is a further compression layer

The Study / Focus compresses context even further.

Once the user has chosen what to attend to, most competing context should disappear.

The Study needs enough information to understand:

- what we're doing
- why it matters when relevant
- where we left off
- the immediate next action
- likely obstacles
- what happened during the session

It does not need to continually surface the rest of the user's life.

This supports a broader architectural principle:

> **Different spaces should receive different context because they serve different cognitive functions.**

The most intelligent system is not the one that displays the most context.

It is the one that knows what can safely disappear.

## 31. Home provides conversational access to the model

Home is different.

The user should not need to understand Threads, Intentions, Actions, relevance scores, event history, or retrieval architecture.

They can simply say:

> *My brain is soup today.*

Lumi can use the underlying model to respond:

> *Yeah, I think we can make today pretty small. There's one thing I'd really like us to deal with.*

Home is therefore a conversational interface over the broader system.

The complexity remains behind Lumi.

This is a central expression of the architecture:

> **The user speaks naturally. Lumi translates between natural experience and structured understanding.**

## 32. AI should operate through bounded actions

Lumi should not have unrestricted authority to rewrite application state through arbitrary generated text.

As the system matures, state-changing AI behaviour should occur through explicit operations.

Conceptually, these may include actions such as:

- `create_thread`
- `create_intention`
- `create_action`
- `update_intention`
- `update_action`
- `relate_items`
- `propose_category`
- `update_category`
- `record_priority_signal`
- `defer`
- `mark_complete`
- `mark_resting`
- `archive`
- `create_focus_session`
- `record_focus_outcome`
- `update_capacity_context`
- `retrieve_related_context`
- `record_user_correction`

The exact tool architecture is an implementation decision.

The principle is:

> **Language generation and state mutation should be distinguishable operations.**

This improves:

- reliability
- testability
- auditability
- correction
- model portability
- observability

It also prevents conversational fluency from being mistaken for state accuracy.

## 33. Not every inference should mutate state

Lumi may think:

> *This sounds like something the user might want to do.*

That does not automatically mean:

```
create_action()
```

The system should distinguish between:

- conversational interpretation
- tentative inference
- proposed state change
- committed state change

The threshold should depend partly on consequence.

Harmless organization can often be inferred automatically.

Consequential assumptions should require greater confidence or user confirmation.

The goal is neither:

> *Ask permission for everything.*

nor:

> *Let the model rewrite everything.*

It is **proportional autonomy**.

## 34. Use proportional confirmation

Avoid both extremes.

### Too little confirmation

Lumi silently changes important information based on uncertain inference.

### Too much confirmation

> *Should I save this?*
> *Should I categorize this?*
> *Should I change the priority?*
> *Should I remember this?*
> *Should I create a task?*

The user ends up administering Lumi.

Instead:

> **Confirmation should be proportional to uncertainty, consequence, and reversibility.**

Low-risk, easily reversible changes can often happen automatically.

High-impact or ambiguous changes deserve confirmation.

This principle should be applied consistently across AI operations.

## 35. Reversibility matters

AI-maintained systems should make mistakes cheap.

Important state changes should ideally be:

- reversible
- inspectable when necessary
- attributable
- recoverable

If Lumi reorganizes something incorrectly, the user should be able to fix it without reconstructing the previous state manually.

This supports the broader relationship:

> **Lumi can act because Lumi can also be corrected.**

Undo/history mechanisms may therefore become important even when they remain largely invisible during normal use.

## 36. Lumi's model should remain legible

As Lumi's internal understanding becomes more sophisticated, the user should retain the ability to understand consequential behaviour.

If the user asks:

> *Why do you keep showing me this?*

Lumi should ideally be able to answer naturally:

> *You told me it mattered last week, it's due Tuesday, and you moved it near the top of School yesterday.*

The user can then respond:

> *That's changed. I don't need to do it anymore.*

And the system repairs its understanding.

Legibility does not mean exposing:

- database fields
- raw confidence scores
- hidden chain-of-thought
- internal reasoning traces

throughout the interface.

It means Lumi's model should be explainable at the level relevant to the user's decision.

The desired loop is:

```
Lumi understands
  ↓
Lumi acts
  ↓
User can understand why when necessary
  ↓
User corrects
  ↓
Model updates
```

This is preferable to both opaque automation and constant confirmation.

## 37. Coherence should maintain itself

A central architectural ambition is **self-maintaining structure**.

Traditional productivity databases accumulate debris:

- old tasks
- stale projects
- outdated priorities
- duplicate items
- forgotten ideas
- completed work still appearing active
- commitments whose context has disappeared

Coherence should increasingly detect structural decay.

For example:

> *This Action was created six weeks ago, its deadline passed, it has not been mentioned since, and its related Thread is inactive.*

The system may:

- lower its active relevance
- stop foregrounding it
- ask whether it still matters
- suggest archiving it
- identify it as stale
- relate it to newer information

The exact behaviour should remain conservative.

The principle is:

> **The user should not need regular database-hygiene rituals to keep Coherence usable.**

## 38. Self-maintenance should be conservative

A self-maintaining system can become harmful if it confidently cleans up things the user still cares about.

Therefore:

> **Active context may recede relatively freely. Durable history should be treated more conservatively.**

For example:

Lumi might stop surfacing a stale Intention without permanently deleting it.

Archival is generally preferable to destructive deletion.

Low relevance is not the same as no value.

When uncertainty is consequential:

> **Ask.**

## 39. Re-entry requires state reconstruction

When the user returns after an absence, Coherence should not simply reload the last known plan.

The world may have changed.

Deadlines may have passed.

Priorities may have shifted.

Some things may have resolved externally.

Some old intentions may no longer matter.

The system should help reconstruct what is relevant **now**.

This may involve:

- checking temporal changes
- identifying stale intentions
- recognizing passed commitments
- resurfacing unresolved responsibilities
- reducing outdated priorities
- retrieving important active Threads
- asking a small number of useful questions

Conceptually:

```
previous state
  +
elapsed time
  +
current context
  ↓
reconstructed present
```

This is a core AI function.

Re-entry should therefore be part of the information architecture, not implemented later as friendly copy.

## 40. Relationships between things matter

A flat list loses important structure.

Threads, Intentions, Actions, commitments, and contextual information may relate through:

- project membership
- dependency
- sequence
- shared context
- common goal
- recurrence
- semantic similarity
- parent/child relationship
- temporal relationship
- shared people
- causal relevance

For example:

**Practicum**

may relate to:

- email Richard
- office availability
- client outreach
- practicum hours
- supervision
- school requirements

The architecture should eventually support these relationships without requiring the user to manually construct a project-management graph.

Lumi can infer and maintain useful relationships as they emerge.

## 41. Threads provide continuity across fragmented action

The Thread concept becomes particularly important here.

A user may interact with the same area of life in dozens of disconnected moments.

Without a Thread model, those moments can appear unrelated:

> *email supervisor*
> *update availability*
> *talk about anxiety about clients*
> *track practicum hours*
> *attend supervision*

With a Thread:

> **Practicum**

these actions and conversations can remain meaningfully connected.

This allows Lumi to understand not only individual tasks but the larger context they belong to.

Threads may therefore become one of the primary mechanisms through which Coherence preserves **continuity across time**.

## 42. History should support continuity, not surveillance

Coherence may eventually possess rich behavioural history.

That creates responsibility.

Historical information should exist to help with:

- continuity
- retrieval
- learning useful preferences
- reducing repetition
- improving recommendations
- understanding how something evolved

It should not make the user feel monitored.

Avoid unnecessarily foregrounding metrics such as:

> *You procrastinated 17 times this month.*

A more appropriate use of the same underlying history might be:

> *This one seems to keep getting pushed aside. Want to figure out why?*

The same data can produce very different relationships.

Coherence should prefer **understanding over measurement**.

## 43. Analytics should not become the model

Because Coherence may collect useful event and interaction data, it will be tempting to reduce behaviour into metrics.

Examples:

- completion rate
- Focus duration
- deferral count
- number of tasks completed
- consistency
- daily productivity

These may occasionally be useful signals.

They should not become the system's primary interpretation of the user.

A person is not:

> *73% productive this week.*

Quantitative signals should support contextual reasoning rather than replace it.

## 44. The system should support uncertainty

Lumi should be allowed to not know.

The architecture should support states such as:

- uncertain category
- unclear intention
- ambiguous relationship
- tentative pattern
- unresolved priority
- unknown deadline

Uncertainty should not always trigger a question.

Sometimes it can remain unresolved until it becomes relevant.

This prevents Lumi from forcing premature structure merely because the database prefers certainty.

## 45. Not everything needs to be resolved immediately

This follows from the previous principle.

If the user says:

> *I might want to do something with that idea eventually.*

Coherence does not necessarily need to ask:

> *What category should I put it in?*
> *What's the deadline?*
> *What's the priority?*
> *Would you like me to create a project?*

The system may simply preserve enough context to retrieve the idea later.

Coherence should be comfortable with **partially structured information**.

Human life is partially structured.

The architecture should accommodate that reality.

## 46. The model should become easier to use as it becomes richer

Traditional productivity systems often become harder to manage as more information accumulates.

Coherence should aspire to the opposite.

As the model becomes richer:

- Lumi has more context
- retrieval improves
- categorization improves
- prioritization becomes more informed
- re-entry becomes easier
- the user needs to explain less

The increasing sophistication should primarily be experienced as:

> **less work for me.**

If richer context requires increasingly elaborate manual management, the architecture is failing the product philosophy.

## 47. AI provider and model should remain replaceable

Lumi is a product concept and relational interface.

She should not be architecturally identical to a particular model provider.

The system should preserve boundaries between:

- product state
- context assembly
- AI reasoning
- state-changing tools
- conversational rendering
- model provider

This allows Coherence to:

- change models
- use different models for different operations
- test alternatives
- manage cost
- improve privacy
- adopt future capabilities

without rebuilding Lumi's underlying understanding.

> **Lumi is not the API.**

The model is one component through which Lumi operates.

## 48. Structured reasoning and conversational reasoning can differ

Not every AI operation requires the same model behaviour.

Some interactions require:

- nuanced conversation
- emotional/contextual interpretation
- ambiguity
- personality

Others may require:

- classification
- extraction
- summarization
- relationship detection
- stale-state analysis
- retrieval ranking

The architecture should leave room for different AI operations to use different strategies.

The user should still experience one coherent Lumi.

Internal specialization should not fragment the personality or product experience.

## 49. Context assembly should be observable and testable

Because Lumi's usefulness will depend heavily on receiving appropriate context, context selection should not remain an invisible prompt-building accident.

The system should eventually make it possible for developers to inspect:

- what context was retrieved
- why it was retrieved
- what structured state was included
- what was excluded
- what space the user was in
- what current Action or Thread was active

This is important for debugging cases where Lumi:

- forgets something relevant
- surfaces something irrelevant
- behaves inconsistently
- repeatedly misunderstands priority

Context architecture should be treated as a product system worthy of testing.

## 50. Privacy should influence architecture from the beginning

Coherence may eventually hold unusually intimate context about a person's life.

Even when the information is not traditionally considered sensitive, the **aggregation** of:

- tasks
- relationships
- routines
- priorities
- work
- personal projects
- conversations
- behavioural patterns
- capacity
- history

can create a detailed representation of someone's life.

Privacy should therefore not be treated as a later compliance feature.

Architectural decisions should consider:

- what information actually needs to be stored
- how long different information should persist
- which information can remain local
- what is sent to external model providers
- how retrieved context is minimized
- how users can inspect and correct durable information
- how deletion should propagate
- how sensitive information is protected
- whether some forms of inference should be ephemeral rather than durable

The principle should be:

> **Lumi should know enough to be genuinely useful without collecting information merely because it might someday be useful.**

Data minimization and contextual intelligence should develop together.

## 51. User control over durable context

AI-maintained context should not mean invisible permanent memory.

As the memory system develops, users should have meaningful ways to:

- understand what Coherence is holding
- correct inaccurate information
- remove things they no longer want retained
- distinguish active from archival context
- understand important learned patterns
- reset or revise assumptions

This does not necessarily require exposing an enormous memory-management interface.

Ideally, much of this control can remain conversational.

For example:

> **User:** Stop treating that as something I'm working toward.
>
> **Lumi:** Got it. I'll archive that intention.

Or:

> **User:** Why do you think mornings work better for me?
>
> **Lumi:** Mostly because your last several longer Focus sessions happened before noon. I may be reading too much into that.

This combines legibility with correction.

## 52. Application state and AI memory should not silently diverge

Coherence will likely contain both structured application state and less structured memory.

These systems should not develop contradictory understandings without reconciliation.

For example:

Structured state says:

> *Project abandoned.*

Historical memory contains:

> *User is excited about launching this project.*

The older memory should not cause Lumi to continue treating the project as active.

More recent explicit state should generally override older inference.

This suggests the need for:

- recency
- provenance
- confidence
- supersession
- contradiction handling

across memory systems.

The goal is not perfect logical consistency.

It is enough consistency that Lumi's understanding remains coherent and correctable.

## 53. Current truth should usually outrank historical truth

When information conflicts, Coherence should reason about temporal validity.

For example:

> *"I'm working Wednesdays."*

may later become:

> *"I'm not doing Wednesdays anymore."*

Both statements were true at different times.

The architecture should not simply retrieve both and leave the language model to guess.

Where possible, the system should understand:

```
previous state → superseded by → current state
```

Historical information remains useful as history.

It should not continue behaving as current truth.

## 54. Coherence should preserve meaningful genealogy

Although current truth usually deserves priority, understanding how something evolved can matter.

A Thread might move through:

```
idea
  ↓
active project
  ↓
paused
  ↓
resumed
  ↓
abandoned
```

That history may become useful later.

Likewise, the user's relationship to an Intention may change.

Coherence should preserve meaningful evolution without requiring every historical version to remain active.

This allows Lumi to understand not just:

> *What is this?*

but sometimes:

> **What has this become?**

## 55. The architecture should support re-interpretation

AI understanding will improve.

The user's own understanding will change.

Therefore old information may occasionally need to be interpreted differently.

For example, several Actions originally treated as unrelated may later become recognizable as part of one Thread.

Or something originally stored as an Action may turn out to have been exploratory rather than a commitment.

The architecture should allow relationships and interpretations to evolve without destroying original provenance.

This is another reason to distinguish:

> **what happened**

from

> **what Lumi currently believes it means.**

## 56. Coherence should avoid premature ontology

The distinctions in this document — Thread, Intention, Action, Event, Commitment, Context — are useful conceptual tools.

They should guide implementation.

They should not become an excuse to build an elaborate universal ontology of human life before the product has earned it.

Start with the smallest model capable of preserving the distinctions required by the experience.

Expand it when actual interactions demonstrate the need.

The architecture should be:

> **conceptually rich, incrementally implemented.**

Avoid both extremes:

**too simple**

> *everything is a task and a chat message*

and:

**too abstract**

> *an elaborate semantic graph before the prototype can help someone start their paper*

The product experience should drive increasing sophistication.

## 57. Build for evolution

Several parts of this architecture are intentionally unresolved.

Examples include:

- final Thread representation
- memory storage strategy
- semantic retrieval implementation
- event architecture
- confidence representation
- decay functions
- prioritization models
- relationship graphs
- AI orchestration
- model selection
- local versus cloud persistence

Do not prematurely lock these into irreversible abstractions.

At the same time, preserve boundaries that would make evolution possible.

Particularly important boundaries include:

- **conversation ≠ state**
- **state ≠ history**
- **explicit information ≠ inference**
- **memory ≠ application state**
- **language generation ≠ state mutation**
- **priority ≠ attention**
- **spaces ≠ separate data silos**

These distinctions are more important at this stage than the exact technology used to implement them.

## 58. V1 should implement the philosophy minimally

The first implementation does not need the complete architecture described here.

It should establish the **seams that allow this architecture to grow**.

A reasonable V1 might contain:

- user
- conversation
- simple Threads or categories
- Intentions / Actions
- explicit deadlines
- manual ordering
- basic status
- lightweight event history
- Focus sessions
- AI tool calls for deliberate state changes
- shared state across spaces
- basic context assembly
- provenance for important AI-created state

It does not initially require:

- sophisticated semantic graphs
- behavioural pattern learning
- complex relevance decay
- long-term autonomous memory consolidation
- elaborate confidence modelling
- predictive capacity models
- autonomous restructuring of the entire knowledge base

The goal is to avoid implementing V1 in a way that makes those future capabilities unnecessarily difficult.

## 59. Complexity belongs behind Lumi

This is one of the most important architectural constraints.

Internally, Coherence may eventually reason about:

- Threads
- Intentions
- Actions
- Events
- relationships
- temporal state
- deadlines
- priority signals
- attention relevance
- capacity
- provenance
- confidence
- patterns
- retrieval
- decay
- contradictions
- historical state

The user should still be able to open Home and say:

> *My brain is soup today.*

And Lumi can answer:

> *Yeah, I think we can make today pretty small. There's one thing I'd really like us to deal with.*

The user should not need to understand the machinery that made that answer possible.

> **Internal complexity is justified only when it produces external simplicity, continuity, or better understanding.**

## 60. Architectural north star

Coherence is not building an AI that knows the user's to-do list.

It is building an evolving model of:

- what is happening in the user's life
- what they are carrying
- what they intend
- what matters to them
- what has changed
- what they have capacity for
- what deserves attention
- what can safely recede
- where they left off
- what may help them move forward

The interface then performs **progressive compression**.

**The Library** exposes more of the model.

**The Garden** compresses it into what deserves tending today.

**The Study** compresses it further into what deserves attention now.

**Home** allows the user to interact with the model conversationally without needing to see its structure at all.

Conceptually:

```
life
  ↓
evolving model
  ↓
relevant context
  ↓
today
  ↓
now
```

As the internal model becomes richer, the external experience should become quieter.

The measure of architectural sophistication is therefore not how much structure Coherence can expose.

It is how much complexity Lumi can carry **without requiring the user to carry it too.**

## 61. Architectural review questions

When making consequential architectural decisions, ask:

- **Are we modelling the user's life, or merely accumulating tasks?**
- **Are we preserving the distinction between conversation and durable state?**
- **Are explicit facts distinguishable from Lumi's interpretations?**
- **Can we understand where consequential information came from?**
- **Can the user correct Lumi without becoming Lumi's administrator?**
- **Does information have a way to become less relevant over time?**
- **Are we modelling what deserves attention separately from what is merely important?**
- **Can the system deliberately background information rather than only retrieve more?**
- **Does context move coherently between Home, Garden, Library, and Study?**
- **Can the user disappear and return without manually reconstructing the system?**
- **Can Lumi explain consequential recommendations at a useful level?**
- **Are AI state changes bounded, reversible, and testable?**
- **Are we preserving enough history for continuity without turning history into surveillance?**
- **Are we collecting information because it is useful, or merely because we can?**
- **Does increasing internal sophistication reduce the user's burden?**
- **Could this architecture evolve without requiring us to replace the conceptual foundation?**

And finally:

> **Does this architecture help Coherence hold more so the user can hold less?**

If not, reconsider it.
