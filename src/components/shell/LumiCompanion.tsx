"use client";

import { useEffect, useState } from "react";
import { LUMI_LOOP_FRAMES, LumiSprite, cellSize, idleCell, type LumiEyes, type LumiLoop } from "@/components/chat/LumiSprite";

const HEIGHT = 150;
/** Time per frame of each loop. */
const FRAME_MS: Record<LumiLoop, number> = {
  breath: 320, // nine frames ≈ one breath every three seconds
  sway: 560, // nine frames ≈ five seconds, per the sheet
  foot: 200, // eight frames ≈ 1.6 s, the sheet's calmer suggestion
};
/** Loops mixed into the breathing now and then, one pass at a time. */
const VARIATIONS: LumiLoop[] = ["sway", "foot"];

type Pose = { loop: LumiLoop; frame: number };
const REST: Pose = { loop: "breath", frame: 0 };
const key = (p: Pose) => `${p.loop}-${p.frame}`;

/** Something the companion can be asked to do out of turn (dev only, from the debug strip). */
type Cue = LumiLoop | "blink";
const CUE_EVENT = "lumi:cue";
const cue = (what: Cue) => window.dispatchEvent(new CustomEvent<Cue>(CUE_EVENT, { detail: what }));
const DEBUG = process.env.NODE_ENV === "development";

/**
 * Lumi in the corner of the screen, keeping you company. Full figure, standing
 * on the bottom edge. Purely decorative: no clicks, no state, nothing to maintain.
 *
 * Idle life, all of it off under `prefers-reduced-motion`:
 * - the sheet's nine-frame breath loop, each frame fading in over the last
 * - every so often one pass of a variation (the sway, or the playful foot —
 *   never the same one twice running), then back to breathing
 * - a blink every few seconds, composited onto whichever frame is showing so
 *   the cycles run together
 * One pose throughout — small movements, never a swap to another drawing.
 */
export function LumiCompanion() {
  const [pose, setPose] = useState<{ cur: Pose; prev: Pose }>({ cur: REST, prev: REST });
  const [eyes, setEyes] = useState<LumiEyes>("open");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const show = (loop: LumiLoop, frame: number) => setPose(({ cur }) => ({ cur: { loop, frame }, prev: cur }));

    // The loop: breath by default; a variation runs its frames once, then hands
    // back to breath at frame 0 (every loop starts from the same rest pose).
    let current: LumiLoop = "breath";
    let pending: LumiLoop | null = null;
    let last: LumiLoop = "breath";
    let f = 0;
    const tick = () => {
      f = (f + 1) % LUMI_LOOP_FRAMES[current];
      if (f === 0) {
        // Loops only hand over at the rest frame, which they all share.
        if (current !== "breath") {
          current = "breath";
          scheduleVariation();
        } else if (pending) {
          current = pending;
          pending = null;
        }
      }
      show(current, f);
      after(FRAME_MS[current], tick);
    };
    const scheduleVariation = () =>
      after(between(20000, 45000), () => {
        if (pending) return; // a cue is already waiting; it plays instead
        const choices = VARIATIONS.filter((loop) => loop !== last);
        last = choices[Math.floor(Math.random() * choices.length)];
        pending = last;
      });

    // Blink: half → shut → half → open, ~0.3s. Occasionally doubled.
    const blink = (then: () => void) => {
      setEyes("half");
      after(70, () => setEyes("closed"));
      after(210, () => setEyes("half"));
      after(280, () => {
        setEyes("open");
        then();
      });
    };
    const scheduleBlink = () =>
      after(between(2500, 6500), () => blink(Math.random() < 0.2 ? () => after(180, () => blink(scheduleBlink)) : scheduleBlink));

    // A cue from the debug strip: a variation plays at the next rest frame
    // (the same hand-over as a scheduled one); a blink plays now.
    const onCue = (e: Event) => {
      const what = (e as CustomEvent<Cue>).detail;
      if (what === "blink") blink(() => {});
      else if (what !== "breath") pending = what;
    };
    if (DEBUG) window.addEventListener(CUE_EVENT, onCue);

    after(FRAME_MS.breath, tick);
    scheduleBlink();
    scheduleVariation();
    return () => {
      timers.forEach(clearTimeout);
      if (DEBUG) window.removeEventListener(CUE_EVENT, onCue);
    };
  }, []);

  // The previous frame stays underneath while the current one fades in on top.
  // Keyed by loop and frame so the frame that was current keeps its element
  // (and finished fade) when it becomes the previous one.
  const stack = key(pose.prev) === key(pose.cur) ? [pose.cur] : [pose.prev, pose.cur];

  return (
    <>
      <div className="companion" aria-hidden>
        <div className="companion-figure" style={cellSize("body", HEIGHT)}>
          {stack.map((p, i) => (
            <LumiSprite
              key={key(p)}
              cell={idleCell(p.loop, p.frame, eyes)}
              height={HEIGHT}
              className={`companion-frame ${i === stack.length - 1 ? "on" : ""}`}
            />
          ))}
        </div>
      </div>
      {DEBUG && <DebugStrip />}
    </>
  );
}

/**
 * Dev-only buttons above the companion: play each variation (or a blink) on
 * demand instead of waiting for the schedule. Not a control in the product —
 * it never ships (`NODE_ENV === "development"` only).
 */
function DebugStrip() {
  const cues: Cue[] = [...VARIATIONS, "blink"];
  return (
    <div className="companion-debug">
      {cues.map((what) => (
        <button key={what} type="button" className="companion-debug-btn" onClick={() => cue(what)}>
          {what}
        </button>
      ))}
    </div>
  );
}
