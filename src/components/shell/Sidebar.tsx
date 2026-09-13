"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Diamond, Flourish, Sparkle } from "@/components/ui/Ornament";
import { NAV_MODE_COOKIE, type NavMode } from "./nav-pin";
import { BookIcon, GearIcon, HomeIcon, SprigIcon, SunIcon } from "./NavIcons";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/today", label: "Today", Icon: SunIcon },
  { href: "/library", label: "Library", Icon: BookIcon },
  { href: "/insights", label: "Insights", Icon: SprigIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
] as const;

/** Where the parchment can be pinned (the CSS breakpoint); below it, the compass star opens it for one visit. */
const PINS = "(min-width: 768px)";

/**
 * The rail and its parchment. The painted rail is always there: an icon per
 * place, and a brass star on its rule beside the one you're in. The names are
 * on the parchment, which slides out while the pointer is over the nav (or
 * keyboard focus is in it) and floats over the page; the page never moves
 * for it. Three ways it can be, remembered in a cookie:
 * - `hover`, the default;
 * - `pinned` open — the compass star, or a click anywhere on the rail or the
 *   parchment that isn't a link; the same again folds it, at once, even with
 *   the pointer still over it (hover can't reopen it until the pointer has
 *   left, or it looks stuck open);
 * - `locked` away — the moon: hover never opens it; the moon again, or a pin,
 *   lets it out.
 * On a phone there is no hover: the compass star opens it over the page,
 * and a tap on a place, outside it or Escape folds it away.
 */
export function Sidebar({ modeAtLoad }: { modeAtLoad: NavMode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<NavMode>(modeAtLoad);
  const [open, setOpen] = useState(false);
  const [resting, setResting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function remember(next: NavMode) {
    setMode(next);
    document.cookie = `${NAV_MODE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  function togglePin() {
    if (!window.matchMedia(PINS).matches) return setOpen((o) => !o);
    const pinning = mode !== "pinned";
    remember(pinning ? "pinned" : "hover");
    setResting(!pinning);
  }

  function toggleLock() {
    setOpen(false);
    remember(mode === "locked" ? "hover" : "locked");
    setResting(true); // unlocked under the pointer, it waits for the pointer to leave before hover opens it
  }

  function onNavClick(e: MouseEvent) {
    if ((e.target as Element).closest("a, button")) return;
    togglePin();
  }

  const pinned = mode === "pinned";
  const locked = mode === "locked";
  const shown = open || pinned;
  return (
    <aside
      ref={ref}
      className="nav"
      data-pinned={pinned || undefined}
      data-locked={locked || undefined}
      data-open={open || undefined}
      data-resting={resting || undefined}
      onPointerLeave={() => setResting(false)}
      onClick={onNavClick}
    >
      <div className="nav-rail" aria-hidden />
      <button
        type="button"
        className="nav-toggle"
        onClick={togglePin}
        aria-expanded={shown}
        aria-label={shown ? "Fold the names away" : "Keep the names open"}
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
          <Link href="/" className="font-display nav-wordmark">
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
          {NAV.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="nav-item"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
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
