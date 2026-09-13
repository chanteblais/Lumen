"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Back in a tab after this long away and the page is read again. */
const AWAY_MS = 60_000;

/**
 * Every page is rendered from the database on every visit, so what it shows is
 * current when it opens. Two ways back skip the server, and this closes both.
 * Renders nothing.
 * - Back / Forward: Next restores the page as it was left. Say you're on Today,
 *   tell Lumi on Home that something is done, then go back: Today would still
 *   show it. The restored page is refreshed straight after.
 * - Returning to a tab left open a minute or more: something may have changed
 *   in another tab (the companion bubble) or on another device.
 * A refresh keeps what's on screen (scroll, a half-typed message) and swaps in
 * what the server says now.
 */
export function FreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    // After a tick, so Next's own popstate handler has restored the page being refreshed.
    const onPopState = () => setTimeout(() => router.refresh(), 0);
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= AWAY_MS) router.refresh();
    };
    window.addEventListener("popstate", onPopState);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);
  return null;
}
