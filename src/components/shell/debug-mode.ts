/**
 * Debug mode: for looking at what Lumi holds while she's being built, not for
 * users. Five quick taps on the wordmark in the nav's parchment turn it on or
 * off (Sidebar), remembered per browser in a cookie the room pages read, so
 * what it shows is rendered with the page (components/library/LibraryDebug.tsx).
 */
export const DEBUG_COOKIE = "coherence_debug";
export const DEBUG_TAPS = 5;
/** The taps count as one run while each comes within this long of the first of the last five. */
export const DEBUG_TAP_WINDOW_MS = 2000;

export function debugFrom(value: string | undefined): boolean {
  return value === "1";
}
