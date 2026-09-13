# The Library's spatial map — first pass (proposal)

*2026-09-13 · Claude, from the long-table painting (then canonical, now `art/archived/scene_mockups/library-background-long-table.png`), `../shelf-zoom.png` (reading scale) and `../library-spatial-information-architecture.md` (governing). Nothing here is approved, and no close-up has been generated.*

**Since drawn:** the Library now serves `../background.png`, the same room with a small reading circle in place of the long table. The architecture appears unchanged, so the slots, rows and close-up frames should hold. The long table is gone, though, so `central_table`, its occluders, and concerns 1–3 about reaching the centre bookcase and routes around the table need redrawing against the new painting before approval.

The images in this folder are annotations drawn by `scripts/draw-library-map.py` from the manifest, `../library-views.json`. The numbers live in the manifest, so edit them there and redraw. The production painting is never touched.

| Image | Shows |
|---|---|
| `slots.png` | The numbered collection slots (click regions), each plaque and its label text-safe zone, the Thread Group rows, each 2:3 close-up frame, the reserved expansions and the central table |
| `lumi.png` | Lumi's anchors and routes, her estimated height at each anchor, and what the sidebar, the top bar and the cover crop hide at four window sizes |
| `closeups.png` | Each collection's close-up frame cut from the painting, with its rows, Thread Group plaque zones, entry viewport and anchors projected into it |

## The model as understood

- **The wide room is the map of what exists.** A few stable architectural slots (`collection_01`…) hold whatever Lumi has found to be a Collection for this user. A Collection's name is drawn in code on its slot's blank plaque and stored as data, never in the ID or the painting.
- **A Collection is a readable viewport, not a picture of a bookcase.** The camera moves into a canonical close-up of that exact bay, at the scale of `shelf-zoom.png`. About 2–3 shelf rows are in view and the rest are reached by panning, so the bay feels larger than the screen.
- **A Thread Group is a shelf row.** It has a dark, gold-bordered plaque built into the shelf, with 4–8 Threads standing on it as titled spines, folios or papers. Moving between groups is a pan inside the close-up, not another view.
- **A Thread ends the spatial navigation.** Selecting one crossfades straight to the table and the book opens at once. Lumi's fetching runs alongside and never delays it.
- **Layers stay apart.** Architecture is painted once. Names, Threads, maturity forms, Lumi and hover or selected states are composited, so the Library changes without a repaint.
- **Everything spatial has a plain equivalent:** headings, links, keyboard, search and direct URLs.

## Slots

Numbered left to right among the strong slots. A slot's ID is permanent from approval on.

| ID | Place | Why |
|---|---|---|
| `collection_01` | The ladder bookcase, second from left | Full-height case with its own plaque and 5 rows, clearly bounded by pilasters and sconces. The ladder is the one place Lumi can visibly climb. |
| `collection_02` | The centre bookcase behind the table | The focal point, densest and best lit, with 5 rows of 7–8 readable volumes. Its row proportions match the reference close-up almost exactly (row width to height ≈ 3.6). A user's first Collection belongs here. |
| `collection_03` | The narrow stair bookcase, right | The other floor-level case, with a plaque and open floor in front: the one Lumi can walk all the way to in view. It has 4 rows of about 5 volumes. |
| `collection_04` *(conditional)* | The reading alcove under the gallery | Its own plaque and the most distinctive place in the room, but almost no shelving. Its Thread Groups would be surfaces: the edge-on inner bookcase, the side table, the sill. It could be the first expansion instead. |
| `expansion_01` | The gallery, up the stair | Books already line it. Lumi can walk up rather than climb. |
| `expansion_02` | The archive beyond the far-right doorway | The painting already shows another room through it, and the diamond plaque can name it (*a mature body of work may require another room*). |
| `expansion_03` | The window bay, far left | It has a plaque and cubbies under the seat, but sits behind the sidebar at every desktop width. |

Not reserved: the high shelves above the ladder and centre bays (under the top bar and chandelier; perhaps a quiet archival layer one day), and the wall of prints between the centre bay and the alcove (kept as breathing room).

**Fewer than 5–7 on purpose.** The painting has three true bookcases at floor level. Forcing more means splitting a bay, which reads as folders, or using places a user can't see. Four slots and three expansions also match the growth principle: a new user rarely has more than four domains (`spaces.md` §13's examples have four), and the room makes space as they arrive.

## Thread Groups

One per shelf row, as `collection_NN.thread_group_MM`, numbered top to bottom:

- 01: 5 rows. The ladder crosses the right third of rows 2–5, leaving 4–6 volumes a row.
- 02: 5 rows, 7–8 volumes each.
- 03: 4 rows, 4–5 volumes each.
- 04: 3 surfaces.

A plaque takes the top ~30% and left ~55% of its row. Overflow pages or scrolls sideways along the row; typography is never shrunk.

## Lumi

Anchors are in the manifest and drawn on `lumi.png`: `home` (her spot today), `cushion_sit`, `table_place`, an approach for each slot, the ladder foot and top, the centre bay's cabinet top, a drawer-step at the stair bay, and the armchair and side table in the alcove. Routes are a few authored polylines, with no pathfinding.

## Concerns

1. **Scale.** At 150px she is about 0.156 of the painting's height on the rug. The furniture suggests she shrinks to about 0.42× at the back wall, roughly one shelf row tall. So:
   - From the floor she reaches no shelf; the drawer cabinets alone are about 1.5 of her.
   - The ladder's top is about 6 of her.
   - In close-ups she is about a volume's height, so she can step into a row, stand on a board or use the ladder, but shelving from the floor is out.
   - The estimate needs a still at an approach anchor before anything is drawn.
2. **The centre bay can't be reached in view.** Everything between the table's back edge and the drawers is hidden behind the table, so her walk to `collection_02` ends at `table_back_right` and the camera move carries the rest. Walking behind the table at all would need a cut-out mask of the table.
3. **Routes out of `home` pass in front of the cushion and the stool.** That is near the bottom edge, which a 16:9 window crops (visible to y 0.922).
4. **Projection.** The Library is painted as a frontal perspective interior, not isometric, which `art-direction.md` bet 5 settled for every room Lumi enters. Frontal is what makes readable close-ups possible (the shelves face the camera). This needs Chanté's call, not a silent exception.
5. **The window decides what's visible.** Under today's cover fit:
   - At 1100×900 the sidebar hides x < 0.294 (half of `collection_01`) and everything right of x 0.907 is cropped.
   - At 16:9 the top bar reaches y ≈ 0.135.
   - Slots need a stage that guarantees `viewport_safe_zone` rather than plain cover. Phones need a non-spatial layout.
6. **Painted books against real ones.** The wide view's shelves are full, but a user's Threads are few at first.
   - The close-ups must be generated with mostly bare shelf spans, so the composited spines are the content.
   - A full-looking bay in the wide view that opens onto a few volumes is a continuity question: repaint the wide view with sparser shelves, or keep painted books only as untitled bookends.
7. **Words on plaques.** Collection and Thread Group names drawn onto plaques are words in the world (`art-direction.md` §3 rule 4), and *who names a slot, and when* is open question 3. The stair bay's plaque fits about 13 characters at wide scale.
8. **No Threads to show yet.** Coherence holds intentions and lists, not Threads (open question 22). The Library's lists live nowhere visible since 2026-09-13. The spatial layer needs a data model for slots → Collections → Thread Groups → Threads, with assignments stored apart from the spatial IDs.
9. **The table view.** `book-template.png`'s background (shelves left, a window right, a bust) roughly matches looking across the table toward the centre bay and alcove. Check it before it becomes canonical.

## The smallest sound implementation

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
