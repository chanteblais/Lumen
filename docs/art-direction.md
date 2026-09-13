# Coherence art direction — the evolving strategy

*v0.2 — DRAFT · 2026-09-12 · written from the sheets, paintings and mockups in `art/` and three days of animation work. Hypotheses, not rules: each bet in §8 moves to Settled or Dropped as it is tested, and a settled one gets its entry in `decisions.md`.*

**Who this is for:** Chanté and Claude, whenever the work changes what Lumi or a scene looks like or how Lumi moves — a new sheet, a painting, a mockup, a new kind of motion. Read §2, §3 and §8 before generating anything.

**Where it sits:** [Visual Language](design/visual-language.md) and [Motion & Interaction](design/motion-and-interaction.md) govern shared design direction. [Spaces](product/spaces.md) (§23–28, §33, §35–37) governs related environments and metaphor limits; [Garden](product/today-garden.md) (§32–43, §63–71) applies continuity and quiet to Today. This document preserves art history, production reasoning and proposals. Older reward or book-only alternatives below are historical; approved continuity-based growth governs. Exact spatial interactions remain open. `animation-pipeline.md` and `art/README.md` retain production methods; `design-system.md` describes what ships.

---

## 1. Where the art has been

Three directions in three days. Each move kept something and dropped something; the table is the record, newest first. Add a row whenever a sheet, painting or mockup arrives.

| Date | Artefact | What it is | Kept | Dropped or open |
|---|---|---|---|---|
| 2026-09-13 | `assets/icon-sheet.png` | Sixty painted icons in brass, parchment and forest green on a soft brown ground: the places, interface controls, books and scrolls, reflective objects, everyday tools, and a plant's growth from seed to bloom and wilt with garden tools | nothing yet — an asset in progress, not cut or served | painted icons against the nav's line icons (the rail uses line icons in the painting's brass); the plant stages and the wilt against the garden canon (growth without judgement, nothing decays); hearts and sparkles as general ornament (`design/visual-language.md` §5) |
| 2026-09-13 | `ui/nav-parchment.png` | The nav's sheet painted on its own: warm aged paper, a browned rim, rounded corners, a thin brown rule inset along the edges, small flourishes with sparkles at the corners, on a painted checkerboard | served as the nav's parchment on every page, cut into a head, a stretching body and a foot that keep the flourishes whole; 192px wide beside the rail | the mockup's icons beside the names on the sheet (each name still sits beside its rail icon) |
| 2026-09-13 | `ui/nav-rail.png` | The nav rail painted on its own: mottled olive green, a brass rule down each side, chamfered ends with corner flourishes, the compass star with sparks at the head, a spark, the moon and a star at the foot, on a painted checkerboard | served as the nav's rail on every page, cut into a head, a stretching body and a foot; its star is the pin button, its brass the icons' colour | the first painted UI piece, so the book-or-world question (§3) now reaches the chrome; the checkerboard painted in (a transparent PNG would skip the keying) |
| 2026-09-13 | `mockups/rail-nav.png` | The Library room with a new nav: a narrow deep-green rail with a brass inset rule, a compass star at its head and a crescent moon at its foot, line icons for the places (house, sun, book, sprig, gear), and a parchment sheet beside it with the wordmark, *A quieter way forward.*, the names with their icons and *Progress lives here.* | built as the nav on every page, drawn in code: the rail, its marks and icons, the parchment that opens on hover and pins on a click, a star on the rail's rule for the open place | the names' icons inside the sheet (each name sits beside its rail icon instead); the lit tile kept and joined by the star; phones a trial |
| 2026-09-13 | `scenery/library/background.png` (was `background-smaller2.png`) | The reading circle smaller again: a low round table, two small armchairs, a stool, a floor cushion and two poufs, set forward on a wider rug, with open floor all round it; the architecture unchanged | served behind the Library as `public/library-room.webp`; Lumi's rest frame keeps her spot on the open floor right of the circle (painting px 1190, 890), now covering only floor and the rug's corner | at 150px she stands about twice an armchair's height, so whether the furniture or Lumi is the right size is for Chanté's eye on the review port |
| 2026-09-13 | `archived/scene_mockups/library-background-small.png` (was `scenery/library/background-small.png`) | The same room with furniture at Lumi's scale: the long table gone for a reading circle on the rug (a small round table, two armchairs, two stools, a floor cushion and a round pouf), so the centre bookcase stands clear down to its drawers; a sofa in the window seat | served behind the Library for under an hour, until the smaller circle above | the spatial map (`library-views.json`, `spatial-map/`) was measured on the long-table painting below: the architecture appears unchanged, but the table, its occluders and the anchors and routes around it are stale until redrawn |
| 2026-09-13 | `scenery/library/shelf-zoom.png`; `scenery/library/library-views.json` and `spatial-map/` | A bookcase close-up at reading scale: an arched *Knowledge* plaque over three rows, each under a dark gold-bordered Thread Group plaque (*Memory & Continuity*, *Ideas & Inspiration*, *Research & Resources*), titles on the spines, a lantern, a globe and plants as separators, an *In Progress* tray. With it, Claude's proposed map of the room: four collection slots, three expansions, 2:3 close-up frames, Thread Group rows and Lumi's anchors | the target information scale for a Collection (readable over showing the whole bay); the built-in plaque; the map is a proposal awaiting Chanté's approval | every word on its plaques and spines is the user's content, drawn in code and never painted; the motto under *Knowledge* (§3 rule 4); the *In Progress* tray reads as a status (§3 rule 3); the room is frontal perspective, not the isometric of bet 5 |
| 2026-09-13 | `archived/scene_mockups/library-background-long-table.png` (was `scenery/library/background.png`) | The blank-signs room repainted again: the same bays, boards, stove, gallery and stair, the shelves fuller (the centre bay's lower board gone for books), a moon-phase banner by the stair, the table and rug a little further back | the room the spatial map was measured on; never served — the reading-circle repaints above took its place behind the Library the same day | its long table, too big for Lumi and hiding the centre bookcase's lower shelves |
| 2026-09-13 | `archived/scene_mockups/library-background-blank-signs.png` (was `scenery/library/background.png`) | The reading room repainted with every sign and banner blank: arched bays of shelves under empty boards, the table moved forward onto the rug with a floor cushion and a stool, a stove on the left, the gallery and stair; no Lumi, no words | served behind the Library as `public/library-room.webp` (replacing the first painting the same day); Lumi's rest frame stands on the rug in front of the table | keeps §3 rules 3–4 as painted; the boards are collection slots in the IA below, and whether they ever carry names is [open question 3](living/open-questions.md) |
| 2026-09-13 | `scenery/library/library-spatial-information-architecture.md`, `scenery/library/book-template.png` | Chanté's spatial IA for the Library: Library → Collection → Thread Group → Thread; fixed architectural slots with dynamic identities; a thread's form shows its maturity (loose paper, folio, bound volume, several volumes); a Thread opens as a living book at the central table, re-entry first; Lumi shelves, retrieves and climbs. The template is that book empty: a tri-fold with tabs down each side, on the desk | the direction for the Library; nothing built | a close-up per slot keeping the wide room's landmarks, stable interactive regions for layered content, Lumi's library behaviours (§5); growth without levels matches `spaces.md` §14 |
| 2026-09-13 | `mockups/library-mockup.png`, `mockups/shelf-zoom.png` | The blank-signs room with its boards named (*Personal*, *School*, *Coherence*, *Relationships*, *Psychology*, *Ideas*, *More to explore…*) and a sleeping cat; a Collection close-up — a shelf signed *Coherence › Memory & Continuity*, thread spines, an *In Progress* tray, lines on cards | the IA's two outer scales: named slots over the painted architecture, a close-up that keeps its landmarks | names painted in vs layered by code (the IA wants regions); the lines on cards and shelf rails (§3 rule 4) |
| 2026-09-13 | `mockups/book-mockup-1.png` (was `book-mockup.png`), `mockups/book-mockup2.png`, `mockups/book_layout-mockup.png` | A Thread as an open book on the table: breadcrumbs, Contents, *Where we've arrived*, *Still alive*, *What we've settled — for now*, *How this thread changed*, Related, tabs; Lumi resting her chin beside it | the Thread view of the IA, with re-entry leading | not built; lines on cards and spines (§3 rule 4); search, tags and the action bar weighed against the one question |
| 2026-09-13 | `mockups/lumi-poses.png` | A pose sheet of the lantern character: idle, blink, looks, curious, happy, stretch, a walk cycle, run, pick up, carry, set down, examine, idea, sit, read, write, think, plan, tea, tend plant, celebrate, relax, sleep, telescope, record, clean, organise, return, welcome, goodbye, jump, spin; ten eye expressions; accessories | the behaviour vocabulary the Library asks for (carry, set down, organise, read, write) | poses, not in-betweens (§4, §7); a moon on the cloak and one brooch — check against the costume canon (§2) before anything is cut from it; its line, *Progress lives in the return* |
| 2026-09-13 | `mockups/library-background.png` (was `scenery/library-background.png`) | The first library painting: a lamplit cutaway with a long reading table on a rug, shelves and a ladder, a gallery with a telescope, a curving stair, a window seat with a sleeping cat. Signs over its bays — *Personal*, *Coherence*, *School*, *Glåüm*, *Lumi's Notes*, *Archive*, *Ideas*, *Psychology* — and a banner, *More Thoughtful Humans*. `archived/scene_mockups/library-background.png` is an earlier cut of it | served behind the Library for its first day | its words (§3 rules 3–4), settled by the blank-signs repaint |
| 2026-09-13 | `lumi/lumi-free-rest.png`, `lumi/lumi-model-sheet.png` | Generated by Claude: the hub, the wave's rest pose with the lantern gone and both hands empty; and a model sheet from it — five eye-level views and four facings at an isometric room's angle | the hub is the drawing every hands-free sheet is generated from (§4a); the model sheet is the §7 canon sheet, hands-free | whether hands-free is canon (bet 8); the isometric facings read steeper than the rooms, untested against one |
| 2026-09-13 | `lumi/lumi-free-wave.png`, `lumi/lumi-free-idle.png`, `lumi/lumi-free-pickup.png` | Generated by Claude from the hub: the wave without the lantern, her empty hands meeting in front of her, and taking a red book off a stack to hold at her chest | cut into `public/lumi-free.webp` and served as the companion on `ux/lumi-hands-free` — the hands as an idle variation, the wave on arrival, the pick-up (and, backwards, the set-down) from the dev cue strip | the first path (bet 7); a book on paper has no room to come from, so the stack fades in — in a room it would stand in the painting |
| 2026-09-13 | [Lumi pieces](https://claude.ai/code/artifact/36d8ad96-7c2c-44f1-b138-a033e27129b1) (a published page; built in `scratchpad`, not in the repo) | The pieces test: the hub split into a body, a head that moves on a mesh down to the bow, and eyes drawn in code — blink, sleepy, happy, curious, glances, a tilt, the breath — beside today's sprite, at 36, 68, 150 and 300px, on paper or a dark room | the test for bets 1 and 2 | not judged yet; the risks it names are a stiff hood, eyes that slide like stickers, straight lids |
| 2026-09-13 | `lumi/lumi-wave.png` | The first sheet Claude generated (`scripts/gen-lumi-sheet.py`): 24 in-betweens of one drawing — her free hand rises beside the hood, waves twice, lowers; the medallion costume, the lantern held throughout | the wave, played when you arrive (§5); its first cell is now the drawing the breath is made from, so every loop is one drawing | a slightly different hood from the lantern sheet's heads — the avatar and the corner are two drawings again (§7) |
| 2026-09-12 | `scenery/today/background.png` (was `scenery/today-background.png`) | The mockup's greenhouse painted empty: an isometric cutaway in late light, a raised bed at its heart, a pond, potting benches; no Lumi, no signs, no words | served behind Today as `public/today-room.webp`; Lumi's rest frame stands on its floor (the still of §6, tried on Today) | keeps §3 as painted — nothing in it counts, files or speaks; walking (§6) |
| 2026-09-12 | `mockups/today-mockup.png` (was `scenery/`) | A *Coherence* Today over an isometric greenhouse: Lumi watering a raised bed signposted by life area, a sleeping cat, *Tend What Matters* on a wall board, category chips, *In Season* progress bars (*3/5 steps*) | the layout, built on Today: breathing room, one paper panel on the right, the room visible with Lumi in it | the garden as a metaphor for tasks; the signposted bed, the wall board, the chips and step counts (§3) |
| 2026-09-12 | `scenery/home/background.png` (was `scenery/home-background.png`) | An isometric cutaway of a lamplit cabin room, repainted for more open floor for Lumi to wander | served behind Home as `public/home-room.webp` | whether Lumi walks in it (§6); its projection differs from the eye-level mockups (bet 5) |
| 2026-09-12 | `archived/scene_mockups/cohernece-mockup.png` | A *Coherence* Home: a painted hero with Lumi reading at a desk near a cat, chat below, a right rail with *Lumi's World — a cozy place to grow*, notes on a reward system, plant care loops and a Rive exploration | the painted room behind Home; the greeting | Lumi's World, rewards, care loops, due-date labels, the sidebar motto (§3) |
| 2026-09-12 | `archived/scene_mockups/home-mockup.png`, `background-mockup.png` | Eye-level painted rooms at dusk and at night, no Lumi; banners reading *Small steps still move the world* and *A quieter way forward* | the palette and the light | the banners |
| 2026-09-12 | `lumi/lumi-ref.png` | An *interaction animation sheet*: idle, look around, happy, walk left and right, run, sit, read, write, think, tend plant, inspect, hold lantern, celebrate, rest, return, observe, stretch, sit from behind | the behaviour vocabulary (§5) | its costume is off-model — a fringed scarf, no medallions; the medallions are canon (§2) |
| 2026-09-12 | `lumi/lumi.png`, `lumi/lumi-lantern-idle.png` | The lantern character: a sun-embroidered hood, ribbon and medallions, boots, a lantern; eight eye expressions; a storybook render | the character in the app today — the corner companion and the avatar heads | its sixteen cells are poses, not in-betweens, so one cell carries the body |
| ≤ 2026-09-11 | `archived/rali/rali.png` and the `rali-*` sheets | Rali: a paper-grain hooded figure in ivory, ink and brass, no feet, one button; eight eye expressions | the silhouette, the void face, the warm eyes, expressions made of eyes alone | the name, the paper render, the minimal costume |

**The drift in one line:** from a quiet ornament of the book (Rali) toward a small resident of a cosy painted world (the lantern Lumi in rooms and gardens). The code followed the character; the written philosophy has not caught up (§3).

## 2. What holds — the invariants

These have survived every drawing so far. Treat them as the character and everything else as costume.

- **The silhouette.** A peaked hood much bigger than the body, a dark void where the face is, two warm glowing eyes. Readable at 36px beside a message and at 150px in the corner.
- **Expression lives in the eyes.** Both expression sheets, Rali's and the lantern's, change only the eye shapes: ovals, arcs, lids, a wink. There is no mouth to draw.
- **Lumi carries warmth.** The eyes glow and, since the lantern, so does the light in hand; hands-free (§4a) the eyes carry it, and the lantern is a light she can pick up. In a dark room Lumi is a light source, not a figure lit by one.
- **The palette.** Ivory cloth, a near-black face, brass and amber in metal and light, sage or forest green in fabric and plants. A terracotta swatch appears in the reference sheet's palette only.
- **Small.** Never bigger than the thing the user is doing. The largest Lumi in the app is 150px tall, in a corner.
- **Quiet.** The reference sheet's own margin note: *Small movements. A quieter world. A kinder way forward.*

**Costume, canon since 2026-09-12:** the sun-embroidered hood, the ribbon with its brass medallions, the boots and the lantern — the lantern character as cut (`lumi/lumi-lantern-idle.png`, `lumi/lumi.png`). The fringed scarf in `lumi/lumi-ref.png` is off-model: use that sheet for its behaviours, not its costume. The costume can still change, but only through a new model sheet (§7), never through a generated frame. **Hands-free since 2026-09-13** (Chanté): she mostly holds nothing, and the lantern is a prop she can pick up rather than part of the costume (§4a, bet 8).

## 3. The book and the world — reconciled direction

The earlier tension is preserved below as lineage. The approved direction is inhabited places with a restrained editorial interface; continuity-based growth supersedes completion rewards.

**What the earlier docs said.** The [archived design philosophy](archive/2026-09-13-before-reconciliation/docs/design-philosophy.md) §2 puts Lumi fourth in order of permission — "small, sparing … a circular avatar beside her lines; never a full-body illustration in the working UI" — and leaves decorative imagery off the list. Its §3 says *never cute, gamified, cluttered*. `product.md` rules out gamification and streaks, and names "A calmer mind creates a brighter tomorrow" as the anti-example of copy on the walls. `CLAUDE.md`: the user never rates or tags anything.

**What the art does.** The corner companion shipped full-body on every page. Home is a painted room, repainted to give Lumi floor to walk on. The mockups add a cat, a garden of tasks, progress bars, a reward system, care loops, *Lumi's World*, and mottos on banners and wall boards — one of them, "A calmer mind can do remarkable things", a close relative of the named anti-example.

**Why both pull.** The book gives calm, legibility and a product that never nags. The world gives warmth, a reason to come back that is not a to-do list, and room for Lumi to be company rather than an icon — the body-doubling promise made visible.

**Synthesis, updated after approval on 2026-09-13:** *the world is Lumi's, not a ledger of yours.* The painted world can grow if it keeps the rules the product already lives by.

1. **Growth reflects continuity, not output.** A finished session does not earn a flower or any other unlock. Familiarity and accumulated context may shape the environment slowly; nothing wilts, empties or dims because of absence. The earlier “finished session might open a flower” hypothesis is superseded because it makes growth a completion reward.
2. **Nothing in it needs tending by the user.** No watering, feeding or collecting. Lumi does the tending; the user is a guest.
3. **No counts, categories or due dates in the painting.** Counts and due-date labels are what the [archived design philosophy](archive/2026-09-13-before-reconciliation/docs/design-philosophy.md) §4 already turned down in `rali-list.png`; category chips ask the user to file things.
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
| 3 · Drawn loop | In-betweened sheets from the image generator | the wave — live (2026-09-13); the slow sway and the foot kick, retired with Rali | by hand: 2–3 sheets, 3–5 rounds, 1–2 h each; generated by Claude with the Prompt lab: one run, 0 rounds, under an hour (the wave) | high: the generator redraws the character — lower once the prompt and reference are right (the wave's head held 0.986+) | a rare signature gesture |
| 4 · Scene action | Drawn loops placed in a room: walking, sitting, reading at the desk | the reference sheet's walk, sit, read, tend plant (not started) | tier 3 × directions × actions, plus paths and depth | highest | only if §6 settles on Lumi living in the room |

**Why tier 2 looks like the best bet.** The character is almost built for it. The face is a flat void, so the eyes are two glowing shapes on black that code can draw, move and reshape — and §2 says every expression is an eye change. The hood and cloak are exactly the parts the pipeline keeps fighting to hold still across generated frames (`align`, `hold`, `hold_hand`, `monotone_lower`, the head IoU gate — the wave needed all of them); as layers they hold by construction. One well-separated drawing could carry blink, glance, happy, curious, sleepy and a lantern sway without another sheet. The risk is the puppet look: stiff parts sliding over a painted body. The *Coherence* mockup's notes already name Rive; layered images moved with CSS transforms are the alternative with no new dependency.

## 4a. Poses, paths and pieces — the motion plan

*Claude's thinking on how to build many movements, kept current as the work lands (Chanté, 2026-09-13: "document your thoughts and keep them updated with the progress we make"). The* Progress *table is the state; the rest is rewritten whenever the thinking changes, not appended to.*

**The question it answers.** Would a library of every pose and gesture make movement easier to build? Partly, and partly we already have one: `mockups/lumi-poses.png` and `lumi/lumi-ref.png` are pose libraries, used today as a list of what Lumi could do. Played in a row they flicker instead of move, because each pose is a fresh drawing and the hood, ribbon and cloak change in every cell (the first foot sheet was exactly this, and cost a sheet and two rounds). A pose says *where* she ends up; movement is the *between*, and every hard problem so far has been there.

**Poses and paths — the library as a graph.**
- A **pose** is a finished drawing she can rest in: standing empty-handed (the hub), holding a book, sitting, reading. Every pose is drawn *from the hub*, as a variation of it, never as a fresh illustration — the same drawing with only what the pose changes.
- A **path** is a short in-betweened sheet from one pose to another, one drawing throughout, starting and ending on its poses. It is generated with its end poses attached, so the generator in-betweens toward a drawn target instead of inventing one from words.
- A **movement** is a walk through the graph: rest → reach → holding → set down → rest. `LUMI_LOOP_CELLS` already plays cells in any order, reversed and repeated, so one path is two movements: a pick-up played backwards is the set-down.
- Paths join only at a pose they share pixel for pixel — the rule every loop already keeps at the rest cell.

**Pieces — the frequent small life.** Blinks, glances, eye expressions, a head tilt and the breath need no path at all if the drawing is split into pieces that code moves (tier 2, bet 2). The wave already points there: it stopped jittering only once the cut treated every frame as the rest drawing with just the arm moving.

**Who does what, proposed:** pieces for whatever happens often and moves little; poses and paths for signature moments and anything she does with an object; scene actions (tier 4) only once both work.

**Hands-free by default (Chanté, 2026-09-13).** Lumi is mostly on her own, holding nothing; she picks things up in her environment and puts them down again. The lantern stops being part of her and becomes one of the things she can pick up (bet 8). That makes the empty-handed standing pose the hub of the graph and objects the first paths.

**Order of work.**
1. **The hub:** the rest pose without the lantern, from the wave's first cell (`art/prompts/lumi-free-rest.md`).
2. **The model sheet** (§7): front, three-quarter both ways, side and back, from the hub.
3. **The pieces test** (bet 2): the hub split into body, hood and eyes; a blink, a glance, the expressions and a small tilt moved by code, beside the sprite.
4. **First paths:** an idle with nothing in her hands, the wave without the lantern, and a pick-up (a book beside her, lifted to her chest) played back as a set-down.
5. **Wired on a branch** and judged on the review port.

### Progress

Newest first: what landed, what it showed, and what it changed in the plan.

| Date | Step | What happened | What it changed |
|---|---|---|---|
| 2026-09-13 | Review of the shadows | Chanté: standing on the flagstones, but her feet a little jittery; the shadow follows the wave and the pick-up well; good in the Library, on Home, on the paper pages and in Safari. The jitter was the boots, redrawn by each sheet, exposed once the baked shadow came off; they are held now in every loop, except where a cell's cloak covers them. Chasing a last 1.5px step in the pick-up found the approved sheet had three hands (two on the book, one still at the hem); regenerated with the resting hand named (v3), two hands throughout | Every layer taken off the sprite exposes what it hid, and no gate counts hands; a puppet would have one pair of boots and two hands by construction (bet 2) |
| 2026-09-13 | Shadows and light, drawn by the page | Chanté looked at the review server ("looks okay"), is open to puppeting, and named the shadow as what made her look superimposed. The cut no longer bakes a shadow in; the companion draws a contact shadow that darkens the floor, a cast shadow from her silhouette per room, and the room's light as a tint | Walking (§6) needs this anyway, and a puppet can cast its pieces' shadows the same way; next, a light computed from her position instead of one per room |
| 2026-09-13 | 5 · wired, for review | The three loops cut by a new spec-driven script and served as the companion on `ux/lumi-hands-free`: hands as an idle variation, the wave on arrival, the pick-up from the dev cue strip. Hood and boots hold within 0.25px on the cut cells. Every loop is held to one rest drawing; the cloak is eased where a loop leaves it, because each sheet draws it a little differently | Loops from several sheets need one rest drawing and eased joins; that is the cost of paths as separate sheets, and a reason pieces may carry more than planned |
| 2026-09-13 | 3 · the pieces test | Built by a subagent and published as a page: one drawing, a head moved on a mesh that bends down to the bow, eyes drawn in code with blink, sleepy, happy, curious, glances and a tilt, beside today's sprite. Checked in renders, not yet in a browser: no seam at the bow, no ring where the painted eyes were; blink, sleepy and happy read at 36px, glances barely | Awaiting Chanté's verdict (bets 1 and 2). Weak spots it names: the hood tilts stiffly, the eyes slide without foreshortening, the lids are straight |
| 2026-09-13 | 1 · the hub · 2 · the model sheet · 4 · first paths, generated | The hub passed on its first run (four near-identical candidates) → `lumi/lumi-free-rest.png`. The model sheet passed on its first run: nine views, the costume the same in all → `lumi/lumi-model-sheet.png`. The hands-together idle and the hands-free wave passed every gate on their first run (head IoU ≥ 0.988 every step) → `lumi/lumi-free-idle.png`, `lumi/lumi-free-wave.png`. The pick-up drew the movement well but left three books on the stack after lifting one → v2. Not yet approved by Chanté or cut | Sheets drawn from a drawn hub hold the drawing at least as well as the wave did from the lantern sheet. The generator ruled lines between the cells on five of eight grid candidates, so the measure script paints them over |
| 2026-09-13 | Plan | This section, bets 7 and 8 | — |

## 5. What Lumi's motion means

Motion is part of Lumi's voice, so it follows the voice guide in `product.md`: calm, observant, warm, lightly playful, never cheerleading.

- **Presence, not performance.** Idle motion stays below what pulls the eye while someone works: today a 2px breath every ~3 s and a blink every 2.5–6.5 s, nothing else. Anything larger is a reaction, not an idle.
- **Lumi moves in answer.** Reactions follow something the user did or something that changed — the same rule as speech, where Lumi speaks unprompted only for check-ins. The live example: sending from the bubble earns a blink.
- **States come from the app, never from the user.** Every animated state is derived from what already happens. Nobody sets Lumi's mood.
- **Celebrate small.** The reference sheet's jump and sparkles are the ceiling. A finished task gets warm eyes, not confetti.
- **One motion in view at a time.**
- **Stillness is complete.** Under `prefers-reduced-motion` nothing moves, and a still Lumi must still read as present: glowing eyes, a lit lantern. Every rest frame is a finished illustration.

**Behaviour map.** Derived states and what Lumi could do in each. Only the first three are built; the rest are candidates, to be tested against the principles above at the cheapest tier that can carry them.

| When (derived) | Lumi | Tier | Status |
|---|---|---|---|
| Any page, nothing happening | breathes, blinks; now and then her empty hands come together in front of her and part | 1; the hands 3 | live (the hands since 2026-09-13, hands-free) |
| She has a reason to handle something (none wired yet) | picks up a book and holds it, sets it down — one path played both ways | 3 | built, dev cue strip only (2026-09-13) |
| A message sent from the bubble | one blink, a "got it" | 1 | live |
| Arriving: the app opened or its tab shown after 30 min or more away, or a first visit | waves once, then breathes | 3 | live (2026-09-13); the one drawn gesture — a greeting, rare by construction |
| Lumi is writing a reply | eyes narrow, or a glance up | 1–2 | idea |
| A focus session is running | works alongside, very quietly — the reference sheet's *Read* or *Write*; body doubling made visible | 2–3 | idea; the strongest fit with the product |
| The check-in card appears | looks toward the user | 2 | idea |
| *Done* | a small eye-smile, the lantern brightens | 0–1 | idea |
| Back after days away | looks up and brightens — the reference sheet's *Return* | 0–2 | idea |
| Late at night | softer light, a slower breath; never asleep while the user works, which would read as a nudge to stop | 0–1 | idea; check against *never confront* |

## 6. Two places Lumi lives

**Companion, today.** Fixed in the viewport's corner on every page, over the ivory paper or, on Home, over the dark room. Screen coordinates, one scale, no depth.

**Resident, the room's invitation.** Standing on the floor of Home's painted room, moving between the desk, the armchair and the rug. That needs things the companion does not:

- **Projection: isometric, decided 2026-09-12.** Every room is an isometric cutaway seen from above, like the served Home room. Lumi's sheets are drawn near eye level, so a resident needs drawings at the rooms' angle, and walking in an isometric room needs four diagonal facings, not the reference sheet's left and right. Still open: whether the corner companion moves to the same angle, since on Home she already stands over an isometric room.
- **Scale and light.** A size relative to the furniture; a contact shadow that works on dark wood (the cut's baked cream shadow reads as a pale smudge on a ground as dark as the room's); a lantern glow that lights the room, not the paper. *Since 2026-09-13 (hands-free branch) her shadow is drawn by the page: a contact shadow that darkens the floor itself, a cast shadow from her silhouette away from each room's light, and the room's light tinting her. Still to come for walking: a light that moves with her position (a lamp she passes), and shadows that follow a puppet's pieces.*
- **Depth and paths.** Lumi passes behind the table and in front of the chair, so the walkable floor has to be marked on the painting.
- **Attention.** The room is dimmed behind the conversation; whatever Lumi does there must not pull the eye from it.

**Recommendation:** keep the companion as the one Lumi on every page. Try the resident on Home only after tier 2 exists, and start with a still — the current rest frame placed on the room's floor at the room's scale, judged on the review port before any walking is drawn.

**Tried on Today first, 2026-09-12 (Chanté's ask, after the Today mockup):** the rest frame at the companion's 150px, standing on the greenhouse floor behind the raised bed on windows 1100px and wider — a spot in the painting's own pixels mapped through the cover fit, so she keeps her flagstone at any size (`design-system.md` → Today: the garden). What it taught: she is always drawn on top, so a spot must sit where everything she overlaps is further back (her feet lower on screen than anything she covers); as a still, her eye-level drawing sits acceptably on the isometric floor; she is not yet scaled to the furniture, and she does not walk. Home is unchanged; Chanté's judgement on the review port decides bet 4.

## 7. Keeping the character consistent

The generator redraws Lumi every time. Between the cut source and the reference sheet the medallions became a scarf; between Rali and the lantern everything but the silhouette changed. Every sheet pays for a consistency check, and every drawn loop inherits the drift.

- **One model sheet as canon.** The costume is decided (the medallions, §2); the sheet itself is still to draw: front, three-quarter both ways, side and back, the four isometric facings seen from above at the rooms' angle, and the eye shapes. It is committed to `art/lumi/` with the costume counted beside it: the hood's ornaments, how many medallions, the boots, the lantern.
- **Every prompt attaches it and lists the costume,** and the prompt is saved as a file (`art/prompts/<sheet>.md`, since 2026-09-13; `animation-pipeline.md` → Prompt lab).
- **Measure against it.** The measure script compares heads frame to frame; comparing a new sheet's silhouette and palette to the model sheet is the natural next gate.
- **Draw the character once.** The strongest consistency move is tier 2: the generator supplies one drawing and code does the rest.

## 8. Bets under test

The evolving part. A bet moves to *Settled*, with a `decisions.md` entry, or to *Dropped*, with the reason; it is never silently deleted. Every animation session asks whether it tested one.

| # | Bet | Why | Cheapest test | What would change our mind | Status |
|---|---|---|---|---|---|
| 1 | Expressions are eye shapes drawn in code, not cells cut from sheets | the void face; every expression sheet changes only the eyes (§2) | draw the six avatar expressions as shapes over the rest cell's face and compare them with the cut heads at 36–68px | at avatar size the drawn eyes read as stickers on a painting | open — tested 2026-09-13 in the pieces page (§4a): blink, sleepy and happy read at 36px in renders; awaiting Chanté's eye |
| 2 | Frequent motion is layered (tier 2); drawn sheets only for signature moments | the ladder's costs and the drift (§4, §7) | one evening: split the rest cell into hood, face, eyes, lantern and body; animate a blink, a glance and a lantern sway; show it beside the current sprite on the review port | Chanté can tell it is a rig and it looks cheaper than the sprite | open — evidence for, 2026-09-13: the wave only stopped jumping once the cut treated the drawn sheet like layers (every frame is the rest drawing except the arm; inside the waves, except the hand) — two review rounds spent making a drawn loop behave like a rig. Tested 2026-09-13: the pieces page (§4a) is up for Chanté's verdict (she is open to puppeting); and the hands-free cut needed eased joins and held boots because each sheet draws the cloak and boots differently, more evidence that drawn loops fight consistency |
| 3 | Growth reflects continuity, not productivity | Approved reconciliation; V§14 and EP§14 | Evaluate whether a proposed change remains meaningful without a completion trigger | Concrete environmental mechanisms remain open | **Settled principle, 2026-09-13.** No reward economy, completion unlocks or absence punishment. Supersedes the flower-per-session hypothesis; [Garden](product/today-garden.md) §34 and §67. |
| 4 | Lumi is the companion everywhere and, one day, a resident on Home | §6 | a still placed at room scale on Home's floor | the room reads busier and the conversation loses the eye | open — a still tried on Today first (2026-09-12, §6). [`today-garden.md`](product/today-garden.md) §39–41 wants her inhabiting the Garden too: wandering slowly, standing near what's being tended, turning toward the chosen thing, starting toward the Study when focus begins, always subtle, never a tour guide (§40); on a phone her presence stays (§148, open question 27) |
| 5 | Every room Lumi can enter shares one projection | walking depends on it (§6) | — | — | **settled 2026-09-12: isometric** |
| 6 | A focus session shows Lumi working alongside | body doubling made visible (§5) | a still of Lumi reading near the session bar, then a tier-1 page turn | it reads as a distraction during focus | open |
| 7 | Movement is built as poses and paths: finished poses drawn from one hub, joined by short in-betweened sheets generated with both ends attached (§4a) | a pose library alone flickers; the loop order already reverses and repeats cells | one pick-up path from the hub, played forward and backward | the generator can't land a path on a drawn end pose, so every join needs the cut to force it | open — the pick-up (2026-09-13) plays forward and backward from one sheet with its hood and boots within 0.5px; its end pose was described, not attached, so landing on a drawn pose is still untested |
| 8 | Lumi is hands-free by default; the lantern, like a book or a cup, is something she picks up (§4a) | Chanté, 2026-09-13; handling things in her world makes her a resident, not an emblem | the hub drawn without the lantern, then a pick-up | without a light in hand she loses the warmth §2 gets from it | **settled 2026-09-13** (Chanté: "Lumi will be hands free often"): hands-free is her usual state and the lantern is a thing she can pick up, not part of her. The lantern body stays served beside the hands-free one for now; retiring it is `animation-pipeline.md` backlog #2 |

**Settled:** bet 3, continuity-based growth (2026-09-13); bet 5, isometric rooms (Chanté, 2026-09-12; `decisions.md`); bet 8, hands-free by default (Chanté, 2026-09-13; `decisions.md`). **Dropped:** none yet.

## 9. Questions for Chanté

**Answered 2026-09-12:** the product is **Coherence** · the canon costume is **the medallions** (§2) · Lumi is **she** · rooms are **isometric** (§6, bet 5). Recorded in `decisions.md`.

**Still open:**

1. **Is a separate Lumi’s World useful?** Still open as a distinct feature; no new space is approved. The growth question is settled: existing spaces may develop through continuity, with no reward economy, required care or absence cost. [Spaces](product/spaces.md) §26–29 and §37; open questions 7–8.
2. **Try a puppet version of Lumi?** Today every movement is a set of whole drawings, one per frame, redrawn by the image generator, which draws her a little differently every time. The alternative cuts one drawing into pieces — hood, face, each eye, lantern, body — and lets code move the pieces: the eyes change shape, the lantern swings, the head tilts. The test is one throwaway evening, shown beside today's Lumi on the review server, to see whether it looks alive or like a cheap puppet. Isometric raises the stakes: walking needs four facings, so four sets of pieces instead of four drawn sheets for every movement. (Bet 2.) *(2026-09-13: Chanté said go ahead; the test is step 3 of §4a, and she is open to puppeting.)*

## 10. How this doc evolves

- **A new sheet, painting or mockup** gets a row in §1 and a check against §2 and §3.
- **An animation session** names its tier in its ledger row in `animation-pipeline.md`, and moves any bet it tested here.
- **An answer to §9** moves into the section it settles; if it changes a rule, it also goes into `decisions.md` and `design-philosophy.md`.
- **The version in the header** goes up when a bet settles, with a line in the change log.

## Change log

- 2026-09-13 — Bet 8 settled: Lumi is hands-free often, the lantern a prop (Chanté). §4a's hands-free work is no longer a proposal; bet 2 (pieces) stays open.
- 2026-09-13 — Merged with the reconciliation: bets 3 and 4 and §9 question 1 take the reconciled text; bets 1 and 2 and question 2 keep the hands-free session's evidence.
- 2026-09-13 — v0.2, no bet moved: §6 *Scale and light* notes her shadow and light are drawn by the page now; a §4a progress row for it, with Chanté's first look (looks okay; open to puppeting).
- 2026-09-13 — v0.2, no bet moved: §1 rows for the hub, the model sheet, the three hands-free sheets and the pieces page; §4a progress (wired for review; the pieces test built); evidence on bets 1, 2 and 7.
- 2026-09-13 — v0.2, no bet moved: §4a, the motion plan (poses and paths, pieces, hands-free by default, the order of work and a progress table kept current); bets 7 (poses and paths) and 8 (hands-free, the lantern a prop); §2 notes hands-free; §9 question 2 is being tried.
- 2026-09-13 — Reconciliation: visual direction and continuity-based growth now govern §3 and bet 3. The earlier dated entries below refer to the previous document editions; use the [section crosswalk](living/reconciliation.md) for current numbering.

- 2026-09-13 — v0.2, no bet moved: `docs/product/today-garden.md` joins the canon. Bet 3 notes that its §33 and §66 rule out completion-driven growth in the Garden too; bet 4 notes what it wants of Lumi in the Garden (§38–40) and on a phone (§148). §3's rule 1 isn't rewritten until Chanté settles open question 14.
- 2026-09-13 — v0.2, no bet moved: `art/` reorganised (a folder per place in `scenery/`); the Library's repaint with blank signs is served, and §1 gains rows for it, Chanté's Library IA and book template, the library and shelf mockups, the book mockups and the pose sheet.
- 2026-09-13: `docs/product/spaces.md` joins the canon. *Where it sits* names it and its §21–29. Bet 3 notes that it rules out completion-driven decoration, which §3's rule 1 still allows; rule 1 isn't rewritten until Chanté settles open question 14.
- 2026-09-13 — v0.2, no bet moved: the Library's painting arrived and is served behind the renamed Library page; §1 gains its row, with its signs left open against §3 rules 3–4.
- 2026-09-13 — v0.2, no bet moved: `docs/spaces.md` arrived (Chanté's spatial architecture). Where it sits names it; bet 3 notes that it is stricter about completions; §9 question 1 notes that it largely answers Lumi's World. *(Moved into the canon the same day as `docs/product/spaces.md`, without its §30: the tensions it listed live in `docs/living/open-questions.md`.)*
- 2026-09-13 — Bet 2 gains evidence for: the wave stopped jumping only once the cut held the drawn sheet like layers (the rest drawing everywhere but the arm, and inside the waves everywhere but the hand), after two review rounds.
- 2026-09-13 — The wave: §1 row for `lumi-wave.png` (the first sheet Claude generated), §4 tier 3 gains it and its cost, §5's behaviour map gains arriving → a wave (live). No bet moved; it is the tier-3 "rare signature gesture" §4 already reserved drawn sheets for.
- 2026-09-12 — v0.2: Chanté's answers — the product is Coherence, the medallions are canon, Lumi is she, rooms are isometric (bet 5 settled). §2 costume, §6 projection, §7 model sheet and §9 rewritten; the two open questions reworded plainly.
- 2026-09-12 — v0.1: written after the lantern character, the Home room and the art reorganisation. Where the art has been, the invariants, the book-or-world tension with a proposed synthesis, the ladder of animation costs, motion principles and a behaviour map, companion and resident, character consistency, six bets, six questions.
