# Design System

Antique book × modern editorial interface. Tokens live in `src/app/globals.css` (`:root` custom properties, mapped into Tailwind via `@theme inline`). Tailwind is for layout; the named classes below carry the look.

---

## Color Palette

| Name | Hex | Tailwind class | Usage |
|---|---|---|---|
| Paper | `#efeae2` | `bg-paper` | Page ground |
| Paper deep | `#e6e0d5` | `bg-paper-deep` | Sidebar, chips, icon buttons |
| Card | `#f8f5ef` | `bg-card` | Greeting card, composer, message surfaces |
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

- **Display** (Cormorant): the wordmark (56px), greeting lines (26–30px), the composer input (24px), italic asides ("Progress lives here.").
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
| `.plate` | Adds a second hairline set 6px in from a `.card`'s edge — an engraving's frame. Greeting card only |
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

### Greeting card (`components/chat/GreetingCard.tsx`)
Avatar left, display lines right, quick-start chips below. Lines come from `core/ai/greeting.ts` — never hardcode copy in the component.

### Lumi sprites (`components/chat/LumiSprite.tsx`)
The single source of Lumi's drawings. `public/lumi-heads.png`: one row of 176px square cells cut from `mockups/lumi.png` — neutral · blink · happy · curious · excited · sleepy. `public/lumi-idle.webp`: an 8×4 grid of 208×288 cells cut from `mockups/lumi-idle.png` — row 0 the eight-frame idle loop (breathe + sway, sway offsets preserved), rows 1–2 the same frames with the sheet's half-shut and shut eyes composited on (so blinking and swaying run together), row 3 the eight micro variations (head tilt · curious · look down · look up · fidget · adjust cloak · small step · stretch) scaled to the idle figure. `LumiSprite` draws one cell at a height via `background-position`; `headCell` / `idleCell` / `momentCell` address them. A new state is a new cell, never a new component.

### Lumi avatar (`components/chat/LumiAvatar.tsx`)
Forest circle with the hooded head. Props: `size` (default 68) and `expression` (default `neutral`). Never larger than the text it accompanies; never decorative on its own.

### Lumi companion (`components/shell/LumiCompanion.tsx`)
Lumi, full figure, standing on the bottom-right edge of every page (`.companion`, fixed, 150px tall; hidden under 768px where she'd sit on the docked send button). Idle life: the eight idle frames play at 520ms each, every frame fading in **on top of** the previous one (which stays opaque until covered) so she never turns translucent; a blink every 3–7 s (half · shut · half, ~0.4s, occasionally doubled) by switching the eye row; a micro variation faded over the loop for 2.4–3.4 s — the first 6–12 s after arriving, then every 18–40 s. All of it stops under `prefers-reduced-motion`. `pointer-events: none`, `aria-hidden` — she is company, not a control.

### Ornaments (`components/ui/Ornament.tsx`)
Printer's marks, the engraved vocabulary an old book uses instead of icons. Inline SVG in brass (`.ornament`), hairline weight, `aria-hidden`; they decorate, never carry meaning. Three glyphs: **Diamond** ✦ (the smallest mark: dividers, visit rules), **Fleuron** ❦ (the hedera, an ivy leaf with a curled stem: tailpieces, the sidebar foot), **Asterism** ⁂ (reserved for a pause in the text). Two layouts: `Divider` (replaces the short rule under every kicker) and `Tailpiece` (closes an empty page). **One flourish per surface** — a plate has its frame, a page has its tailpiece, a sitting break has its diamonds. If a surface already has one, it does not get another.

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
