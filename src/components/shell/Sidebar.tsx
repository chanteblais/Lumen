"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { Diamond, Flourish, Sparkle } from "@/components/ui/Ornament";
import { isPublicPath } from "@/lib/public-paths";
import { DEBUG_COOKIE, DEBUG_TAP_WINDOW_MS, DEBUG_TAPS } from "./debug-mode";
import { NAV_MODE_COOKIE, type NavMode } from "./nav-pin";
import { BookIcon, GearIcon, HomeIcon, ListIcon, SprigIcon, SunIcon } from "./NavIcons";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/today", label: "Today", Icon: SunIcon },
  { href: "/library", label: "Library", Icon: BookIcon },
  // The tools, set apart from the rooms above: Lists is a sheet over the page you're on (app/@sheet), not a room.
  { href: "/lists", label: "Lists", Icon: ListIcon, tools: true },
  { href: "/insights", label: "Insights", Icon: SprigIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon, utility: true }, // a utility, not a space: set a little apart
] as const;

/** Where the rail and its parchment are (the CSS breakpoint); below it, the nav is a bar along the bottom with the names on it. */
const PINS = "(min-width: 768px)";

/**
 * The rail and its parchment. The painted rail is always there: an icon per
 * place, and a brass star on its rule beside the one you're in. The names are
 * on the parchment, which slides out while the pointer is over the nav (or
 * keyboard focus is in it) and floats over the page; the page never moves
 * for it. Three ways it can be, remembered in a cookie:
 * - `hover`, the default;
 * - `pinned` out — a click on the top half of the rail (the compass star's
 *   half) or on the parchment, anywhere that isn't a link; the same again
 *   folds it, at once, even with the pointer still over it (hover can't
 *   reopen it until the pointer has left, or it looks stuck open);
 * - `locked` in — a click on the bottom half of the rail (the moon's half):
 *   hover never opens it; the same again, or a pin, lets it out.
 * On a phone the rail lies down as a bar along the bottom, every icon with its
 * name under it: nothing opens, pins or locks there (CSS does the layout).
 * Not on the sign-in and sign-up pages: the nav belongs to the space you
 * enter once signed in (decided by the path, so it never flashes while the
 * session loads).
 */
export function Sidebar({ modeAtLoad }: { modeAtLoad: NavMode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<NavMode>(modeAtLoad);
  const [resting, setResting] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const taps = useRef<number[]>([]);

  /** Five quick taps on the wordmark turn debug mode on or off (debug-mode.ts). The first tap still goes Home; the rest of a run stay put. */
  function onWordmarkClick(e: MouseEvent) {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < DEBUG_TAP_WINDOW_MS), now];
    if (taps.current.length > 1) e.preventDefault();
    if (taps.current.length < DEBUG_TAPS) return;
    taps.current = [];
    const on = !document.cookie.split("; ").includes(`${DEBUG_COOKIE}=1`);
    document.cookie = on ? `${DEBUG_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax` : `${DEBUG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    // A full load, not router.refresh(): the first tap's navigation to Home can still be loading, and a refresh behind it is lost.
    window.location.reload();
  }

  function remember(next: NavMode) {
    setMode(next);
    document.cookie = `${NAV_MODE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  function togglePin() {
    const pinning = mode !== "pinned";
    remember(pinning ? "pinned" : "hover");
    setResting(!pinning);
  }

  function toggleLock() {
    remember(mode === "locked" ? "hover" : "locked");
    setResting(true); // unlocked under the pointer, it waits for the pointer to leave before hover opens it
  }

  function onNavClick(e: MouseEvent) {
    if ((e.target as Element).closest("a, button") || !window.matchMedia(PINS).matches) return;
    // Judged by where the click lands, not what it lands on: the gaps between the icons belong to the list over the rail.
    const rail = ref.current?.querySelector(".nav-rail")?.getBoundingClientRect();
    if (rail && e.clientX <= rail.right && e.clientY > rail.top + rail.height / 2) return toggleLock();
    togglePin();
  }

  if (isPublicPath(pathname)) return null;

  const pinned = mode === "pinned";
  const locked = mode === "locked";
  return (
    <aside
      ref={ref}
      className="nav"
      data-pinned={pinned || undefined}
      data-locked={locked || undefined}
      data-resting={resting || undefined}
      onPointerLeave={() => setResting(false)}
      onClick={onNavClick}
    >
      <div className="nav-rail" aria-hidden />
      <button
        type="button"
        className="nav-toggle"
        onClick={togglePin}
        aria-expanded={pinned}
        aria-label={pinned ? "Fold the names away" : "Keep the names open"}
      />
      <button
        type="button"
        className="nav-lock"
        onClick={toggleLock}
        aria-pressed={locked}
        aria-label={locked ? "Let the names open on hover again" : "Keep the names folded away"}
      />

      <div className="nav-panel">
        <div className="nav-head">
          <Flourish className="nav-crest" />
          <Link href="/" className="font-display nav-wordmark" onClick={onWordmarkClick}>
            Coherence
          </Link>
          <p className="font-display nav-tagline">
            A quieter
            <br />
            way forward.
          </p>
          <Flourish className="nav-divider" />
        </div>

        <nav className="nav-list" aria-label="Primary">
          {NAV.map((place) => {
            const { href, label, Icon } = place;
            const apart = "utility" in place ? " nav-utility" : "tools" in place ? " nav-tools" : "";
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${apart}`}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon">
                  <Icon />
                </span>
                <Diamond size={10} className="nav-mark" />
                <span className="name">{label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="font-display nav-foot">
          Progress
          <br />
          lives here.
          <Sparkle size={9} />
        </p>
      </div>
    </aside>
  );
}
