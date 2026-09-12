"use client";

import { useEffect, useState } from "react";
import {
  LUMI_IDLE_FRAMES,
  LUMI_MOMENTS,
  LumiSprite,
  cellSize,
  idleCell,
  momentCell,
  type LumiEyes,
  type LumiMoment,
} from "@/components/chat/LumiSprite";

const HEIGHT = 150;
const FRAME_MS = 520; // eight frames ≈ one breath every four seconds

/**
 * Lumi in the corner of the screen, keeping you company. Full figure, standing
 * on the bottom edge. Purely decorative: no clicks, no state, nothing to maintain.
 *
 * Idle life, all of it off under `prefers-reduced-motion`:
 * - the sheet's eight-frame idle loop (breathe + sway), each frame fading in
 *   over the last so the motion reads as movement, not a slideshow
 * - a blink every few seconds, composited onto whichever frame is showing so
 *   the two cycles run together
 * - now and then a micro variation (head tilt, look up, fidget…) faded over the
 *   loop and held for a beat
 */
export function LumiCompanion() {
  const [frame, setFrame] = useState(0);
  const [eyes, setEyes] = useState<LumiEyes>("open");
  const [moment, setMoment] = useState<LumiMoment | null>(null);
  const [momentOn, setMomentOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

    const loop = setInterval(() => setFrame((f) => (f + 1) % LUMI_IDLE_FRAMES), FRAME_MS);

    // Blink per the sheet's timing: half → shut → half → open, ~0.4s. Occasionally doubled.
    const blink = (thenDouble: boolean) => {
      setEyes("half");
      after(60, () => setEyes("closed"));
      after(200, () => setEyes("half"));
      after(260, () => {
        setEyes("open");
        if (thenDouble) after(180, () => blink(false));
        else scheduleBlink();
      });
    };
    const scheduleBlink = () => after(between(2800, 7000), () => blink(Math.random() < 0.2));

    // A moment: mount, fade in over the loop, hold, fade out, unmount. Never the same one twice running.
    let last: LumiMoment | null = null;
    const showMoment = () => {
      const options = LUMI_MOMENTS.filter((m) => m !== last);
      const next = options[Math.floor(Math.random() * options.length)];
      last = next;
      setMoment(next);
      after(30, () => setMomentOn(true));
      after(between(2400, 3400), () => {
        setMomentOn(false);
        after(450, () => {
          setMoment(null);
          scheduleMoment();
        });
      });
    };
    const scheduleMoment = () => after(between(18000, 40000), showMoment);

    scheduleBlink();
    after(between(6000, 12000), showMoment);
    return () => {
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, []);

  const prev = (frame + LUMI_IDLE_FRAMES - 1) % LUMI_IDLE_FRAMES;
  const frames = Array.from({ length: LUMI_IDLE_FRAMES }, (_, i) => i);

  return (
    <div className="companion" aria-hidden>
      <div className="companion-figure" style={cellSize("body", HEIGHT)}>
        {frames.map((i) => (
          <LumiSprite
            key={i}
            cell={idleCell(i, eyes)}
            height={HEIGHT}
            className={`companion-frame ${i === frame ? "on" : i === prev ? "prev" : ""}`}
          />
        ))}
        {moment && <LumiSprite cell={momentCell(moment)} height={HEIGHT} className={`companion-moment ${momentOn ? "on" : ""}`} />}
      </div>
    </div>
  );
}
