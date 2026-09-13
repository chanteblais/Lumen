/**
 * How the nav's parchment behaves, remembered per browser in a cookie the layout reads (so the page
 * renders it right from the first paint): `pinned` open (the compass star), `hover` (it opens while
 * the pointer is over the nav) or `locked` away (the moon: it never opens on hover).
 */
export type NavMode = "pinned" | "hover" | "locked";

export const NAV_MODE_COOKIE = "coherence_nav";

/** Anything unknown (and the old `folded`) is `hover`. */
export function navModeFrom(value: string | undefined): NavMode {
  return value === "pinned" || value === "locked" ? value : "hover";
}
