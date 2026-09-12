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
| Rule | `rgba(27,26,23,.16)` | — | Fine rules, borders |
| Rule strong | `rgba(27,26,23,.34)` | — | Short rules, composer border |

**Paper grain:** `body::before` — a fixed, non-interactive SVG `feTurbulence` layer at 28% opacity, multiply blend. Keep it barely perceptible; if you notice it, it's too strong.

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
- **Mobile breakpoint:** `767px` (CSS). Sidebar becomes a top strip: wordmark left, nav names right; the footer aside and numerals are hidden.
- **Radii:** cards `10px`; chips, icon buttons, composer, send `999px`.
- **Shadow:** one token, `--shadow` (two soft layers). Nothing else casts.

---

## Reusable CSS Classes (`globals.css`)

| Class | What it does |
|---|---|
| `.label` / `.label-mute` | Tracked small caps (see Typography) |
| `.rule` / `.rule-short` | 1px full rule / 34px short rule (`!w-[18px]` variant used under kickers) |
| `.card` | Card surface: `--card` bg, rule border, 10px radius, `--shadow` |
| `.chip` | Pill button on paper-deep; hover darkens, active nudges 1px |
| `.icon-btn` | 44px round icon button on paper-deep |
| `.chat-page` / `.chat-scroll` / `.composer-dock` | Chat layout: flex column filling `.main`; the transcript scrolls; the dock sits below with a paper fade above it |
| `.composer` | The pill input container; `textarea` inside is display-font, auto-grows to 160px. `.is-listening` = brass border + soft ring while voice input is on |
| `.send` | 64px forest circle; disabled at 45% opacity |
| `.tool-link` | Text+icon quiet button (Add file / Voice / Tools) |
| `.nav-item` | Sidebar link; `[aria-current="page"]` gets the soft highlight; `.num` / `.name` children |

---

## Component Patterns

### Greeting card (`components/chat/GreetingCard.tsx`)
Avatar left, display lines right, quick-start chips below. Lines come from `core/ai/greeting.ts` — never hardcode copy in the component.

### Lumi sprites (`components/chat/LumiSprite.tsx`)
The single source of Lumi's drawings, cut from the character sheet (`mockups/lumi.png`, checkerboard keyed out). `public/lumi-heads.png`: one row of 176px square cells — neutral · blink · happy · curious · excited · sleepy. `public/lumi-body.png`: one row of 208×288 cells — `stand`, `stand-blink-half`, `stand-blink` (eyes painted out of `stand`), then the idle moments `perk` · `tilt` · `wave` · `lean` from the sheet's idle row, scaled so their faces match the standing figure. `LumiSprite` draws one cell at a height via `background-position`; a new state is a new cell, never a new component.

### Lumi avatar (`components/chat/LumiAvatar.tsx`)
Forest circle with the hooded head. Props: `size` (default 68) and `expression` (default `neutral`). Never larger than the text it accompanies; never decorative on its own.

### Lumi companion (`components/shell/LumiCompanion.tsx`)
Lumi, full figure, standing on the bottom-right edge of every page (`.companion`, fixed, 150px tall). Idle life: a slow breathing bob (`@keyframes breathe`, 4s), a blink every 3–7 s with an occasional double, and a moment (perk / tilt / wave / lean) cross-faded over the standing pose for 2–3 s — the first 3–6 s after arriving, then every 8–18 s. All of it stops under `prefers-reduced-motion`. `.main` reserves a bottom band (168px desktop, 110px mobile where she is scaled to 62%) so she never sits on the composer row. `pointer-events: none`, `aria-hidden` — she is company, not a control.

### Quick starts (`components/chat/QuickStarts.tsx`)
Four chips + a round "another way in" button. They are starting points, not modes; from M2 they send a canned first message.

### Composer (`components/chat/Composer.tsx`)
`+` icon button · auto-growing textarea · send. Below it, the Voice toggle (only where supported; `.tool-link.is-listening` breathes in brass) and the closing label ("You don't have to do it alone."). Enter sends, Shift+Enter newlines. Voice is `useVoiceInput` (`components/chat/useVoiceInput.ts`): Web Speech API, continuous + interim results, transcript appended to the typed text.

### Sidebar (`components/shell/Sidebar.tsx`)
Wordmark, tagline label, short rule, numbered nav (`01 Chat` …), italic footer aside between two short rules. Active route from `usePathname`.

### Clock (`components/ui/Clock.tsx`)
Viewer-local date + time as a `.label`, top right. Renders empty on the server and fills on mount (no hydration mismatch).

### Icons
Inline SVG, `stroke="currentColor"`, 1.4–1.6 stroke, round caps. No icon font, no icon library.

---

## Accessibility

- Every icon-only button has an `aria-label`.
- Nav uses `aria-current="page"`.
- Focus: rely on the browser ring for now; define a brass focus ring once forms exist (M1).
- Contrast: ink on paper ≈ 14:1; ink-mute on paper ≈ 3.4:1 — mute is for non-essential text only.
