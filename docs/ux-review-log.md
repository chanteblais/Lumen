# UX Review Log

Running log of findings from UX passes. Each finding carries a **Severity** (how much it hurts someone using Coherence — with the EF lens: does it add burden?), an **Effort** guess, and a **Status** (`proposed` → Chanté decides → `fix agreed` / `fixed` / `dismissed`). Newest review at the top. Fixes are only applied once agreed.

Finding format: `### N. <title> · Severity: … · Effort: … · Status: …` followed by a short paragraph and the suggested fix.

---

## Review 1 — the app on a phone (2026-09-13, `fix/mobile-pass`)

Mobile Safari on the iOS Simulator (iPhone 17, 402pt wide), as the local test user, after the sideways-drag fixes (`qa-log.md` → Sweep 10). Sizes were measured in the page, not read off screenshots. Nothing below is applied.

### 1. Tap targets under 44pt in the core loop · Severity: medium · Effort: S–M · Status: proposed
The things tapped most are the smallest: ticking something off (the circle, 24×24pt in Lists and 22×22 in Today's *After that*), a row's *Add date* (64×30) and ⋯ (34×34), the Lists tabs (34pt tall), Today's card actions *Not this · Break it down · Done* (23pt tall) and the capacity answers *Not much · Normal-ish · Lots · Skip* (20pt tall, a middle dot apart). Apple's minimum is 44pt. A missed tap on a tick is the small friction that costs someone with little activation energy the moment. Suggested fix: on phones only, widen the hit areas without changing how anything looks — a transparent `::after` reaching 44pt on the circles, the date, ⋯ and the card actions (the pattern `.opening-rod::after` already uses), 44pt-tall tabs, and more vertical padding on the capacity answers.

### 2. The Lists tab strip gives no hint that it scrolls · Severity: low · Effort: S · Status: proposed
On a phone the tabs run off the right edge (*Pe…* after All · School · Work) with no fade, so *Completed*, *Today* and *Due soon* are out of sight until you happen to swipe. Suggested fix: a short parchment fade at the strip's right edge while there is more to scroll.

### 3. The greeting is cut by a hard edge once a conversation starts · Severity: low · Effort: S · Status: proposed
After the first message the view follows the newest line, and the greeting slides up under the clock bar, cut straight through its title where the scroll area begins. On the painting it reads as a crop rather than paper passing out of view. Suggested fix: a soft mask over the top 16–24px of `.chat-scroll` on Home.

### 4. The greeting fills most of a phone's first screen · Severity: low · Effort: S · Status: proposed
On a fresh open the scroll (headpiece, portrait, a two-line title, the second line, three quick starts) fills about 60% of the height above the composer, and the 64px portrait narrows the title so *Good to see you, Test.* wraps. It stays calm, and rolling it up already gives the room back, so this is a question rather than a fault: on phones, the compact 44px portrait would keep the title on one line and take back some height.

### 5. Next's dev indicator covers the Home tab · Severity: low (dev only) · Effort: XS · Status: proposed
Under `npm run dev` on a phone the round N badge sits over the Home tab, so a tap on Home opens Next's menu instead. Users never see it, but you will when you check a change on your phone. Suggested fix: `devIndicators: { position: "top-left" }` in `next.config.ts` (over the clock), or `devIndicators: false`.
