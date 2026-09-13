# Lumen art direction — the evolving strategy

*v0.1 — DRAFT · 2026-09-12 · written from the sheets, paintings and mockups in `art/` and three days of animation work. Hypotheses, not rules: each bet in §8 moves to Settled or Dropped as it is tested, and a settled one gets its entry in `decisions.md`.*

**Who this is for:** Chanté and Claude, whenever the work changes what Lumi or a scene looks like or how Lumi moves — a new sheet, a painting, a mockup, a new kind of motion. Read §2, §3 and §8 before generating anything.

**Where it sits:** `design-philosophy.md` is what the *interface* is. This doc is what the *art* is and where it is heading: what holds across every drawing, the tension between the book and the painted world, the ladder of animation costs, what Lumi's motion means, and the bets under test. `animation-pipeline.md` is how a drawing becomes motion once that is settled; `art/README.md` is how the cut works; `design-system.md` is what ships.

---

## 1. Where the art has been

Three directions in three days. Each move kept something and dropped something; the table is the record, newest first. Add a row whenever a sheet, painting or mockup arrives.

| Date | Artefact | What it is | Kept | Dropped or open |
|---|---|---|---|---|
| 2026-09-12 | `scenery/today-mockup.png` | A *Coherence* Today over an isometric greenhouse: Lumi watering a raised bed signposted by life area, a sleeping cat, *Tend What Matters* on a wall board, category chips, *In Season* progress bars (*3/5 steps*) | nothing yet; not built | the garden as a metaphor for tasks; the chips and step counts as drawn (§3) |
| 2026-09-12 | `scenery/home-background.png` | An isometric cutaway of a lamplit cabin room, repainted for more open floor for Lumi to wander | served behind Home as `public/home-room.webp` | whether Lumi walks in it (§6); its projection differs from the eye-level mockups (bet 5) |
| 2026-09-12 | `archived/scene_mockups/cohernece-mockup.png` | A *Coherence* Home: a painted hero with Lumi reading at a desk near a cat, chat below, a right rail with *Lumi's World — a cozy place to grow*, notes on a reward system, plant care loops and a Rive exploration | the painted room behind Home; the greeting | Lumi's World, rewards, care loops, due-date labels, the sidebar motto (§3) |
| 2026-09-12 | `archived/scene_mockups/home-mockup.png`, `background-mockup.png` | Eye-level painted rooms at dusk and at night, no Lumi; banners reading *Small steps still move the world* and *A quieter way forward* | the palette and the light | the banners |
| 2026-09-12 | `lumi/lumi-ref.png` | An *interaction animation sheet*: idle, look around, happy, walk left and right, run, sit, read, write, think, tend plant, inspect, hold lantern, celebrate, rest, return, observe, stretch, sit from behind | the behaviour vocabulary (§5) | its costume differs from the cut source — a fringed scarf, no medallions (§7) |
| 2026-09-12 | `lumi/lumi.png`, `lumi/lumi-lantern-idle.png` | The lantern character: a sun-embroidered hood, ribbon and medallions, boots, a lantern; eight eye expressions; a storybook render | the character in the app today — the corner companion and the avatar heads | its sixteen cells are poses, not in-betweens, so one cell carries the body |
| ≤ 2026-09-11 | `archived/rali.png` and the `rali-*` sheets | Rali: a paper-grain hooded figure in ivory, ink and brass, no feet, one button; eight eye expressions | the silhouette, the void face, the warm eyes, expressions made of eyes alone | the name, the paper render, the minimal costume |

**The drift in one line:** from a quiet ornament of the book (Rali) toward a small resident of a cosy painted world (the lantern Lumi in rooms and gardens). The code followed the character; the written philosophy has not caught up (§3).

## 2. What holds — the invariants

These have survived every drawing so far. Treat them as the character and everything else as costume.

- **The silhouette.** A peaked hood much bigger than the body, a dark void where the face is, two warm glowing eyes. Readable at 36px beside a message and at 150px in the corner.
- **Expression lives in the eyes.** Both expression sheets, Rali's and the lantern's, change only the eye shapes: ovals, arcs, lids, a wink. There is no mouth to draw.
- **Lumi carries warmth.** The eyes glow and, since the lantern, so does the light in hand. In a dark room Lumi is a light source, not a figure lit by one.
- **The palette.** Ivory cloth, a near-black face, brass and amber in metal and light, sage or forest green in fabric and plants. A terracotta swatch appears in the reference sheet's palette only.
- **Small.** Never bigger than the thing the user is doing. The largest Lumi in the app is 150px tall, in a corner.
- **Quiet.** The reference sheet's own margin note: *Small movements. A quieter world. A kinder way forward.*

**Costume, not canon yet:** the lantern, the sun embroidery, the ribbon and medallions, the scarf, the boots. They have changed between sheets and will keep changing until §7 is done.

## 3. The open tension: the book or the world

The written canon and the art are pulling apart, and neither is wrong.

**What the docs say.** `design-philosophy.md` §2 puts Lumi fourth in order of permission — "small, sparing … a circular avatar beside his lines; never a full-body illustration in the working UI" — and leaves decorative imagery off the list. Its §3 says *never cute, gamified, cluttered*. `product.md` rules out gamification and streaks, and names "A calmer mind creates a brighter tomorrow" as the anti-example of copy on the walls. `CLAUDE.md`: the user never rates or tags anything.

**What the art does.** The corner companion shipped full-body on every page. Home is a painted room, repainted to give Lumi floor to walk on. The mockups add a cat, a garden of tasks, progress bars, a reward system, care loops, *Lumi's World*, and mottos on banners and wall boards — one of them, "A calmer mind can do remarkable things", a close relative of the named anti-example.

**Why both pull.** The book gives calm, legibility and a product that never nags. The world gives warmth, a reason to come back that is not a to-do list, and room for Lumi to be company rather than an icon — the body-doubling promise made visible.

**Proposed synthesis, a hypothesis and not a decision:** *the world is Lumi's, not a ledger of yours.* The painted world can grow if it keeps the rules the product already lives by.

1. **It responds to what happened, never to what didn't.** A finished session might open a flower. Nothing wilts, empties or dims when a day goes badly: a world that gets sadder in a hard week is a streak in disguise.
2. **Nothing in it needs tending by the user.** No watering, feeding or collecting. Lumi does the tending; the user is a guest.
3. **No counts, categories or due dates in the painting.** Counts and due-date labels are what `design-philosophy.md` §4 already turned down in `rali-list.png`; category chips ask the user to file things.
4. **Words in the world are Lumi's voice or nothing.** No mottos on walls or banners. A line belongs in the greeting, in Lumi's voice, where it can be about this user today.
5. **The world sits behind; the next step sits in front.** Type leads and the painting dims — the rule Home already follows.

A mockup feature that cannot keep all five goes to `ef-burden-log.md` before it is built, and this section records which rule it broke.

## 4. Animation strategy: a ladder of costs

The ledger in `animation-pipeline.md` prices each kind of motion. Move every frequent motion down the ladder, and spend drawn sheets on rare moments that earn them.

| Tier | What | Examples | Cost so far | Drift risk | Use for |
|---|---|---|---|---|---|
| 0 · Light | CSS on a still drawing: glow, flicker, a slow brightening | the lantern's light breathing, the eyes brightening on a reply (ideas) | minutes, no new art | none | ambient life on every page |
| 1 · Synthesised | Motion computed from one drawing | the breath (a ≤ 2px stretch) and the blink lids — live | ~20 min, no rounds before review (the lantern cut) | none: one drawing | idle life, eye states |
| 2 · Layered | One drawing split into parts — hood, face, eyes, lantern, cloak, feet — moved as parts | a glance, a head tilt, the lantern swinging, eye expressions (ideas) | a one-time split and a runtime, then minutes per motion (untested) | none after the split | reactions and states that happen often |
| 3 · Drawn loop | In-betweened sheets from the image generator | the slow sway and the foot kick, retired with Rali | 2–3 sheets, 3–5 rounds, 1–2 h each | high: the generator redraws the character | a rare signature gesture |
| 4 · Scene action | Drawn loops placed in a room: walking, sitting, reading at the desk | the reference sheet's walk, sit, read, tend plant (not started) | tier 3 × directions × actions, plus paths and depth | highest | only if §6 settles on Lumi living in the room |

**Why tier 2 looks like the best bet.** The character is almost built for it. The face is a flat void, so the eyes are two glowing shapes on black that code can draw, move and reshape — and §2 says every expression is an eye change. The hood and cloak are exactly the parts the pipeline keeps fighting to hold still across generated frames (`hold_head`, `settle`, the head IoU gate); as layers they hold by construction. One well-separated drawing could carry blink, glance, happy, curious, sleepy and a lantern sway without another sheet. The risk is the puppet look: stiff parts sliding over a painted body. The *Coherence* mockup's notes already name Rive; layered images moved with CSS transforms are the alternative with no new dependency.

## 5. What Lumi's motion means

Motion is part of Lumi's voice, so it follows the voice guide in `product.md`: calm, observant, warm, lightly playful, never cheerleading.

- **Presence, not performance.** Idle motion stays below what pulls the eye while someone works: today a 2px breath every ~3 s and a blink every 2.5–6.5 s, nothing else. Anything larger is a reaction, not an idle.
- **Lumi moves in answer.** Reactions follow something the user did or something that changed — the same rule as speech, where Lumi speaks unprompted only for check-ins. The live example: sending from the bubble earns a blink.
- **States come from the app, never from the user.** Every animated state is derived from what already happens. Nobody sets Lumi's mood.
- **Celebrate small.** The reference sheet's jump and sparkles are the ceiling. A finished task gets warm eyes, not confetti.
- **One motion in view at a time.**
- **Stillness is complete.** Under `prefers-reduced-motion` nothing moves, and a still Lumi must still read as present: glowing eyes, a lit lantern. Every rest frame is a finished illustration.

**Behaviour map.** Derived states and what Lumi could do in each. Only the first two are built; the rest are candidates, to be tested against the principles above at the cheapest tier that can carry them.

| When (derived) | Lumi | Tier | Status |
|---|---|---|---|
| Any page, nothing happening | breathes, blinks | 1 | live |
| A message sent from the bubble | one blink, a "got it" | 1 | live |
| Lumi is writing a reply | eyes narrow, or a glance up | 1–2 | idea |
| A focus session is running | works alongside, very quietly — the reference sheet's *Read* or *Write*; body doubling made visible | 2–3 | idea; the strongest fit with the product |
| The check-in card appears | looks toward the user | 2 | idea |
| *Done* | a small eye-smile, the lantern brightens | 0–1 | idea |
| Back after days away | looks up and brightens — the reference sheet's *Return* | 0–2 | idea |
| Late at night | softer light, a slower breath; never asleep while the user works, which would read as a nudge to stop | 0–1 | idea; check against *never confront* |

## 6. Two places Lumi lives

**Companion, today.** Fixed in the viewport's corner on every page, over the ivory paper or, on Home, over the dark room. Screen coordinates, one scale, no depth.

**Resident, the room's invitation.** Standing on the floor of Home's painted room, moving between the desk, the armchair and the rug. That needs things the companion does not:

- **Projection.** The room is an isometric cutaway seen from above; Lumi's sheets are drawn near eye level. A resident needs drawings at the room's angle, and walking in an isometric room needs four diagonal directions, not the reference sheet's left and right.
- **Scale and light.** A size relative to the furniture; a contact shadow that works on dark wood (the cut's baked cream shadow reads as a pale smudge on a ground as dark as the room's); a lantern glow that lights the room, not the paper.
- **Depth and paths.** Lumi passes behind the table and in front of the chair, so the walkable floor has to be marked on the painting.
- **Attention.** The room is dimmed behind the conversation; whatever Lumi does there must not pull the eye from it.

**Recommendation:** keep the companion as the one Lumi on every page. Try the resident on Home only after tier 2 exists, and start with a still — the current rest frame placed on the room's floor at the room's scale, judged on the review port before any walking is drawn.

## 7. Keeping the character consistent

The generator redraws Lumi every time. Between the cut source and the reference sheet the medallions became a scarf; between Rali and the lantern everything but the silhouette changed. Every sheet pays for a consistency check, and every drawn loop inherits the drift.

- **One model sheet as canon.** Front, three-quarter both ways, side, back and the eye shapes, chosen by Chanté and committed to `art/lumi/`, with the costume written beside it and counted: which ornament on the hood, ribbon or scarf, how many medallions, boots or not.
- **Every prompt attaches it and lists the costume,** and the prompt is saved as a file (`animation-pipeline.md` backlog #4).
- **Measure against it.** The measure script compares heads frame to frame; comparing a new sheet's silhouette and palette to the model sheet is the natural next gate.
- **Draw the character once.** The strongest consistency move is tier 2: the generator supplies one drawing and code does the rest.

## 8. Bets under test

The evolving part. A bet moves to *Settled*, with a `decisions.md` entry, or to *Dropped*, with the reason; it is never silently deleted. Every animation session asks whether it tested one.

| # | Bet | Why | Cheapest test | What would change our mind | Status |
|---|---|---|---|---|---|
| 1 | Expressions are eye shapes drawn in code, not cells cut from sheets | the void face; every expression sheet changes only the eyes (§2) | draw the six avatar expressions as shapes over the rest cell's face and compare them with the cut heads at 36–68px | at avatar size the drawn eyes read as stickers on a painting | open |
| 2 | Frequent motion is layered (tier 2); drawn sheets only for signature moments | the ladder's costs and the drift (§4, §7) | one evening: split the rest cell into hood, face, eyes, lantern and body; animate a blink, a glance and a lantern sway; show it beside the current sprite on the review port | Chanté can tell it is a rig and it looks cheaper than the sprite | open |
| 3 | The world responds to what happened, never to what didn't | §3; the one question | any care-loop or reward idea gets an `ef-burden-log.md` row first and one question: *does a bad week make the world sadder?* | a version that fades gently and still lowers burden in dogfooding | proposed |
| 4 | Lumi is the companion everywhere and, one day, a resident on Home | §6 | a still placed at room scale on Home's floor | the room reads busier and the conversation loses the eye | open |
| 5 | Every room Lumi can enter shares one projection | walking depends on it (§6) | choose between the isometric cutaway (served) and the eye-level mockups before a second room is painted | — | open |
| 6 | A focus session shows Lumi working alongside | body doubling made visible (§5) | a still of Lumi reading near the session bar, then a tier-1 page turn | it reads as a distraction during focus | open |

**Settled:** none yet. **Dropped:** none yet.

## 9. Questions for Chanté

1. **Lumen or Coherence?** Three mockups carry *Coherence*; the app and the docs say Lumen. Is the art directing toward a rename?
2. **Which costume is canon?** The cut source's ribbon and medallions, or the reference sheet's scarf?
3. **Lumi's pronoun.** `product.md` and `design-philosophy.md` say *he*; the animation docs and the code comments say *she*.
4. **Is Lumi's World in scope,** and if it is, on §3's terms?
5. **Isometric or eye-level** for the rooms Lumi can walk in?
6. **Worth a tier-2 spike,** and if so Rive or layered images with no new dependency?

## 10. How this doc evolves

- **A new sheet, painting or mockup** gets a row in §1 and a check against §2 and §3.
- **An animation session** names its tier in its ledger row in `animation-pipeline.md`, and moves any bet it tested here.
- **An answer to §9** moves into the section it settles; if it changes a rule, it also goes into `decisions.md` and `design-philosophy.md`.
- **The version in the header** goes up when a bet settles, with a line in the change log.

## Change log

- 2026-09-12 — v0.1: written after the lantern character, the Home room and the art reorganisation. Where the art has been, the invariants, the book-or-world tension with a proposed synthesis, the ladder of animation costs, motion principles and a behaviour map, companion and resident, character consistency, six bets, six questions.
