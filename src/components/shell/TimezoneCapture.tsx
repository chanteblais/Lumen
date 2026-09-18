"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const COOKIE = "coherence_tz";

/**
 * Tells the server the browser's IANA timezone via a cookie. Renders nothing.
 * On the very first visit (no cookie yet) it refreshes once so the server
 * re-renders "today"/greeting in the right zone.
 */
export function TimezoneCapture() {
  const router = useRouter();
  useEffect(() => {
    let tz: string;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz) return;
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    // Stored encoded ("America%2FVancouver"): compare what it says, not how it's spelled.
    let current = raw;
    try {
      current = raw && decodeURIComponent(raw);
    } catch {}
    if (current === tz) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(tz)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    if (!current) router.refresh();
  }, [router]);
  return null;
}
