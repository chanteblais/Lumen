# Design System

Antique book × modern editorial interface. Tokens live in `src/app/globals.css` (`:root` custom properties, mapped into Tailwind via `@theme inline`). Tailwind is for layout; the named classes below carry the look.

---

## Color Palette

| Name | Hex | Tailwind class | Usage |
|---|---|---|---|
| Paper | `#efeae2` | `bg-paper` | Page ground |
| Paper deep | `#e6e0d5` | `bg-paper-deep` | Sidebar, chips, icon buttons |
| Card | `#f8f5ef` | `bg-card` | Composer, Today's cards, the companion bubble (the greeting sits on bare paper) |
| Ink | `#1b1a17` | `text-ink` | Primary text |
| Ink soft | `#3f3c36` | `text-ink-soft` | Secondary text, labels |
| Ink mute | `#8a8378` | `text-ink-mute` | Placeholders, nav numerals, quiet labels |
| Brass | `#9c7e4e` | `text-brass` | Accent — sparingly (one flourish per surface) |
| Brass soft | `#c9b58c` | `text-brass-soft` | Accent on dark fills |
| Forest | `#2a342e` | `bg-forest` | Avatar circle, send button — the only dark fills |
| Glow | `#f1d8a0` | `text-glow` | Lumi's eyes (reserved) |
| Foxing | `rgba(122,96,54,.11)` | — | The page-edge vignette only |
| Rule | `rgba(27,26,23,.16)` | — | Fine rules, borders |
| Rule strong | `rgba(27,26,23,.34)` | — | Short rules, composer border |

**Paper grain:** `body::before` — a fixed, non-interactive SVG `feTurbulence` layer at 28% opacity, multiply blend, laid *over* the shell so cards and sidebar are paper too. Keep it barely perceptible; if you notice it, it's too strong.

**Foxing:** `body::after` — a fixed radial vignette in `--foxing`, multiply blend: the page browns very slightly toward its edges. Same rule: if you notice it, it's too strong.

**Gutter:** `.main` carries a soft inset shadow on its left edge where the page meets the spine. Off on phones.

**Dark mode:** none in V1. The book is ivory.

---

## Typography

| Font | Weights | Source | Variable / class |
|---|---|---|---|
| Cormorant Garamond | 400 / 500 / 600 + italics | Google Fonts via `next/font` | `--font-cormorant` → `.font-display` |
| EB Garamond | 400 / 500 + italics | Google Fonts via `next/font` | `--font-garamond` → `.font-body` (default on `body`) |

- **Display** (Cormorant): the wordmark (56px), the greeting's title line (38px) and second line (26px, `--ink-soft`), the composer input (24px), italic asides ("Progress lives here.").
- **Body** (EB Garamond, 17px/1.45): everything else, including nav names (19px) and chips (16px).
- **Labels** (`.label`): EB Garamond 11px, uppercase, `letter-spacing: 0.24em`, `--ink-soft`. `.label-mute` for the quieter variant. Every kicker, date, and tagline in the interface is a `.label`.

Heading defaults: none imposed. Headings are display-font lines set per surface; there is no `h1` style to fight.

---

## Spacing & Layout

- **Shell:** CSS grid `272px minmax(0,1fr)`, **viewport-height** (`.shell { height: 100dvh }`); sidebar `.sidebar` scrolls internally, with an inner 10px inset frame line (`::after`); main `.main` is a scrolling column (`overflow-y: auto`, padded `36px 48px 0`). The chat page overrides this with its own scroll region so the composer stays fixed.
- **Content width:** `max-w-[1080px]`, left-aligned within main.
- **Mobile breakpoint:** `767px` (CSS). Sidebar becomes a top strip: wordmark left, nav names right; the footer aside and dividers are hidden.
- **Radii:** cards `6px` (a plate, not a bubble); user notes `8px` with a `2px` tail corner; chips, icon buttons, composer, send `999px`.
- **Shadow:** one token, `--shadow` (two soft layers). Nothing else casts.

---

## Reusable CSS Classes (`globals.css`)

| Class | What it does |
|---|---|
| `.label` / `.label-mute` | Tracked small caps (see Typography) |
| `.rule` / `.rule-short` | 1px full rule / 34px short rule |
| `.rule-double` | Thick-thin "Oxford" rule under the running head (top bar) |
| `.divider` / `.tailpiece` | Ornament layouts: hairline · diamond · hairline under every kicker; hairline · hedera · hairline closing a page with nothing more to say (see Ornaments) |
| `.opening` | The greeting as a chapter opening on bare paper: `.opening-head` (hairline · asterism · hairline across the measure), `.opening-body` (portrait + text), `.opening-title` (38px display), `.opening-line` (26px display, ink-soft). `.is-compact` within a sitting: same break, smaller (26/20px, 44px portrait) |
| `.medallion` | Brass hairline ring around a `LumiAvatar`, set off by a 2px paper gap |
| `.card` | Card surface: `--card` bg, rule border, 6px radius, `--shadow` |
| `.chip` | Pill button on paper-deep; hover darkens, active nudges 1px |
| `.icon-btn` | 44px round icon button on paper-deep |
| `.chat-page` / `.chat-scroll` / `.composer-dock` | Chat layout: flex column filling `.main`; the transcript scrolls; the dock sits below with a paper fade above it |
| `.composer` | The pill input container; `textarea` inside is display-font, auto-grows to 160px. `.is-listening` = brass border + soft ring while voice input is on |
| `.send` | 64px forest circle; disabled at 45% opacity |
| `.tool-link` | Text+icon quiet button (Add file / Voice / Tools) |
| `.nav-item` | Sidebar link; `[aria-current="page"]` gets the soft highlight; `.name` child |

---

## Component Patterns

### Greeting (`components/chat/Greeting.tsx`)
A chapter opening, not a card (2026-09-12: the boxed `.card.plate` read as a widget dropped onto the page). Set on the paper itself the way a chapter begins in a book: a headpiece across the measure (hairline · asterism · hairline, `.opening-head`), Lumi's portrait medallion in the margin, the first line as the title (38px display), the second beneath it in the softer ink (26px), then the quick-start chips. Lines come from `core/ai/greeting.ts` — never hardcode copy in the component. It is the chapter mark of the transcript (`MessageList`): everything from before this page open above it, this visit below; the page opens scrolled to it. No rule or box between the earlier messages and the greeting — the headpiece and the white space are the break. Within a sitting (`compact`) it is a running head: the same headpiece, a 44px portrait, 26/20px lines, no chips. It matches Today's opener (avatar beside a display-serif greeting on bare paper), so the two pages open the same way.

### Lumi sprites (`components/chat/LumiSprite.tsx`)
The single source of Lumi's drawings. `public/lumi-heads.png`: one row of 176px square cells cut from the original `lumi.png` character sheet (not kept) — neutral · blink · happy · curious · excited · sleepy. `public/lumi-idle.webp`: a 15×9 grid of 144×208 cells, three rows per loop (open, half-shut and shut eyes — the blink frames composited on, aligned on the eyes themselves, so blinking and the loops run together): rows 0–2 the nine-cell **breath** loop and rows 3–5 the nine-cell **sway** loop from `art/lumi-slow-idle.png`, rows 6–8 the fifteen cells of the **playful foot** from `art/lumi-idle-foot.png` (shorter loops leave their trailing columns empty). **A loop is an order over its row's cells** (`LUMI_LOOP_CELLS`; `LUMI_LOOP_FRAMES` is its length) and a cell may play more than once: the foot loop is rest and a glance toward the kicking foot (cells 0–6), the kick with the head held turned (7–14), then the glance in reverse (6…1) — twenty-one frames from fifteen cells. Every frame is the same pose at the same scale, centred on the figure and anchored on the feet baseline (the sheet's own spacing wobbles, so its offsets read as a slide); every loop starts and ends at or next to the rest frame, so they hand over there. Cut by `scripts/cut-lumi-idle.py`: paper is flood-filled from outside the figure, so the cream hood survives the matte; on a contrasting ground (`contrast=True`, the foot sheet's grey-blue) the edge band is de-matted against the ground using the nearest interior pixel as the figure's own colour, and the shadow is read by its blue cast and redrawn in the slow-idle sheet's warm shadow tone (`SHADOW_RGB`), so nothing cold or grey rims her on the paper. The foot sheet is twenty-four in-betweened frames of one drawing (an earlier eight-frame sheet redrew the whole figure each frame, so she boiled and the foot jumped): row 1 rest then the head turning a little toward the foot she is about to kick with (frame 8 a stray rest frame, unused), row 2 the kick with the head held turned, row 3 rest frames — the turn back was not drawn, so the loop replays the glance in reverse. Each row is scaled on its own until the figure stands as tall as the breath rest frame (the kick row is drawn ~3.5% smaller: 0.749 · 0.776 · 0.749), centred on the figure like the rest and then **settled on the head silhouette** — cell 0 onto the breath rest frame, the others onto cell 0; whole pixels sideways, then a quarter-pixel refinement in both axes (cubic resample on premultiplied channels), because a frame half a pixel off its neighbour doubles the hood's edge under the crossfade — and then **held** (`hold_head`, blended in over the collar rows above the ribbon on premultiplied channels): the second rest cell keeps cell 0's head, and the eight kick cells keep the last glance frame's turned head, so the head is one drawing from the end of the glance in to the start of the glance back and the generator's per-frame redrawing of the hood rim and its sun never shows. The glance frames are as drawn; the cloak below the collar keeps the sheet's own movement, which the kick carries all the way up. The rest cell is the sheet's own head, not the breath frame's, so the small difference between the two hoods fades at the hand-over, at the variation's pace, where it reads as the start of the glance. (Centring frames on the dark face instead had her hop ~14px on every hand-over, since her face sits right of her hood's centre.) `LumiSprite` draws one cell at a height via `background-position`; `headCell` / `idleCell` address them. A new state is a new cell, never a new component. Adding a sheet — the prompt that works, `scripts/measure-lumi-sheet.py`, and what the cut corrects — is written up in `art/README.md`.

### Lumi avatar (`components/chat/LumiAvatar.tsx`)
Forest circle with the hooded head. Props: `size` (default 68) and `expression` (default `neutral`). Never larger than the text it accompanies; never decorative on its own.

### Lumi companion (`components/shell/LumiCompanion.tsx`)
Lumi, full figure, standing a little in from the bottom-right corner of every page (`.companion`, fixed, 150px tall, ~104px wide at `right: 56px; bottom: 40px` — 28px/2px read as tucked into the corner). She is fixed to the viewport, outside the content column: on desktop `.chat-page` keeps a lane clear on its right (`--companion-lane`, 140px on top of `.main`'s 48px padding, added to the column's max-width) so the docked send button never sits under her at any width, whether the column fills `.main` or is centred inside it. Hidden under 768px, where there is no room for a lane, and the lane drops to 0. Idle life: the breath loop at ~320ms/frame (one breath ≈ 3s), every frame fading in **on top of** the previous so she never turns translucent (two frames mounted, keyed by loop and frame, the fade a mount animation — so a hand-over between loops fades like any other step; the fade lasts 80% of the frame time of the faster of the two loops involved, capped at 260ms, via `--fade` on the figure — a fixed 260ms on 120ms frames left each frame a third of the way in when it was replaced and snapped to full, a soft doubling of the hood; and a hand-over fades at the variation's pace both ways, since the way back at the breath's 260ms read as a slow turn of the head); every 20–45 s one pass of a variation — the sway at ~560ms/frame or the playful foot at ~120ms/frame (twenty-one frames, ≈2.5s: a glance toward the foot, one scuff, the glance back), never the same one twice running — then back to breathing; a blink every 2.5–6.5 s (half · shut · half, ~0.3s, occasionally doubled) by switching the eye row. No pose changes — the micro variations from `lumi-idle.png` read as image swaps and were dropped. All of it stops under `prefers-reduced-motion`. She is also the one control in the corner: `.companion-btn` wraps the figure (hover lifts her 3px; the global brass focus ring), and `.companion-bubble` is the speech bubble that opens above her — a 330px `--card` plate with a `--rule-strong` hairline, a 12px rotated-square tail over her head, a display-serif textarea (21px, grows to 120px) with a 40px `.send`, and above it the exchange (`.companion-said`: your line as a right-aligned `--paper-deep` bubble like the chat's `.msg-user`, 15px, sliding up 8px over 220ms on each send; `.companion-reply` at 17px with the chat `.ledger` beneath) under a hairline. Fades in over 160ms (off under reduced-motion). Stacks in the `.companion` flex column so she stays put when it opens. Testing note: Chrome freezes animations in a hidden tab (the Claude-in-Chrome automation window is usually occluded), and a capture of a frozen tab shows her mid-fade, ghostly — that is the capture, not the page. Dev only (`NODE_ENV === "development"`): `.companion-debug`, a row of tiny `.companion-debug-btn` chips fixed just above her head with a `.companion-debug-fold` handle at the right end that folds them away toward it (`.is-folded`, remembered in `localStorage`), cues a variation (played at the next rest frame, the same hand-over as a scheduled one) or a blink (now) via a `lumi:cue` window event — for checking the loops without waiting; hidden with her under 768px, and while the bubble is open (it sits where the bubble opens).

### Lead card (`components/insights/LeadsSection.tsx`)
Insights opens the way Today does — Lumi's 48px avatar beside a display-serif line (30/36px) — and then a column of `.card`s (gap 20px), one per thing she noticed: the title in display serif (26/28px), her *why* line in body 17px `--ink-soft`, a `.label.label-mute` meta line (sender · subject · when · date), and the two answers — a `.chip` (*Still needs doing*) and a `.tool-link` (*Let it go*), the same weights as *Not this*'s chips and *Keep it*. Answered, the row's controls become one ledger-style line (`.ledger-mark` ✦ + *On your list.* / *Let go.*). The page's one flourish is the divider under the kicker; the tailpiece appears only when there is nothing. No counts, no badges, no unread dot on the nav item.

### Ornaments (`components/ui/Ornament.tsx`)
Printer's marks, the engraved vocabulary an old book uses instead of icons. Inline SVG in brass (`.ornament`), hairline weight, `aria-hidden`; they decorate, never carry meaning. Three glyphs: **Diamond** ✦ (the smallest mark: dividers, visit rules), **Fleuron** ❦ (the hedera, an ivy leaf with a curled stem: tailpieces, the sidebar foot), **Asterism** ⁂ (a pause in the text: the greeting's headpiece, where this visit begins after whatever was there). Two layouts: `Divider` (replaces the short rule under every kicker) and `Tailpiece` (closes an empty page). **One flourish per surface** — the greeting has its headpiece, a page has its tailpiece, a sitting break has its diamonds. If a surface already has one, it does not get another.

### Quick starts (`components/chat/QuickStarts.tsx`)
Four chips + a round "another way in" button. They are starting points, not modes; from M2 they send a canned first message.

### Composer (`components/chat/Composer.tsx`)
`+` icon button · auto-growing textarea · send. Below it, the Voice toggle (only where supported; `.tool-link.is-listening` breathes in brass) and the closing label ("You don't have to do it alone."). Enter sends, Shift+Enter newlines. Voice is `useVoiceInput` (`components/chat/useVoiceInput.ts`): Web Speech API, continuous + interim results, transcript appended to the typed text.

### Sidebar (`components/shell/Sidebar.tsx`)
Wordmark, tagline label, divider ornament, nav of plain names (no numerals) with a brass diamond marking the open chapter, italic footer aside between a divider and a fleuron. The plate frame (`::after`) has **crossed corners** (`::before`): each rule runs 6px past the corner, the way a ruled border is drawn by hand. Active route from `usePathname`.

### Clock (`components/ui/Clock.tsx`)
Viewer-local date + time as a `.label`, top right. Renders empty on the server and fills on mount (no hydration mismatch).

### Icons
Inline SVG, `stroke="currentColor"`, 1.4–1.6 stroke, round caps. No icon font, no icon library.

### Favicon (`app/icon.svg`)
Lumi's hooded head in the forest circle with a brass hairline ring, drawn as flat SVG shapes (the raster sprite does not survive 16px). Replaces the default Next favicon.

---

## Accessibility

- Every icon-only button has an `aria-label`.
- Nav uses `aria-current="page"`.
- Focus: one ring for the whole book — `:focus-visible` is a 1px brass outline offset 3px. The composer textarea suppresses it (the pill's `.is-listening`/border carries state).
- Selection is brass-soft on ink. Scrollbars are thin and translucent brass, never the browser grey.
- Contrast: ink on paper ≈ 14:1; ink-mute on paper ≈ 3.4:1 — mute is for non-essential text only.
