"use client";

import { useEffect, useState } from "react";

/** Renders the viewer's local date and time. Empty until mounted so server and client markup agree. */
export function Clock() {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      setText(`${date} ${time}`);
    };
    fmt();
    const id = setInterval(fmt, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="label min-h-[14px]" aria-live="off">
      {text}
    </span>
  );
}
