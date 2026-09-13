# Lumen Design Philosophy

*v0.1 — DRAFT · 2026-09-11 · distilled from the brief and the two mockups (`mockups/`). Not yet validated against Chanté's reactions the way Glåüm's is (that doc passed a blind sort). Treat as a working hypothesis; promote to v1.0 after a naming/falsification pass.*

---

## 1. The book and the machine

Lumen is **an old book that somehow contains an extremely modern AI**. Both halves are canon:

- **The book:** ivory paper, fine rules, engraved restraint, serif type, negative space. Slowness as a virtue. Nothing shouts.
- **The machine:** streaming text, instant state, tools that act. Precision. Nothing lags.

Design for either half must remember the other: the book never becomes twee (the machine is watching), the machine never becomes a SaaS dashboard (the book is watching).

## 2. Where personality lives

In order of permission:
1. **Copy.** Lumi's voice (`product.md`) is the primary personality channel. One well-placed line beats any illustration.
2. **Typography and spacing.** The display serif at generous size, tracked small caps, rules. This *is* the brand.
3. **Micro-interactions.** A chip that nudges 1px, text that streams, a check-in that appears and waits. Quiet, physical.
4. **Lumi himself.** Small, sparing, expressive through eyes and posture. A circular avatar beside his lines; never a full-body illustration in the working UI.

Decorative imagery is not on this list. **Painted places, not pictures (2026-09-12):** Home is set in a painted room (a lamplit study) and Today in a painted greenhouse (a daylit garden) — each painting is the *place* the book is read in, not an illustration inside it. It sits behind everything, dimmed or veiled so the type leads, and a page gets one only when it is painted one; if it ever competes with the copy, dim it further before touching the copy. **Printer's ornaments are not imagery:** the diamond, hedera and asterism, hairline rules, crossed corners and plate frames are part of the typography, the way a chapter head's fleuron is. They are drawn in brass at hairline weight and rationed to one flourish per surface (`design-system.md` § Ornaments).

## 3. Principles

1. **One thing at a time.** Every surface has one focal point. The landing page says one sentence and offers one input.
2. **Never confront.** No counts of overdue things, no red, no "you haven't". Re-entry is a greeting, not a report.
3. **Derived, not maintained.** Anything the user would have to keep current (a status, a priority, a category) is derived from behaviour or not shown.
4. **Quiet by default.** Lumi speaks when spoken to, and at agreed check-ins. Silence is a feature.
5. **Engraved, not printed.** Fine rules over heavy borders; shadow as a whisper; brass as a single accent per surface.
6. **Calm is a feature.** When a screen feels busy, remove ornament before removing content — then remove content.

**We are:** calm, observant, warm, dry, precise, unhurried, ivory-and-ink.
**We are never:** cute, cheerleading, wellness-toned, gamified, cluttered, corporate, neon, "AI-startup".

## 4. Reading the mockups

- `mockups/` chat mockup (the canon): sidebar frame, greeting card, chips, pill composer. Everything built in M0 follows it.
- `mockups/rali-list.png` ("Lists"): keep the *visual language* (card rows, category glyphs, Lumi speaking in a bubble, Focus as a first-class nav item); reject the *interaction model* (per-column counts, due-date labels on every row, five "Add item" affordances, drag-to-prioritise). Logged in `ef-burden-log.md`.

- `mockups/` Today mockup (2026-09-12): canon for the *shape* of Today — one dominant card, After that, Later, Lumi small beside the greeting, celestial marks as punctuation. Cut: calendar timeline, timer widget, quick capture, "1 of 3", tabs, counts — reasons in `today.md`. The sidebar's "Small steps still move the world" is the one permitted aside; nothing else inspirational goes on the walls.

## 5. Weaving philosophy into the app as it grows

- **Copy first.** When a state needs explaining, try a line in Lumi's voice before adding UI.
- **Every new surface passes the one question** (`product.md`) and gets an `ef-burden-log.md` row if it adds any user-maintained state.
- **Ornament is centralised.** Rules, labels, cards come from `globals.css` classes — never re-styled inline.
- **Lumi's character is centralised.** One `LumiAvatar` component; states are props, not new drawings.

## 6. Status

Draft. Open validation questions: does the Garamond pairing read as "book" or as "wedding invitation"? Is the paper grain visible at all on Chanté's display? Does the forest green belong, or should the dark fills be ink?
