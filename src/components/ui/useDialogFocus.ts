"use client";

import { useEffect, type RefObject } from "react";

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog's keyboard focus. While `active`: focus moves into `container`
 * (give it `tabIndex={-1}`), and Tab / Shift+Tab wrap around inside it rather
 * than wandering to the page underneath. When it closes, focus goes back to
 * what had it before — unless you've put it somewhere else yourself meanwhile
 * (a click on the nav), which it leaves alone.
 */
export function useDialogFocus(container: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const el = container.current;
    if (!active || !el) return;
    const from = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    el.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || e.defaultPrevented) return;
      const stops = [...el.querySelectorAll<HTMLElement>(TABBABLE)].filter((s) => s.getClientRects().length > 0);
      const first = stops[0];
      const last = stops.at(-1);
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const at = document.activeElement;
      const inside = at instanceof Node && el.contains(at);
      const wrap = e.shiftKey ? !inside || at === first || at === el : !inside || at === last;
      if (!wrap) return;
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      const now = document.activeElement;
      if (from?.isConnected && (!now || now === document.body || el.contains(now))) from.focus();
    };
  }, [container, active]);
}
