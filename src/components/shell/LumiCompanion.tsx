"use client";

import { useEffect, useState } from "react";
import { LUMI_MOMENTS, LumiSprite, type LumiPose } from "@/components/chat/LumiSprite";

/**
 * Lumi in the corner of the screen, keeping you company. Full figure, standing
 * on the bottom edge. Purely decorative: no clicks, no state, nothing to maintain.
 *
 * Idle life, all of it off under `prefers-reduced-motion`:
 * - a slow breathing bob (CSS, `.companion-figure`)
 * - a blink every few seconds, sometimes doubled
 * - now and then a "moment" from the sheet's idle row (perk, tilt, wave, lean),
 *   cross-faded over the standing pose and held for a beat
 */
export function LumiCompanion() {
  const [pose, setPose] = useState<LumiPose>("stand");
  const [moment, setMoment] = useState<LumiPose | null>(null);
  const [momentOn, setMomentOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    let inMoment = false;

    // One blink: half → shut → half → open. Occasionally two in a row.
    // Skipped while a moment is showing (its frame has its own eyes).
    const blink = (thenDouble: boolean) => {
      if (inMoment) return scheduleBlink();
      setPose("stand-blink-half");
      after(60, () => setPose("stand-blink"));
      after(150, () => setPose("stand-blink-half"));
      after(210, () => {
        setPose("stand");
        if (thenDouble) after(160, () => blink(false));
        else scheduleBlink();
      });
    };
    const scheduleBlink = () => after(between(2800, 7000), () => blink(Math.random() < 0.2));

    // A moment: mount, fade in, hold, fade out, unmount. Never the same one twice running.
    let last: LumiPose | null = null;
    const showMoment = () => {
      const options = LUMI_MOMENTS.filter((m) => m !== last);
      const next = options[Math.floor(Math.random() * options.length)];
      last = next;
      inMoment = true;
      setMoment(next);
      after(30, () => setMomentOn(true));
      after(between(2200, 3200), () => {
        setMomentOn(false);
        after(280, () => {
          setMoment(null);
          inMoment = false;
          scheduleMoment();
        });
      });
    };
    const scheduleMoment = () => after(between(8000, 18000), showMoment);

    scheduleBlink();
    after(between(3000, 6000), showMoment); // first moment soon after arriving, then the slower rhythm
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="companion" aria-hidden>
      <div className="companion-figure">
        <LumiSprite sheet="body" cell={pose} height={150} className="companion-base" style={{ opacity: momentOn ? 0 : 1 }} />
        {moment && (
          <LumiSprite sheet="body" cell={moment} height={150} className={`companion-moment ${momentOn ? "on" : ""}`} />
        )}
      </div>
    </div>
  );
}
