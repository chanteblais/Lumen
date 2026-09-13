# The Library's spatial map — proposal, v2

*2026-09-13 · Claude. Drawn on `../background.png`, the painting the Library serves (the reading circle on a wide rug), with `../shelf-zoom.png` as the reading scale and `../library-spatial-information-architecture.md` as the governing IA. v1, earlier the same day, was measured on the long-table painting (now `art/archived/scene_mockups/library-background-long-table.png`). Nothing here is approved, and no close-up has been generated.*

The images in this folder are annotations drawn by `scripts/draw-library-map.py` from the manifest, `../library-views.json`. The numbers live in the manifest, so edit them there and redraw. The production painting is never touched.

| Image | Shows |
|---|---|
| `slots.png` | The numbered collection slots (click regions), each plaque and its label text-safe zone, the Thread Group rows, each 2:3 close-up frame, the reserved expansions and the central table |
| `lumi.png` | Lumi's anchors and routes, her estimated height at each anchor, the occluders, and what the rail, a pinned parchment, the top-right clock cluster and the cover crop hide at four window sizes |
| `closeups.png` | Each collection's close-up frame cut from the painting, with its rows, Thread Group plaque zones, entry viewport, anchors and her height projected into it |
| `stills.png` | Lumi's rest frame placed at her standing anchors at the manifest's depth scale, to judge her size against the room (always drawn on top; occluders ignored) |

## What v2 changed

- **The architecture held.** A pixel diff between the two paintings shows no change above the floor except the alcove's furniture and the window bay's seat. So the slots, plaques, Thread Group rows and close-up frames carry over unchanged.
- **The long table is gone, and with it v1's concerns 2 and 3.** The floor in front of every bookcase is open and in view, so Lumi can walk right up to the centre bay. No route needs the front edge the 16:9 crop cuts off.
- **`central_table` is now the low round table** in the reading circle: about 225 painting px wide, room for one or two volumes. A spot for setting a volume down needs a cut-out of the table drawn over her (`reading_table_items`), because the cushion and poufs fill the gaps in front of it.
- **Lumi is smaller than v1 said, and shrinks less toward the back.** Her drawing is 128px of the companion's 150px box. The depth scale now follows the floor tiles' perspective (horizon near y 0.40, about 0.6× at the back wall) instead of v1's 0.42, which came from the long table's furniture.
- **The rail nav** replaced the 272px sidebar. The folded rail takes 74px; the parchment floats out to 270px when hovered or pinned; the top bar is a small clock cluster at the top right. The window bay is now in view on most desktop windows.
- **The window bay lost its book cubbies** to a sofa, so it can no longer hold a small Collection on shelves.
- **`book-template.png`** was drawn for a big desk and no longer matches the room's low round table.

## The model as understood

- **The wide room is the map of what exists.** A few stable architectural slots (`collection_01`…) hold whatever Lumi has found to be a Collection for this user. A Collection's name is drawn in code on its slot's blank plaque and stored as data, never in the ID or the painting.
- **A Collection is a readable viewport, not a picture of a bookcase.** The camera moves into a canonical close-up of that exact bay, at the scale of `shelf-zoom.png`. About 2–3 shelf rows are in view and the rest are reached by panning, so the bay feels larger than the screen.
- **A Thread Group is a shelf row.** It has a dark, gold-bordered plaque built into the shelf, with 4–8 Threads standing on it as titled spines, folios or papers. Moving between groups is a pan inside the close-up, not another view.
- **A Thread ends the spatial navigation.** Selecting one crossfades straight to the table and the book opens at once. Lumi's fetching runs alongside and never delays it.
- **Layers stay apart.** Architecture is painted once. Names, Threads, maturity forms, Lumi and hover or selected states are composited, so the Library changes without a repaint.
- **Everything spatial has a plain equivalent:** headings, links, keyboard, search and direct URLs.
- **Shelves are a view, not the life model.** The IA's reconciliation note and `lists-library.md` §34 say Collections and Thread Groups are how the Library shows Threads, not a nesting the life model must obey.

## Slots

Numbered left to right among the strong slots. A slot's ID becomes permanent at approval, not before.

| ID | Place | Why |
|---|---|---|
| `collection_01` | The ladder bookcase, second from left | Full-height case with its own plaque and 5 rows, clearly bounded by pilasters and sconces. The ladder is the one place Lumi can visibly climb. |
| `collection_02` | The centre bookcase behind the reading circle | The focal point, densest and best lit, with 5 rows of 7–8 readable volumes. Its row proportions match the reference close-up almost exactly (row width to height ≈ 3.6). A user's first Collection belongs here. Now in view down to its drawers. |
| `collection_03` | The narrow stair bookcase, right | The other floor-level case, with a plaque and open floor in front, nearest Lumi's spot today. It has 4 rows of about 5 volumes. |
| `collection_04` *(conditional)* | The reading alcove under the gallery | Its own plaque and the most distinctive place in the room, but almost no shelving. Its Thread Groups would be surfaces: the edge-on inner bookcase, the side table, the sill. It could be an expansion instead (question 2). |
| `expansion_01` | The gallery, up the stair | Books already line it. Lumi can walk up rather than climb. |
| `expansion_02` | The archive beyond the far-right doorway | The painting already shows another room through it, and the diamond plaque can name it (*a mature body of work may require another room*). |
| `expansion_03` | The window bay, far left | It has a plaque and is now in view beside the folded rail, but a sofa replaced its cubbies: a place to sit, not to shelve. |

Not reserved: the high shelves above the ladder and centre bays (cropped at 16:9 and under the chandelier; perhaps a quiet archival layer one day), and the wall of prints between the centre bay and the alcove (kept as breathing room).

**Fewer than 5–7 on purpose.** The painting has three true bookcases at floor level. Forcing more means splitting a bay, which reads as folders, or using places a user can't see. A new user rarely has more than four domains (`spaces.md` §14's examples have four), and the room makes space as they arrive.

## Thread Groups

One per shelf row, as `collection_NN.thread_group_MM`, numbered top to bottom:

- 01: 5 rows. The ladder crosses the right third of rows 2–5, leaving 4–6 volumes a row.
- 02: 5 rows, 7–8 volumes each.
- 03: 4 rows, 4–5 volumes each.
- 04: 3 surfaces.

A plaque takes the top ~30% and left ~55% of its row. Overflow pages or scrolls sideways along the row; typography is never shrunk.

## Lumi

Anchors and routes are in the manifest and drawn on `lumi.png`:
- **Anchors:** `home` (her spot today, painting px 1190, 890), an aisle behind the reading circle, an approach for each slot, the ladder foot and top, the centre bay's cabinet top, a drawer-step at the stair bay, the alcove's armchair and side table, the window bay's sofa, the floor cushion and a place at the table.
- **Routes:** a few authored polylines, with no pathfinding. Every one stays in view, round the back of the circle.

**Her scale** (`stills.png`, still an estimate):
- At home she is about 137 painting px, about 1.6× the reading circle's armchairs.
- At the back wall she is about 0.6× that: roughly a drawer cabinet tall and 1.5 shelf rows. From the floor she reaches the centre bay's bottom row; from the cabinet top, row 4; from the ladder, the rest.
- Against the architecture she is consistent: the far doorway is about 3.6 of her, the alcove's armchair about 1.35. The reading circle's furniture is the odd one out, at about half the alcove armchair's scale.
- In a close-up she is 1.5–2 rows tall: big enough to hold a volume, small enough to need the ladder.

## Concerns

1. **The table spot needs a mask.** Setting a volume on the round table means standing behind it, with a cut-out of the table and its things drawn over her. It's small and cheap, but it is the one place she is not simply drawn on top.
2. **Projection.** The Library is a frontal perspective interior, not the isometric `art-direction.md` bet 5 settled for every room Lumi enters. Frontal is what makes readable close-ups possible, and it suits her eye-level drawings better than the isometric rooms do (question 3).
3. **The window decides what's visible.** Under today's cover fit, beside the rail:
   - At 1100×900 the rail hides x < 0.147 (most of the window bay) and everything right of x 0.907 is cropped (the doorway).
   - A pinned parchment hides x < 0.19 at 1440×900 and x < 0.293 at 1100×900 (half of `collection_01`), and the page never moves for it.
   - At 16:9 the crop takes y < 0.078 and y > 0.922.
   - The slots need a stage that guarantees `viewport_safe_zone`, and phones need a non-spatial layout (question 8).
4. **Painted books against real ones** (question 4).
5. **Words on plaques** (question 5).
6. **Scale** (question 6).
7. **No Threads to show yet** (question 7).
8. **The table view.** `book-template.png`'s desk matched the long table. The low round table needs its own table view before one becomes canonical.
9. **Tiny spines.** `lists-library.md` §27 warns against making users read tiny spine labels. The close-up scale is what answers it: titles are set at reading size, and a row pages rather than shrinks.

## Questions for Chanté

**All eight need your answer.** Each gives what the redraw found and what I'd recommend; nothing gets built or generated until they're answered.

1. **Four collection slots, or more?** The rail freed the left side: the window bay is now in view on most desktop windows (the folded rail hides x < 0.051 at 1440×900, though still most of it at 1100×900, and a pinned parchment covers it everywhere). But the repaint gave it a sofa instead of shelving. So the room still has three bookcases. *Recommendation:* three bookcase slots plus the alcove question, and the window bay stays an expansion.
2. **The reading alcove: `collection_04`, or an expansion?** It has a plaque but no shelves, and its armchair is the room's most natural reading seat. *Recommendation:* an expansion, a place to sit that takes surfaces when a domain needs room, like the window bay. That leaves three collection slots at first.
3. **Frontal room: an exception to bet 5, or a change to it?** Bet 5 was settled for walking, which needs four diagonal facings in an isometric room. The frontal Library needs left, right, toward and away, closer to the sheets she already has, and it is the only view where shelves face the camera. *Recommendation:* record it as an exception for rooms that are read: the Library, perhaps the Study.
4. **Full painted shelves when a new user has few Threads: repaint sparser, or keep painted books as untitled bookends?** At wide scale no painted spine is readable anyway. *Recommendation:* keep the wide painting (a repaint risks moving the architecture), generate close-ups with mostly bare shelf spans, and judge the full-bay-to-few-volumes jump on the first close-up (`collection_02`).
5. **Who names a slot, and when?** (open question 3) Plaque names are words in the world (`art-direction.md` §3 rule 4), and the stair plaque fits about 13 characters. *Recommendation:*
   - Lumi proposes a Collection's name from what it holds, once the context is sustained (`lists-library.md` §55). The user never has to name anything and corrects by saying so.
   - A name is a label built into the furniture, not a motto, so rule 4 would say "Lumi's voice, a label, or nothing".
   - The fill order puts a first Collection on the centre plaque (21 characters).
6. **Lumi about 1.6× the new armchairs: is the furniture or Lumi the right size?** Against the doorways, the drawers and the alcove's armchair she is consistent; the reading circle's furniture is painted at about half scale. *Recommendation:* Lumi stays; if either changes, the circle's furniture grows. Judge on `stills.png`, and on the review port before anything walks.
7. **The data model: confirm before any UI.** *Update 2026-09-13: the first bullet is confirmed and built — Threads exist as life-model objects (`threads`, `thread_notes`, filled from conversation; `docs/living/decisions.md` → Recent conversation lives on). The presentation bullets below still wait for your answer, and no presentation schema exists.* *Proposal to confirm or correct:*
   - Threads are life-model objects. **Confirmed and built.**
   - Collections and Thread Groups are Lumi's presentation of them, each with a stored name and where the name came from.
   - A Thread has one shelf position (its Thread Group) and any number of cross-links.
   - Which slot a Collection occupies is its own record, apart from the spatial IDs in this manifest.
   - Every reorganisation is an event: proposed, explainable, reversible.
   - No schema until you confirm.
8. **A fixed stage, and a phone layout.** *Recommendation:*
   - Fit a 3:2 stage into the area right of the rail so `viewport_safe_zone` (x 0.15–0.90, y 0.08–0.92) is always visible, with the painting bleeding past it.
   - Decide whether a pinned parchment may cover part of `collection_01` on narrow windows, or whether the stage starts past it when pinned. The page doesn't move for the nav today, so the parchment covers it.
   - Below 768px: no room, just Collections as headings, their Thread Groups, then Threads (`lists-library.md` §74).

## After the answers: the smallest sound implementation

1. **A stage, not cover.** One fixed 3:2 layer sized so `viewport_safe_zone` is always visible, with the painting bleeding past it. All geometry is in normalized coordinates on that layer.
2. **Hit regions as real links** (`<a href="/library/collection_02">`) positioned over the stage. They are invisible until hover or focus, when the plaque warms. Keyboard and screen readers get the same links in order.
3. **Plaque labels as HTML text** in the plaque's text-safe box, styled to the plaque (serif, gold, no chip).
4. **Close-up = a route** (`/library/[slot]`) with its own raster. Enter is a transform of the wide layer into the frame plus a crossfade to the close-up at the same rectangle, with a crossfade only under reduced motion. Thread Groups are rows on that raster, and panning is a transform.
5. **Threads as composited sprites** (a few spine, folio, booklet and paper variants) with the title as text on them, laid along each row.
6. **The table** = `/library/thread/[id]` with the book open immediately, and a back link to the Thread Group's row.
7. **Lumi:** a still at anchors first, then authored walks and depth scale once she has room-angle sheets (`animation-pipeline.md`).
8. **The manifest moves to `src/core/library/`** with a Zod schema once approved, and the maps keep drawing from it.

## Asset generation, after approval, one slot at a time

For each close-up:
- Use the exact frame crop (the tiles in `closeups.png`) as the reference image for `images/edits`, generated at 1024×1536 (2:3) and upscaled.
- Keep the same architecture, rows, plaque, sconces and neighbours.
- Leave the plaques blank and the shelf spans mostly bare.
- Measure the result against the projected rows. Reject anything that moves a shelf, an arch or a landmark.
