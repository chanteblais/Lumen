# Coherence — Motion & Interaction

*Reconciled product direction, approved 2026-09-13. Shared terms and the approved resolutions are in [Shared model and terminology](../product/shared-model.md); source lineage and retained history are in the [reconciliation record](../living/reconciliation.md). Numbered sections retain the complete supplied document’s order. Examples and future possibilities illustrate direction; they are not a claim of implementation or an expansion of [V1 scope](../v1-plan.md). Unsettled choices remain in [Open questions](../living/open-questions.md).*

**Read with:** [Visual Language](visual-language.md) · [Animation Pipeline](../animation-pipeline.md) · [Shared terminology](../product/shared-model.md).

## Purpose

This document defines the motion philosophy, interaction grammar, spatial transitions, character animation principles, and accessibility constraints for Coherence.

Motion in Coherence should not exist to make the product feel lively for its own sake. It should help the user understand state, preserve orientation, support continuity, communicate Lumi’s presence, and make transitions between cognitive modes feel natural.

The central principle is:

Motion should make Coherence easier to understand, easier to inhabit, or easier to return to.

If motion does none of those things, it is probably decorative noise.

## 1. Motion should communicate meaning

Every meaningful animation should answer at least one question:

- What changed?\
- Where did something go?\
- What is active now?\
- What is receding?\
- Is Lumi listening, thinking, waiting, or working?\
- Did my action succeed?\
- Am I moving into a different cognitive mode?

Motion should reduce uncertainty rather than add spectacle.

## 2. Motion is part of the information architecture

Coherence is organized around changing relationships to the same underlying context.

Home invites arrival.\
Garden selects what deserves attention today.\
Library exposes broader structure.\
Study narrows attention to one thing.

Transitions between these spaces should therefore help the user feel that context is being reframed rather than replaced.

Motion can express this change in relationship.

## 3. Preserve continuity across spaces

Moving between spaces should feel like entering a different part of the same world.

Avoid abrupt transitions that make each surface feel like a separate app.

Useful continuity cues may include:

- shared materials\
- related lighting\
- persistent Lumi presence\
- spatial direction\
- carried interface elements\
- stable navigation\
- subtle environmental overlap

The user should understand:

I am still inside Coherence. I am simply relating to my information differently now.

## 4. Atmosphere must not block navigation

Environmental transitions may imply walking, entering, zooming, or settling into a new place.

They should not require the user to wait for an animation to finish.

The user should always be able to navigate quickly.

Atmosphere accompanies movement.\
It does not gate movement.

## 5. Interaction should feel direct

When the user drags, clicks, dismisses, rearranges, or starts something, the interface should respond immediately.

Do not make important actions feel mediated by character animation.

For example:

The user drags an Action into Later.\
The item should move immediately.\
Lumi may react afterward.

The UI should not wait for Lumi to pick it up and carry it across the screen before the state changes.

## 6. Motion should preserve orientation

When content changes position, the user should understand where it went.

Prefer transitions such as:

- item slides upward as priority changes\
- card recedes as it moves to Later\
- shelf zooms closer when opened\
- completed item gently leaves foreground

Avoid sudden disappearance when continuity matters.

The user should not have to mentally reconstruct the interface after every action.

## 7. Not every change needs animation

Animation itself has cognitive cost.

Use it selectively.

A small text update may need no motion.\
A major hierarchy change probably does.

The test is:

Would motion help the user understand what changed?

If not, instant state change may be better.

## 8. Motion hierarchy should match information hierarchy

Primary changes may receive clearer motion.\
Secondary changes should be quieter.\
Background changes should often be invisible.

For example:

When Today changes the Right Now Action, that transition can be noticeable.\
When an archival relevance score changes internally, nothing should animate.

The user’s attention should not be spent on low-value state changes.

## 9. Avoid constant ambient movement

An inhabited world does not require everything to move all the time.

Too much ambient motion creates visual noise and makes stillness impossible.

Environmental animation should be sparse and slow.

Examples that may work:

- subtle leaves moving\
- distant light shifts\
- an occasional page flutter\
- a barely perceptible curtain movement

These should remain peripheral.

## 10. Stillness is part of the design

Stillness should be treated as an active visual state rather than absence of design.

Home may be quiet.\
The Study may be especially still.\
The Library may feel settled.\
The Garden may have modest environmental motion.

The product should be comfortable doing nothing visibly.

## 11. Lumi supplies most character motion

Because Lumi is the primary embodied presence in Coherence, she can carry much of the animation personality.

This allows the rest of the interface to remain restrained.

The system does not need animated icons, bouncing cards, decorative particles, and lively transitions everywhere if Lumi already makes the world feel inhabited.

## 12. Lumi’s base idle should be nearly invisible

Lumi’s default idle should communicate life without demanding attention.

Current intended components include:

- subtle breathing\
- occasional blinking\
- minimal sway\
- tiny posture adjustments

Neighbouring animation frames should differ only slightly.

The motion should feel smoother than it feels noticeable.

## 13. Idle sequences should not loop mechanically

A perfectly repeating four-second animation will quickly feel artificial.

Lumi’s idle system should eventually combine:

- a stable base idle\
- irregular blink timing\
- infrequent alternate idles\
- long periods without special gestures

The user should not be able to predict:

blink, sway, foot scuff, repeat.

## 14. Alternate idles should be rare

Examples may include:

- scuffing the ground with her foot\
- stretching\
- glancing around\
- looking down curiously\
- adjusting posture

These are character moments, not screensavers.

They should happen occasionally enough that they remain delightful rather than repetitive.

## 15. Lumi should return cleanly to a shared rest pose

Special animation sequences should begin and end in a compatible base pose whenever possible.

This is especially important for sprite animation.

It enables:

idle → special action → idle

without a visible jump.

Character scale, baseline, proportions, and silhouette should remain stable unless the animation intentionally requires otherwise.

## 16. Stable drawing matters more than animation quantity

Lumi’s hood, cloak folds, ribbon, ornament, face, and overall silhouette should not shimmer between frames when those parts are not supposed to move.

Animation should be created from a stable base drawing with only relevant elements changing.

The intended feeling is embodied motion, not a sequence of redraws.

## 17. Motion should follow physical continuity

Even stylized motion benefits from believable continuity.

A foot should not teleport.\
A head should not snap unless the action calls for it.\
A cloak should respond only where movement affects it.

Small in-between changes matter.

## 18. Slow in, slow out

Many Coherence movements should use gentle easing rather than linear or springy motion.

Appropriate motion often:

- begins softly\
- accelerates modestly\
- settles gradually

Avoid exaggerated bounce or elastic easing for ordinary interactions.

The product should feel calm, not playful in a toy-like way.

## 19. Avoid reward animation language

Do not use:

- confetti\
- fireworks\
- coins\
- stars bursting outward\
- streak flames\
- celebratory bouncing\
- achievement explosions

Coherence should not train task completion through spectacle.

Completion can feel satisfying through clarity, relief, and progression of attention.

## 20. Completion motion should create release

When something is completed, the interaction should feel more like:

this no longer needs your attention

than:

you earned a reward.

Possible motion:

- item gently recedes\
- foreground clears\
- next item moves into place\
- visual weight decreases

The useful emotional effect is relief.

## 21. Dragging is semantic

Drag-and-drop should not exist merely because draggable interfaces feel tactile.

Movement should communicate meaning.

Current conceptual semantics include:

Vertical movement\
→ relative priority or ordering

Movement between sections\
→ category or context change

Movement into Later / resting areas\
→ deliberate backgrounding

Movement onto Lumi\
→ invitation to discuss or begin together

The exact mappings can evolve, but drag should always have interpretable consequence.

## 22. Dragging should teach Lumi

A drag action is not merely UI rearrangement.

It can become structured information.

For example:

Moving an Action upward may create a user-authored priority signal.\
Moving it from Work to Personal may correct context.\
Moving it to Later may communicate that it should stop appearing in foreground recommendations.

The visual action and the AI model should remain connected.

## 23. Drag interactions must have non-drag equivalents

Every important drag action should remain accessible through another method.

Examples:

- menu action\
- keyboard controls\
- buttons\
- conversational command to Lumi

Dragging can be delightful and direct.\
It cannot be the only way to operate the product.

## 24. Drag targets should become clear during interaction

The interface should not cover the screen in permanent drop zones.

Instead, relevant destinations can become visible when the user begins dragging.

This preserves visual quiet while maintaining discoverability.

## 25. Dragging should not feel fragile

Drop areas should be forgiving.

If the user moves an item near an obvious destination, the interface should help rather than demand pixel precision.

Avoid interactions where a small miss causes the item to snap confusingly back without explanation.

## 26. Lumi as a drop target

One distinctive interaction may be allowing the user to drag an item onto Lumi.

This could mean:

I want help with this.

Lumi may inspect it and respond:

Okay. Want to start this together?

This interaction combines interface action, system meaning, and relationship.

It should remain optional rather than becoming the required way to initiate Focus.

## 27. Lumi reactions should follow state change

When the user drags something onto Lumi, the state should register immediately.

Then Lumi may react physically:

- look toward it\
- lean slightly\
- hold or inspect it if the visual system allows\
- speak

The character reaction should enrich the action, not delay it.

## 28. The Library needs progressive zoom

*Design status: progressive access to detail is the principle. Literal spatial zoom is a candidate interaction, not a settled requirement; provide accessible non-spatial access and resolve the concrete design through [open question 3](../living/open-questions.md).*

The Library contains the greatest risk of information density.

Zooming can provide progressive disclosure.

Conceptually:

room\
→ section\
→ shelf\
→ Thread\
→ contents / history

The user sees only as much detail as the current scale requires.

## 29. Zoom should feel spatially continuous

When entering a Library section, prefer the feeling of moving closer to something already visible rather than replacing the entire screen with an unrelated page.

The shelf the user clicked can expand toward the foreground.

This preserves spatial memory:

I know where this came from.

## 30. Zoom should not become cinematic

Library zoom should be quick.

The user should not wait through a dramatic camera move every time they inspect a Thread.

A few hundred milliseconds of spatial continuity may be enough.

The goal is orientation, not spectacle.

## 31. Backing out should restore place

When the user exits a detailed Library view, they should return to the same shelf/section position.

Do not reset them to the top-level room unless they explicitly navigate there.

Spatial memory is part of making the Library feel navigable rather than infinite.

## 32. Progressive disclosure applies beyond the Library

The same principle should govern the broader product:

Garden\
→ only a few foreground items

Study\
→ one thing

Home\
→ conversation first, structure later

Interface complexity should appear only when the user moves toward it.

## 33. Transitions between Garden and Study should narrow attention

Moving from Today into Focus should visually communicate:

we chose; now we attend.

Possible changes:

- secondary Today items recede\
- environmental motion decreases\
- Lumi settles\
- the active item remains continuous into Study\
- visual framing becomes tighter

The user should not feel that a new task was created.

They are giving attention to the same thing.

## 34. Returning from Study should preserve outcome continuity

When the user leaves Focus, the Garden should understand what happened.

The transition can reflect:

- completed\
- progress made\
- blocked\
- paused\
- context restored

If the Action remains active, it can return to Today with updated state rather than appearing reset.

## 35. Home transitions should feel permissive

Entering Home should generally reduce demand.

Other information can fall away.

The user should feel:

I can arrive here without choosing anything yet.

Motion into Home should therefore be softer and less directional than motion into Study.

## 36. Library transitions should increase legibility, not urgency

Opening a Library section should feel like inspection.

Avoid motion that implies urgency or progression toward completion.

The Library is about structure, retrieval, and orientation.

## 37. Garden transitions can express foregrounding

When Lumi changes Today’s recommendation, the new foreground item should become clearly legible without making the old one feel punished.

For example:

old item recedes\
new item settles forward

This communicates changing attention rather than failure.

## 38. State changes should occur at meaningful moments

Coherence should not continuously reshuffle itself in response to tiny internal updates.

Visible recuration should usually happen when:

- the user opens a space\
- completes or changes something\
- explicitly updates capacity\
- important new context arrives\
- meaningful time has passed\
- the user asks for a revision

Stability supports trust.

## 39. Avoid moving targets

Buttons, cards, or controls should not change position while the user is trying to interact with them.

AI-driven recuration must respect interaction stability.

If a plan changes, transition at a safe moment.

## 40. Microinteractions should confirm rather than entertain

Useful microinteractions may include:

- subtle button depression\
- clear drag pickup\
- soft selection state\
- gentle card settle\
- quiet completion transition\
- focus ring

They should reassure the user that the system understood the action.

## 41. Error states should not punish

If an action fails, avoid aggressive shaking, red flashes, or accusatory motion.

Use clear, restrained feedback.

The goal is:

that didn’t work; here’s what happened

not:

you did something wrong.

## 42. Motion can communicate uncertainty

Lumi may occasionally pause before responding.

A subtle thinking state can make latency understandable without theatrical loading animation.

Possible Lumi thinking cues:

- small pause\
- slight gaze shift\
- subtle posture change

Avoid exaggerated spinning, pacing, or constant typing indicators.

## 43. Do not fake thinking time

If the system already has an answer, it should not artificially delay response merely to make Lumi feel more human.

Character timing should reflect real system state where possible.

## 44. Lumi can communicate attention before speaking

Embodiment allows some state to be shown visually.

For example:

User signals Stuck.\
Lumi looks up.\
Then she responds.

User resumes Focus.\
Lumi settles back down.

These transitions can make Lumi feel present without increasing dialogue.

## 45. Lumi’s movement should vary by space

Home\
→ relaxed, familiar, occasional wandering

Garden\
→ exploratory, tending, observational

Library\
→ browsing, retrieving, inspecting

Study\
→ settled, quiet, minimally animated

The same character remains recognizable, but behaviour reflects cognitive mode.

## 46. Lumi should not pace constantly

Walking is useful when it communicates destination or inhabitation.

Constant wandering quickly becomes distracting.

Lumi can spend long periods stationary.

## 47. Navigation can imply spatial direction

If useful, spaces may have a consistent conceptual relationship.

For example, navigation could subtly imply moving from Home toward Garden or Library.

This is optional.

Do not build a literal floor plan unless it improves orientation.

## 48. Avoid making users traverse space unnecessarily

The user should never need to watch Lumi walk across a room to reach a menu.

Spatial metaphor must remain subordinate to software efficiency.

## 49. Environmental objects should not all be interactive

A world becomes noisy if every object highlights on hover.

Most scenery should remain scenery.

Interactive objects should be deliberate and recognizable.

## 50. Interaction affordances should remain crisp

The environmental world can be painterly, tactile, or atmospheric.

Functional controls should remain clear.

Hover, focus, drag, and selection states must be legible.

The user should not have to guess whether something is decorative or actionable.

## 51. Reduced motion is a first-class mode

Coherence should respect reduced-motion preferences throughout the product.

Reduced motion should not mean loss of meaning.

Replace movement with:

- opacity changes\
- instant state changes\
- static posture changes\
- restrained highlights\
- simpler transitions

The interface should remain fully understandable.

## 52. Lumi remains present with reduced motion

Reduced motion should not remove Lumi’s personality.

Her presence can be expressed through:

- static pose changes\
- occasional non-looping state swaps\
- text\
- gaze direction\
- position

Animation is one language of presence, not the only one.

## 53. Avoid parallax dependence

Parallax can create depth, but it can also cause discomfort and visual instability.

If used at all, keep it subtle and nonessential.

No critical information should depend on depth movement.

## 54. Respect motion sensitivity

Avoid large rapid camera motion, full-screen zoom, aggressive scaling, or unnecessary simulated depth.

Environmental transitions should be calm enough that repeated navigation remains comfortable.

## 55. Timing should feel responsive first

Typical UI transitions should be brief.

The exact values can evolve, but the product should generally favour responsiveness over cinematic polish.

Longer character actions can occur asynchronously without blocking interaction.

## 56. Character motion can be slower than UI motion

UI action should respond quickly.\
Lumi can react at a more natural pace.

This creates a useful separation:

software state is immediate\
character embodiment follows

## 57. Easing should be restrained

Prefer ease-out for elements entering, ease-in for elements leaving, and gentle ease-in-out for spatial transitions.

Avoid bouncy springs unless a very specific interaction genuinely benefits from them.

## 58. Motion should not imply emotional judgment

A deferred Action should not droop sadly.\
Lumi should not visibly slump when the user stops Focus.\
The Garden should not wilt after an unproductive day.

Animation should never pressure the user through anthropomorphic guilt.

## 59. Re-entry motion should be welcoming, not celebratory

When the user returns after absence, the interface can gently reestablish place.

Lumi may look up or orient toward them.

Avoid:

You’re back! 🎉

with dramatic animation that makes absence itself feel like an event requiring response.

## 60. Motion should help reconstruct state after interruption

If the user returns while context has changed, a brief transition can make that change understandable.

For example:

Yesterday’s foreground recedes.\
Today’s recommendation settles in.

The product should visually help answer:

Where are we now?

## 61. Loading should preserve continuity

If AI reasoning takes time, do not blank the entire interface.

Prefer:

- keep last known useful state visible\
- show a quiet thinking cue\
- progressively update when ready

The user should not lose orientation merely because the model is working.

## 62. Avoid skeleton-screen overload

Skeleton loaders can make calm spaces feel like dashboards under construction.

Use them only when they genuinely clarify pending content.

Stable prior content is often better.

## 63. Optimistic interaction is valuable when reversible

For low-risk actions, the interface may update immediately while the system persists the change in the background.

If persistence fails, explain and recover gracefully.

This keeps Coherence feeling responsive.

## 64. Undo should be easy for AI-assisted changes

When Lumi or the user makes a reversible organizational change, a quiet Undo affordance can reduce fear of experimentation.

Examples:

Moved to Personal · Undo\
Archived · Undo\
Removed from Today · Undo

Undo should not dominate the interface.

## 65. Animation can reinforce reversibility

If the user undoes a move, the item can return through the reverse path where helpful.

This strengthens spatial understanding.

## 66. Do not animate hidden internal AI state

Confidence, retrieval, memory decay, inference strength, and similar internal processes should not create visible ambient behaviour.

The user needs consequences and explanations when relevant, not visualization of the machinery.

## 67. Motion should not become gamification through another door

Even without points, animation can reward compulsive use.

Avoid designing interactions primarily around dopamine loops.

The product should not become more animated when the user completes more work.

## 68. Environmental development should be slow

When Home, Garden, or Library evolves over time, changes should be gradual enough to feel accumulated rather than unlocked.

The user might occasionally notice:

Oh, that shelf feels fuller.

not:

New shelf unlocked!

## 69. Environmental changes should not demand explanation

The best long-term environmental motion may be almost background storytelling.

If every change requires a modal explaining what was earned, the world becomes a reward system.

## 70. Motion can create nostalgia through repetition

Repeated familiar motions can become part of place.

Examples:

- Lumi settling into the same chair in Study\
- a familiar Library zoom\
- the Garden’s slow ambient rhythm

Consistency can create emotional continuity.

## 71. Repetition should be stable but not mechanical

Core transitions should be predictable enough to orient.\
Character behaviour should contain modest variation.

This balance creates familiarity without obvious looping.

## 72. Interaction vocabulary should remain small

The product should avoid inventing a unique gesture for every function.

A small consistent set is better:

- click / tap\
- type / speak\
- drag\
- zoom / open\
- dismiss / background\
- start with Lumi

Consistency reduces learning burden.

## 73. Conversational actions and direct manipulation should converge

The same state change may occur through different surfaces.

User chooses “Not today” from a menu.\
User says: Not today.\
User uses an equivalent drag gesture explicitly labelled “Not today.”

All should record the same exclusion from today’s foreground. A move to a list named Later, a fixed-time item shown under Today’s Later heading, and a durable decision to rest are different operations. Input methods converge when the intended operation and temporal scope match, not merely because a label sounds similar.

The system should not create separate meanings simply because the input modality differed.

## 74. Lumi can bridge direct manipulation and conversation

When a user makes a meaningful manual change, Lumi may sometimes acknowledge it contextually.

For example:

User moves an Action to the top.\
Later Lumi understands it as important.

She does not need to narrate every drag.

The learning can remain implicit until useful.

## 75. Hover should reveal possibility, not clutter

On pointer devices, hover can expose secondary affordances.

For example:

- drag handle\
- subtle action menu\
- shelf interaction cue

The resting interface remains quieter.

Touch interfaces will need equivalent discoverability without hover dependence.

## 76. Focus states must be explicit

Keyboard navigation should make the currently focused element clearly visible.

Do not sacrifice accessibility for antique-book aesthetics.

Functional states should always outrank decorative subtlety.

## 77. Mobile interaction should preserve meaning rather than desktop choreography

Desktop may support richer dragging, spatial zoom, and environmental continuity.

Mobile should preserve the same cognitive model even when interactions differ.

For example:

Desktop: drag Action into Later.\
Mobile: swipe/menu/tap Later.

The meaning is shared.

## 78. Touch targets should remain practical

Environmental design should not produce tiny decorative buttons or precise draggable objects that are difficult to use.

The interface must remain software first.

## 79. Lumi animation should scale across devices

Small-screen Lumi may require simpler animation and larger gesture readability.

Do not assume desktop sprite proportions will automatically work on mobile.

Character presence should survive responsive layout without blocking content.

## 80. Performance is part of interaction quality

A beautiful transition that drops frames or delays input undermines the intended calm.

Motion should degrade gracefully on lower-power devices.

Prioritize:

- responsive input\
- stable frame rate\
- fast navigation

before secondary environmental animation.

## 81. Prefer transform/opacity-style motion where possible

Implementation should favour performant animation primitives.

Avoid expensive layout thrashing or unnecessary full-scene redraws.

The technical implementation can evolve, but performance constraints should shape design decisions early.

## 82. Lumi sprites need consistent production rules

Sprite sequences should maintain:

- fixed canvas cell size\
- stable baseline\
- stable scale\
- stable silhouette where parts are not moving\
- consistent palette and lighting\
- clean loop endpoints\
- predictable frame timing

This should be documented as part of the production pipeline, not reinvented for every animation.

## 83. Alternate Lumi animations should compose

Future animation states may include:

- idle\
- blink\
- foot scuff\
- stretch\
- glance\
- thinking\
- listening\
- walking\
- sitting\
- reading\
- reacting

The system should plan transitions among them rather than treating each sprite sheet as isolated.

## 84. Animation state should reflect product state

Lumi’s visible behaviour should correspond meaningfully to what is happening.

Examples:

Home idle\
Garden observing\
Study reading\
Listening when user speaks\
Thinking while reasoning\
Looking up when interrupted

Avoid random character gestures during consequential interaction.

## 85. Do not over-anthropomorphize system latency

Lumi can appear thoughtful.

But do not imply emotions or needs merely because an API call is slow.

The character should remain relational without using animation to deceive the user about system state.

## 86. Motion should support legibility of AI action

If Lumi changes something consequential, the interface should make the change visible enough to understand.

For example:

Lumi moves an Action out of Today.\
The item may visibly recede with a short explanation.

Silent invisible mutation can undermine trust.

## 87. AI recuration should avoid surprise reshuffling

If Lumi has new recommendations while the user is actively reviewing Today, prefer a prompt or a stable update point rather than silently reordering everything under their cursor.

User orientation outranks real-time optimization.

## 88. Transitions should respect temporal scope

A Today-only change should feel local to Today.\
A durable Library reorganization may feel more structural.

Motion can subtly reinforce the difference between:

this changed for now

and

this changed in the broader model.

## 89. Archive motion should communicate preservation, not deletion

When something is archived, the transition should imply receding from active view rather than being destroyed.

This supports Coherence’s conservative approach to history.

## 90. Destructive deletion should be visually distinct

Permanent deletion is different from:

- completing\
- resting\
- moving to Later\
- archiving

The interaction should require appropriate clarity and confirmation.

Do not let metaphor obscure consequence.

## 91. Motion should support containment

One of Coherence’s deepest functions is helping the user stop holding everything simultaneously.

Motion can reinforce containment by allowing irrelevant context to visibly recede.

Garden:\
Everything else can wait.

Study:\
Nothing else needs you right now.

The interface becomes quieter as attention narrows.

## 92. Attention should visually narrow across the product

A useful hierarchy is:

Library\
→ broad context

Garden\
→ today’s foreground

Study\
→ one thing

Motion between these spaces can progressively reduce visible information.

This gives the product’s information architecture a physical rhythm.

## 93. Expanding attention should restore context gradually

Leaving Study should not dump the full Library back onto the screen.

Return first to the Garden or relevant prior space.

Broader context becomes available when the user asks for it.

## 94. Motion should support calm correction

When the user corrects Lumi, the system should update without drama.

No error animation is required.

For example:

User: No, that belongs in Personal.

The item moves.\
Done.

Correction is normal collaboration.

## 95. Motion should never shame the user

No shaking overdue tasks.\
No sad Lumi reactions.\
No wilting Garden.\
No increasingly aggressive warnings because yesterday’s plan failed.

Actual urgency can be clear.\
Moral pressure should not be animated into the product.

## 96. Motion review questions

When designing or reviewing motion, ask:

- What information does this motion communicate?\
- Would the user understand the change without it?\
- Does it preserve orientation?\
- Does it steal attention from something more important?\
- Does it delay interaction?\
- Does it imply judgment or reward?\
- Is it accessible with reduced motion?\
- Does it belong to the same world as the other spaces?\
- Does it help Lumi feel present rather than performative?\
- Does it preserve responsiveness?\
- Is direct manipulation reflected in the underlying model?\
- Can the same state change happen without drag or animation?\
- Is the user still in control while the system adapts?

And most importantly:

Does this motion help the user understand where they are, what changed, or what deserves attention?

If not, remove it.

## 97. Motion & Interaction in one sentence

Coherence uses restrained, meaningful motion to preserve continuity, communicate state, and make the world feel inhabited—while always protecting the user’s attention from the product itself.
