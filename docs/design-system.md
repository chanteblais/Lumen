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

**Dark mode:** none in V1. The book is ivory — with one exception, below.

**Home: the room** (2026-09-12). Home is the one page not set on ivory: it is set *in* a painted room (`art/scenery/home-background.png` → `public/home-room.webp`, 1536×1024, cover-fit, fixed) — an evening study by lamplight, the same book read by lantern light. The page renders one layer, `.home-scene`, behind the shell; its `::after` dims the painting toward the spine (darkest under the sidebar) and the floor (behind the composer) so the type sits in the light. Everything else is the same tokens re-mapped under `.shell:has(.home-scene)` (both `--x` and Tailwind's `--color-x`, which resolve on `:root` and would otherwise keep the ivory values):

| Token | By lantern light | Usage on Home |
|---|---|---|
| Paper | `#1a120c` | The dock's fade, the medallion gap, the fleuron's vein |
| Paper deep | `rgba(241,230,207,.08)` | Chips, icon buttons, your lines' tint |
| Card | `rgba(26,18,12,.72)` + `backdrop-filter: blur` | Lumi's plates, the composer, the check-in — dark glass |
| Ink / soft / mute | `#f1e6cf` / `#d6c8aa` / `#a89a80` | Parchment type |
| Brass / soft | `#d9ac5f` / `#f0d9a6` | The lamp's gold: ornaments, the send button, focus ring, thinking dots |
| Rule / strong | parchment at .16 / .40 | Every hairline |
| Shadow | two black layers (.25 / .35) | Plates and the scroll |

The sidebar becomes a translucent wood panel (`rgba(24,16,10,.6)`, 16px blur); the grain stays at half strength (it reads as the paper of the painting); the foxing and the gutter shadow are off. Text set straight on the painting (the kicker, the clock, date rules) carries a small dark text-shadow. **The greeting is the exception inside the exception:** it hangs on the wall as a parchment scroll — `.opening` on Home takes the ivory tokens back (ink `#2b2216` on `#f1e7d2`-ish parchment, brass `#8b6a38`), a warm inset glow, and two dark wooden rods (`::before` / `::after`) past its edges; the quick-start chips inside it are ink on paper again. Every other page stays ivory; the room is not a theme, it is where Home is.

---

## Typography

| Font | Weights | Source | Variable / class |
|---|---|---|---|
| Cormorant Garamond | 400 / 500 / 600 + italics | Google Fonts via `next/font` | `--font-cormorant` → `.font-display` |
| EB Garamond | 400 / 500 + italics | Google Fonts via `next/font` | `--font-garamond` → `.font-body` (default on `body`) |

- **Display** (Cormorant): the wordmark (48px — sized so *Coherence* fits the sidebar's ~200px column with air; 32px in the mobile top strip, so the nav keeps its room), the greeting's title line (38px) and second line (26px, `--ink-soft`), the composer input (24px), italic asides ("Progress lives here.").
- **Body** (EB Garamond, 17px/1.45): everything else, including nav names (19px) and chips (16px).
- **Labels** (`.label`): EB Garamond 11px, uppercase, `letter-spacing: 0.24em`, `--ink-soft`, lining tabular figures. `.label-mute` for the quieter variant. Every kicker, date, and tagline in the interface is a `.label`.
- **Marginal notes** (`.pill`): the list and the estimate beside a title (*Personal · ~5 min*), set as tracked small caps in the mute ink like a source noted in the margin — no box, no fill (the boxed grey pill read as a SaaS tag, 2026-09-12). Two in a row are parted by a middle dot (`.pill + .pill::before`).
- **Figures:** `body` asks for old-style proportional figures (`font-variant-numeric`). The display face honours it, so a number in any display-set line sits on the baseline the way a book sets it; the Google-served EB Garamond has no such feature and shows lining figures regardless (`decisions.md`, 2026-09-12). Labels and marginal notes ask for lining figures explicitly, so caps and numerals stand at one height.
- **Line breaks:** display lines (`.opening-title`, `.opening-line`, `h1`, `h2`, `.session-goal`, `.session-question`) are `text-wrap: balance`; running text in messages is `text-wrap: pretty`, so no word is stranded on its last line.

Heading defaults: none imposed. Headings are display-font lines set per surface; there is no `h1` style to fight.

**Running heads:** every page but Chat opens with the same running head — its name as a `.label` kicker with a `Divider` beneath — and Today and Insights then set Lumi's 48px portrait as a `.medallion` beside the display-serif opening line, the way the greeting does on Chat. The browser tab reads the same way (`layout.tsx` title template): *Today · Coherence*, *Lists · Coherence*; Home is just *Coherence*.

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
| `.home-scene` | Home only: the painted room, fixed behind the shell, with its dimming `::after`; its presence (`.shell:has(.home-scene)`) re-lights every token on the page (see Color Palette → Home: the room) |
| `.composer` | The pill input container; `textarea` inside is display-font, auto-grows to 160px. `.is-listening` = brass border + soft ring while voice input is on |
| `.send` | 64px forest circle; disabled at 45% opacity |
| `.tool-link` | Text+icon quiet button (Add file / Voice / Tools) |
| `.nav-item` | Sidebar link; `[aria-current="page"]` gets the soft highlight; `.name` child |
| `.pill` | Marginal note beside a title (see Typography): tracked small caps, mute ink, no box; `·` between two |
| `.row` / `.row-quiet` | A list row: hairline beneath, 12px (8px quiet) of air; last row has no rule |
| `.circle` | The complete/reopen circle: hairline ring, brass on hover, forest fill when `.is-done` — and the tick draws itself in one stroke (220ms, the path carries `pathLength="1"`) |
| `.chat-now` | The part of the transcript said this visit: each `.msg` in it rises 6px and fades in over 260ms as it lands (`msg-in`); earlier messages are simply there |
| `.thinking-dots` | Lumi's three slow brass dots — in the chat while she thinks, and in Today's Right now card while the path is being cut (no grey skeleton bars) |
| `.session-bar` / `.session-checkin` | Focus Together (M5): the ruled strip above the composer while a session runs (`.session-goal` 24px display, `.session-step` 16px ink-soft, `.session-side` with the elapsed `.label-mute` and the End `.tool-link`), and the check-in as a small `--card` plate above it (`.session-question` 22px display + `.chip`s), fading in over 160ms |

---

## Component Patterns

### Greeting (`components/chat/Greeting.tsx`)
A chapter opening, not a card (2026-09-12: the boxed `.card.plate` read as a widget dropped onto the page). Set on the paper itself the way a chapter begins in a book: a headpiece across the measure (hairline · asterism · hairline, `.opening-head`), Lumi's portrait medallion in the margin, the first line as the title (38px display), the second beneath it in the softer ink (26px), then the quick-start chips. Lines come from `core/ai/greeting.ts` — never hardcode copy in the component. It is the chapter mark of the transcript (`MessageList`): everything from before this page open above it, this visit below; the page opens scrolled to it. No rule or box between the earlier messages and the greeting — the headpiece and the white space are the break. Within a sitting (`compact`) it is a running head: the same headpiece, a 44px portrait, 26/20px lines, no chips. It matches Today's opener (portrait medallion beside a display-serif greeting on bare paper), so the two pages open the same way. On Home (2026-09-12) the same opening hangs on the room's wall as a parchment scroll — ink on paper inside it, wooden rods past its edges — because it is the one light thing in a lamplit room, the way the tagline hangs on a scroll in the mockup; the markup is unchanged, only the tokens under `.shell:has(.home-scene) .opening`.

### Lumi sprites (`components/chat/LumiSprite.tsx`)
The single source of Lumi's drawings, both cut from `art/lumi/lumi-lantern-idle.png` — the lantern character (2026-09-12) — by `scripts/cut-lumi-idle.py`. `public/lumi-heads.png`: one row of 176px square cells, the hood 172px wide with its bottom on row 161 — neutral · blink · happy · curious · excited · sleepy, each from one of the sheet's sixteen cells (1 · 1 with the eyes shut · 6 · 11 · 12 · 7), cut under the chin where the hood's rim wraps beneath it. `public/lumi-idle.webp`: a 9×3 grid of 160×208 cells (wider than the earlier 144 for the lantern's light on the ground), three rows per loop (open, half-shut and shut eyes, so blinking and the loop run together): rows 0–2 the nine-cell **breath** loop. **A loop is an order over its row's cells** (`LUMI_LOOP_CELLS`; `LUMI_LOOP_FRAMES` is its length) and a cell may play more than once; every loop starts and ends at or next to the rest frame, so they hand over there. The sheet's sixteen cells are sixteen drawings — a pose set with expressions, not in-betweens (head IoU 0.83–0.96 per step against the 0.975 gate) — so played in sequence they would boil the way the first foot sheet did, and only the rest cell is cut for the body. Her idle life is made from that one drawing: the breath is the rest cell stretched up to 2px at the hood top with the feet held (`breathe`: a cubic resample on premultiplied channels anchored on the feet baseline, the rise eased over nine frames — the 1–2px the slow-idle sheet drew, from one drawing, so nothing else moves); the blink rows bring a lid down over her own eyes (`eyes_shut`: the lid is the face's black, half-shut keeps the bottom half of each eye, shut a thin bright lens, and the eye's halo on the face goes with the lid so no ring is left). The matte flood-fills the ground from outside the figure (so the cream hood survives); on the grey-blue ground the 2px edge band is de-matted against the ground using the nearest interior pixel as the figure's own colour, the shadow under the feet is read by its blue cast and redrawn in the cream sheets' warm tone (`SHADOW_RGB`), and the lantern's light on the ground — a warm blend of the ground and an orange light — is lifted off as a translucent warm glow (`GLOW_RGB`, ≤ 0.55 alpha), so on the paper she lights it a little. She stands `FIGURE_H` = 173px tall in the cell, what the earlier breath rest frame stood at, so she keeps her size on the page. The earlier character's loops (the slow-idle breath and sway, the playful foot with its per-row scaling, quarter-pixel settle and per-phase head hold) are retired with her; the techniques stay in git history and `art/README.md`. `LumiSprite` draws one cell at a height via `background-position`; `headCell` / `idleCell` address them. A new state is a new cell, never a new component. Adding a sheet — the prompt, `scripts/measure-lumi-sheet.py`, `scripts/preview-lumi-loop.py` and what the cut corrects — is written up in `art/README.md`; the process in `docs/animation-pipeline.md`.

### Lumi avatar (`components/chat/LumiAvatar.tsx`)
Forest circle with the hooded head. Props: `size` (default 68) and `expression` (default `neutral`). Never larger than the text it accompanies; never decorative on its own.

### Lumi companion (`components/shell/LumiCompanion.tsx`)
Lumi, full figure, standing a little in from the bottom-right corner of every page (`.companion`, fixed, 150px tall, ~115px wide at `right: 56px; bottom: 40px` — 28px/2px read as tucked into the corner). She is fixed to the viewport, outside the content column: on desktop `.chat-page` keeps a lane clear on its right (`--companion-lane`, 140px on top of `.main`'s 48px padding, added to the column's max-width) so the docked send button never sits under her at any width, whether the column fills `.main` or is centred inside it. Hidden under 768px, where there is no room for a lane, and the lane drops to 0. Idle life: the breath loop at ~320ms/frame (one breath ≈ 3s), every frame fading in **on top of** the previous so she never turns translucent (two frames mounted, keyed by loop and frame, the fade a mount animation — so a hand-over between loops fades like any other step; the fade lasts 80% of the frame time of the faster of the two loops involved, capped at 260ms, via `--fade` on the figure — a fixed 260ms on 120ms frames left each frame a third of the way in when it was replaced and snapped to full, a soft doubling of the hood; and a hand-over fades at the variation's pace both ways, since the way back at the breath's 260ms read as a slow turn of the head); every 20–45 s one pass of a variation, never the same one twice running, then back to breathing — none since the lantern character (2026-09-12): the sway and the playful foot were drawn of the earlier character, so `VARIATIONS` is empty until one is drawn of her; a blink every 2.5–6.5 s (half · shut · half, ~0.3s, occasionally doubled) by switching the eye row. No pose changes — the micro variations from `lumi-idle.png` read as image swaps and were dropped. All of it stops under `prefers-reduced-motion`. She is also the one control in the corner: `.companion-btn` wraps the figure (hover lifts her 3px; the global brass focus ring), and `.companion-bubble` is the speech bubble that opens above her — a 330px `--card` plate with a `--rule-strong` hairline, a 12px rotated-square tail over her head, a display-serif textarea (21px, grows to 120px) with a 40px `.send`, and above it the exchange (`.companion-said`: your line as a right-aligned `--paper-deep` bubble like the chat's `.msg-user`, 15px, sliding up 8px over 220ms on each send; `.companion-reply` at 17px with the chat `.ledger` beneath) under a hairline. Fades in over 160ms (off under reduced-motion). Stacks in the `.companion` flex column so she stays put when it opens. Testing note: Chrome freezes animations in a hidden tab (the Claude-in-Chrome automation window is usually occluded), and a capture of a frozen tab shows her mid-fade, ghostly — that is the capture, not the page. Dev only (`NODE_ENV === "development"`): `.companion-debug`, a row of tiny `.companion-debug-btn` chips fixed just above her head with a `.companion-debug-fold` handle at the right end that folds them away toward it (`.is-folded`, remembered in `localStorage`), cues a variation (played at the next rest frame, the same hand-over as a scheduled one — none today) or a blink (now) via a `lumi:cue` window event — for checking the loops without waiting; hidden with her under 768px, and while the bubble is open (it sits where the bubble opens).

### Lead card (`components/insights/LeadsSection.tsx`)
Insights opens the way Today does — the running head (kicker + divider), then Lumi's 48px portrait medallion beside a display-serif line (30/36px) — and then a column of `.card`s (gap 20px), one per thing she noticed: the title in display serif (26/28px), her *why* line in body 17px `--ink-soft`, a `.label.label-mute` meta line (sender · subject · when · date), and the two answers — a `.chip` (*Still needs doing*) and a `.tool-link` (*Let it go*), the same weights as *Not this*'s chips and *Keep it*. Answered, the row's controls become one ledger-style line (`.ledger-mark` ✦ + *On your list.* / *Let go.*). The page's one flourish is the divider under the kicker; the tailpiece appears only when there is nothing. No counts, no badges, no unread dot on the nav item.

### Ornaments (`components/ui/Ornament.tsx`)
Printer's marks, the engraved vocabulary an old book uses instead of icons. Inline SVG in brass (`.ornament`), hairline weight, `aria-hidden`; they decorate, never carry meaning. Three glyphs: **Diamond** ✦ (the smallest mark: dividers, visit rules), **Fleuron** ❦ (the hedera, an ivy leaf with a curled stem: tailpieces, the sidebar foot), **Asterism** ⁂ (a pause in the text: the greeting's headpiece, where this visit begins after whatever was there). Two layouts: `Divider` (replaces the short rule under every kicker) and `Tailpiece` (closes an empty page). **One flourish per surface** — the greeting has its headpiece, a page has its tailpiece, a sitting break has its diamonds. If a surface already has one, it does not get another.

### Quick starts (`components/chat/QuickStarts.tsx`)
Four chips + a round "another way in" button. They are starting points, not modes; from M2 they send a canned first message.

### Session bar (`components/focus/SessionBar.tsx`)
Focus Together on screen, Chat only, pinned between the transcript and the composer while a session runs. A **ruled strip on the paper** — hairline above and below, no box — with the *Together* label, the goal in display serif (24px), *First: the step* in ink-soft, and on the right the elapsed label (*12 of 45 min*, tracked small caps, mute — minutes in, never a countdown) over a quiet **End** tool-link. When a check-in is due, a small `--card` plate appears **above** the strip (the same plate as the companion bubble: rule-strong hairline, 6px radius, one shadow, 160ms fade): the question in display serif (22px) on the left, four `.chip`s on the right — Yep · Stuck · Got distracted · Done. One question, one tap, then it is gone; nothing pulses, counts down or turns red. Chips disable (except Yep) while a turn streams; End disables too. On phones the goal drops to 20px and the question to 19px; the strip wraps. Copy comes from `core/focus.ts`, never from the component.

### Composer (`components/chat/Composer.tsx`)
`+` icon button · auto-growing textarea · send. Below it, the Voice toggle (only where supported; `.tool-link.is-listening` breathes in brass) and the closing label ("You don't have to do it alone."). Enter sends, Shift+Enter newlines. Voice is `useVoiceInput` (`components/chat/useVoiceInput.ts`): Web Speech API, continuous + interim results, transcript appended to the typed text.

### Sidebar (`components/shell/Sidebar.tsx`)
Wordmark, tagline label, divider ornament, nav of plain names (no numerals) with a brass diamond marking the open chapter, italic footer aside between a divider and a fleuron. The plate frame (`::after`) has **crossed corners** (`::before`): each rule runs 6px past the corner, the way a ruled border is drawn by hand. Active route from `usePathname`. The first item is **Home** (was *Chat* until 2026-09-12). On Home the plate is a translucent wood panel over the painting (dark glass, 16px blur) with parchment type; the frame and crossed corners keep their rules in parchment.

### Clock (`components/ui/Clock.tsx`)
Viewer-local date + time as a `.label`, top right. Renders empty on the server and fills on mount (no hydration mismatch).

### Icons
Inline SVG, `stroke="currentColor"`, 1.4–1.6 stroke, round caps. No icon font, no icon library.

### Favicon (`app/icon.svg`)
Lumi's hooded head in the forest circle with a brass hairline ring, drawn as flat SVG shapes (the raster sprite does not survive 16px). Replaces the default Next favicon.

---

## Accessibility

- Every icon-only button has an `aria-label`.
- Every animation stops under `prefers-reduced-motion` — the companion, the check-in plate, messages landing, the tick drawing.
- Nav uses `aria-current="page"`.
- Focus: one ring for the whole book — `:focus-visible` is a 1px brass outline offset 3px. The composer textarea suppresses it (the pill's `.is-listening`/border carries state).
- Selection is brass-soft on ink. Scrollbars are thin and translucent brass, never the browser grey.
- Contrast: ink on paper ≈ 14:1; ink-mute on paper ≈ 3.4:1 — mute is for non-essential text only.
