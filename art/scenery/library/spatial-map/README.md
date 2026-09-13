# The Library's spatial map — proposal, v3

*2026-09-13 · Claude. Drawn on Chanté's first isometric repaint of the reading room, served until her re-render with full-size armchairs the same day and now archived as `art/archived/scene_mockups/library-background-iso.png`; the manifest points there, so the maps still draw true. The served `../background.png` is a new render, so these coordinates don't carry over to it; the page's own numbers (`src/components/library/room-slots.ts`, Lumi's spot) were measured on it separately. `../shelf-zoom.png` is the reading scale and `../library-spatial-information-architecture.md` the governing IA. v1 and v2, the same day, were drawn on the frontal paintings (both archived now: `art/archived/scene_mockups/library-background-frontal.png` and `library-background-long-table.png`). Nothing here is approved, and no close-up has been generated.*

The images in this folder are annotations drawn by `scripts/draw-library-map.py` from the manifest, `../library-views.json`. The numbers live in the manifest, so edit them there and redraw. The production painting is never touched.

| Image | Shows |
|---|---|
| `slots.png` | The collection slots as the wall faces they stand on (numbered, and their click regions), each plaque and its label text-safe zone, the Thread Group rows, each close-up frame, the reserved expansions and the central table |
| `lumi.png` | Lumi's anchors and routes, her height at each anchor, the occluders, and what the rail, a pinned parchment, the top-right clock cluster and the cover crop hide at four window sizes |
| `closeups.png` | Each collection's close-up frame cut from the painting (un-sheared on a side wall), with its rows, Thread Group plaque zones, entry viewport and anchors: the reference image each close-up would be generated from |
| `stills.png`, `stills-60.png` | Lumi's rest frame at her standing anchors at her usual size and at 0.6 of it (always drawn on top; occluders ignored) |

## What v3 changed

- **The room is isometric,** which answers v2's question 3: the Library shares the projection bet 5 settled for rooms Lumi enters. It is a new painting, not a camera view of the frontal one, so every coordinate was measured again. The slots, their IDs and the open questions carry over.
- **Bookcases are wall faces.** The window bay and the ladder bay stand on the left wall, the alcove and the stair bay on the right wall, both slanting about 0.4. The back corner is cut across by a short wall facing the camera, which holds the centre bay. Each slot has a `face` (three corners), and its plaque and rows are in that face's own coordinates.
- **Close-ups un-shear exactly.** In a parallel projection a wall is a flat shear of its front-on view, so a side bay's close-up reference is its crop un-sheared and widened (×1.41), not a guess at a new camera (`closeups.png`). The centre bay needs no un-shearing. The camera move into a close-up is the same map as a CSS `matrix()`.
- **Constant scale.** Nothing shrinks toward the back, so v2's depth-scale estimate is gone: walking needs only positions, not sizes.
- **The furniture agrees with itself.** The reading circle's armchairs and the alcove's are the same scale, so v2's question about the circle's half-scale furniture is gone. What remains is Lumi's own size (question 6).
- **The doorway under the stair is in view** at every desktop window, and `expansion_02` is now the room beyond it. The stair has a landing halfway up, a natural stop on the way to the gallery.
- **Served (when v3 was drawn):** `background.png` → `public/library-room.webp`. The scene's ground was the painting's dark `#231912`, and Lumi's spot painting px (1060, 745), the open floor right of the reading circle. Both moved with the re-render (`docs/decisions.md`).

## The model as understood

- **The wide room is the map of what exists.** A few stable architectural slots (`collection_01`…) hold whatever Lumi has found to be a Collection for this user. A Collection's name is drawn in code on its slot's blank plaque and stored as data, never in the ID or the painting.
- **A Collection is a readable viewport, not a picture of a bookcase.** The camera moves into a canonical close-up of that exact bay, at the scale of `shelf-zoom.png`. About 2–3 shelf rows are in view and the rest are reached by panning.
- **A Thread Group is a shelf row.** It has a dark, gold-bordered plaque built into the shelf, with 4–8 Threads on it as titled spines, folios or papers. Moving between groups is a pan inside the close-up, not another view.
- **A Thread ends the spatial navigation.** Selecting one crossfades straight to the table and the book opens at once. Lumi's fetching runs alongside and never delays it.
- **Layers stay apart.** Architecture is painted once. Names, Threads, maturity forms, Lumi and hover or selected states are composited.
- **Everything spatial has a plain equivalent:** headings, links, keyboard, search and direct URLs.
- **Shelves are a view, not the life model.** Threads exist (`threads`, `thread_notes`); Collections and Thread Groups are how the Library would show them, not a nesting the life model must obey (`lists-library.md` §34).

## Slots

A slot's ID becomes permanent at approval, not before.

| ID | Place | Why |
|---|---|---|
| `collection_01` | The ladder bookcase, left wall | Full-height case with its own plaque and 5 rows; the ladder is the one place Lumi can visibly climb. |
| `collection_02` | The centre bookcase, on the short wall facing the camera | The focal point, the densest shelving, and the only bay that faces the camera square, so its close-up is a plain crop. A first Collection belongs here. |
| `collection_03` | The stair bookcase, right wall | The other floor-level case, with 4 rows and open floor in front, nearest Lumi's spot. |
| `collection_04` *(conditional)* | The reading alcove, right wall | Its own plaque and the most distinctive place in the room, but little shelving: the inner bookcase, the side table and the sill would be its Thread Groups. Could be an expansion instead (question 2). |
| `expansion_01` | The gallery along the top of the right wall | Shelves and plants already line it; the stair and its landing mean Lumi walks up. |
| `expansion_02` | The room beyond the doorway under the stair | The painting already shows shelving through it, and the diamond plaque beside it can name it. |
| `expansion_03` | The window bay, left wall | It has a plaque but only a sofa and a sill: a place to sit, not to shelve. |

Not reserved: the high shelves along the upper storey and above the centre bay (under the chandelier, cropped at 16:9; perhaps an archival layer one day), and the prints and plant between the centre bay and the alcove (breathing room).

## Thread Groups

One per shelf row, as `collection_NN.thread_group_MM`, numbered top to bottom:
- 01: 5 rows. The ladder crosses the right third of rows 2–5.
- 02: 5 rows, 7–8 volumes each.
- 03: 4 rows, 4–5 volumes each.
- 04: 3 surfaces.

A plaque takes the top ~30% and left ~55% of its row. Overflow pages or scrolls sideways along the row; typography is never shrunk.

## Lumi

- **Anchors:** her spot (`home`), aisles behind the reading circle, an approach for each slot, the ladder foot and top, the centre bay's cabinet top, a drawer-step at the stair bay, the alcove's armchair and side table, the window sofa, the floor cushion, a place at the table, the foot of the stair and its landing.
- **Routes:** authored polylines, no pathfinding, all in view. The route to the cushion goes round the back and left of the circle, clear of the little stool. The gallery route climbs the stair and needs a walk of its own.
- **Occluders:** two small cut-outs, drawn over her only where she stands behind something: the round table and its things (`table_place`) and the stair's lower rail (the doorway under the stair).
- **Her size** is the one open thing about her (question 6).

## Concerns

1. **Lumi's size** (question 6).
2. **The gallery's close-up.** Its shelves run along the wall behind the balusters, so a readable view needs the rail cut away or a view along the walkway.
3. **What a window shows.** Under today's cover fit, beside the rail:
   - At 1100×900 the rail hides x < 0.147 (the stove and half the window bay) and x > 0.907 is cropped (the stair's foot).
   - A pinned parchment hides x < 0.293 at 1100×900, which reaches `collection_01`'s left edge.
   - At 16:9 the crop takes the roof beams and the floor's front corner (y < 0.078, y > 0.922).
4. **Painted books against real ones** (question 4).
5. **Words on plaques** (question 5). The stair plaque fits about 12 characters at wide scale.
6. **The table view.** `book-template.png`'s desk matched the long table. The low round table needs its own look before a table view becomes canonical.
7. **Tiny spines** (`lists-library.md` §27). The close-up scale answers it: titles at reading size, rows page rather than shrink.

## Questions for Chanté

**Questions 1, 2, 4, 5, 6, 7 and 8 need your answer. Question 3 is answered by the painting;** say if that reading is wrong.

1. **How many collection slots?** Still three bookcases and the alcove; the window bay has no shelves. *Recommendation:* three bookcase slots, with the window bay an expansion.
2. **The reading alcove: `collection_04`, or an expansion?** *Recommendation:* an expansion, a place to sit that takes surfaces when a domain needs room.
3. **Projection.** *Answered:* the Library is isometric like the other rooms, so bet 5 holds with no exception. The frontal paintings stay as history.
4. **Full painted shelves when a new user has few Threads.** *Recommendation:* keep the painting, generate close-ups with mostly bare shelf spans, and judge the jump on the first close-up (`collection_02`).
5. **Who names a slot, and when?** (open question 3) *Recommendation:* Lumi proposes a Collection's name once the context is sustained and the user corrects by saying so; a name is a label built into the furniture, not a motto. Logged as open in `ef-burden-log.md`.
6. **Lumi's size in the Library.** At her usual size (a 150px box) she is about 0.8 of the doorway under the stair and nearly twice an armchair: about 1.6 m in this room (`stills.png`). At 0.6 (a 90px box) she is about 1 m, a little taller than an armchair (`stills-60.png`). *Recommendation:* about 0.6 in the Library, which means the companion scales per room. *Answered 2026-09-13, on the re-rendered painting:* Chanté chose to try 134 painting px (her look at 1440×900), and the companion now scales with the room.
7. **The presentation model.** Threads are confirmed and built. *Partly answered 2026-09-13* (Chanté: "Threads that become categories should gain their own section in the library"): a Collection is a **section**, a thread that holds threads; a Thread Group is a **shelf**, a thread holding threads inside a section; a Thread is a **book**. They are threads, not a separate presentation record, with one place each (`threads.parent_id`), and which slot a section fills is presentation only (fill order `collection_02`, `01`, `03` on `feat/library-sections`, not stored). *Earlier list, for what's still open:*
   - Collections and Thread Groups are Lumi's presentation of Threads, each with a stored name and where it came from.
   - A Thread has one shelf position and any number of cross-links.
   - Which slot a Collection occupies is its own record, apart from the manifest's spatial IDs.
   - Every reorganisation is a proposed, explainable, reversible event.
   - No presentation schema until you confirm.
8. **The stage.** The painting now sits on a flat dark ground. *Recommendation:*
   - A contain fit: the whole room always in view with the ground filling the rest, which guarantees every slot and expansion on any desktop window. The cost is a slightly smaller room on wide windows.
   - Decide whether a pinned parchment may cover `collection_01`'s edge on narrow windows.
   - Below 768px: no room, just Collections as headings, their Thread Groups, then Threads (`lists-library.md` §74).

## After the answers: the smallest sound implementation

1. **A stage.** One fixed 3:2 layer (contain, or cover with `viewport_safe_zone` guaranteed). All geometry is in normalized coordinates on that layer.
2. **Hit regions as real links** (`<a href="/library/collection_02">`), clipped to each face's polygon. They are invisible until hover or focus, when the plaque warms. Keyboard and screen readers get the same links in order.
3. **Plaque labels as HTML text** in the plaque's text-safe box, skewed with the wall (`matrix()`), styled to the plaque (serif, gold, no chip).
4. **Close-up = a route** (`/library/[slot]`) with its own raster. Enter is the face's affine map applied to the wide layer plus a crossfade to the close-up at the same rectangle; a crossfade only under reduced motion. Thread Groups are rows on that raster; panning is a transform.
5. **Threads as composited sprites** (spine, folio, booklet and paper variants), with the title as text on them, laid along each row.
6. **The table** = `/library/thread/[id]` with the book open immediately, and a back link to the Thread Group's row.
7. **Lumi:** a still at anchors first, then authored walks once she has room-angle sheets (`animation-pipeline.md`). Constant scale makes walking cheaper than it was in the frontal room.
8. **The manifest moves to `src/core/library/`** with a Zod schema once approved, and the maps keep drawing from it.

## Asset generation, after approval, one slot at a time

For each close-up:
- Use the rectified frame (the tiles in `closeups.png`, redrawn at full resolution) as the reference image for `images/edits`, generated at 1024×1536 (2:3) and upscaled.
- Keep the same architecture, rows, plaque, sconces and neighbours.
- Leave the plaques blank and the shelf spans mostly bare.
- Measure the result against the projected rows. Reject anything that moves a shelf, an arch or a landmark.
