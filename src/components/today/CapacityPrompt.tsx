"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CapacityLevel } from "@/core/domain/capacity";

const ANSWERS: { level: CapacityLevel; label: string }[] = [
  { level: "low", label: "Not much" },
  { level: "normal", label: "Normal-ish" },
  { level: "high", label: "Lots" },
];

/**
 * "How much have we got today?" — asked at most once a day, skippable, never
 * blocking. Answering re-cuts the path; the page refreshes with the new one.
 * Capacity is context Lumi uses, not a metric the user tracks. docs/today.md → Anatomy.
 */
export function CapacityPrompt() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "answering" | "skipping" | "failed">("idle");

  const post = async (body: { level: CapacityLevel } | { skip: true }, next: "answering" | "skipping") => {
    setState(next);
    try {
      const r = await fetch("/api/capacity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(String(r.status));
      router.refresh();
    } catch {
      setState("failed");
    }
  };

  if (state === "answering") {
    return <p className="today-capacity font-display italic text-ink-mute">Shaping the day around that…</p>;
  }

  // Part of Lumi's words on the painting: the question, then the answers as quiet words, not buttons.
  const busy = state === "skipping";
  return (
    <section aria-label="Capacity" className="today-capacity">
      <p className="font-display text-ink">{state === "failed" ? "That didn't take. Once more?" : "How much have we got today?"}</p>
      <div className="today-capacity-answers mt-1.5 flex flex-wrap items-center">
        {ANSWERS.map((a) => (
          <button key={a.level} type="button" className="tool-link" disabled={busy} onClick={() => post({ level: a.level }, "answering")}>
            {a.label}
          </button>
        ))}
        <button type="button" className="tool-link today-capacity-skip" disabled={busy} onClick={() => post({ skip: true }, "skipping")}>
          Skip
        </button>
      </div>
    </section>
  );
}
