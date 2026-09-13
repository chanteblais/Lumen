"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { CompanionBubble } from "./CompanionBubble";
import { LUMI_LOOP_FRAMES, LumiSprite, cellSize, idleCell, type LumiEyes, type LumiLoop } from "@/components/chat/LumiSprite";

const HEIGHT = 150;
/** Time per frame of each loop. */
const FRAME_MS: Record<LumiLoop, number> = {
  breath: 320, // nine frames ≈ one breath every three seconds
  wave: 120, // a quick gesture: 24 frames ≈ 3 s, the pace Chanté checked the sheet at
  glance: 160, // the pace Chanté chose the sheet at ("gif 2 feels smoother"): 13 frames ≈ 2 s
};
/**
 * Loops mixed into the breathing now and then, one pass at a time, never the
 * same one twice running when there are several. Since 2026-09-13 the glance:
 * her eyes lower to the ground and come back up. (The scuffs cut from the same
 * sheet were dropped on review: the rest pose's boot stayed under the moving
 * one.)
 */
const VARIATIONS: LumiLoop[] = ["glance"];
/** Loops played in answer to something, never on the idle schedule. */
const REACTIONS: LumiLoop[] = ["wave"];
/**
 * Away this long, then back, is an arrival, and she waves. Thirty minutes: the
 * gap that starts a new sitting for the greeting (`SITTING_GAP_MS` in
 * `core/domain/conversations.ts`, not imported — that module brings the database).
 * "Away" is time with no tab of the app visible in this browser.
 */
const ARRIVAL_GAP_MS = 30 * 60_000;
/** A beat after the page appears, so the wave follows the arrival rather than racing it. */
const ARRIVAL_DELAY_MS = 900;
const SEEN_KEY = "lumi-last-seen";
const readSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {}
};
/**
 * How long a frame fades in over the last: most of the frame time of the
 * faster of the two loops involved, so it is fully in before the next arrives.
 * A fixed 260ms on the foot's 120ms frames left every frame a third of the way
 * in when it was replaced and snapped to full — a soft doubling of the hood
 * wherever frames differed. A hand-over fades at the variation's pace in both
 * directions: the way out was crisp, the way back (at the breath's 260ms)
 * read as a slow, blurry turn of the head.
 */
const fadeMs = (a: LumiLoop, b: LumiLoop) => Math.min(260, Math.round(Math.min(FRAME_MS[a], FRAME_MS[b]) * 0.8));

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
 * a little in from the bottom edge. Click her and a speech bubble opens so you
 * can say one thing from wherever you are ("add take out compost") without
 * leaving the page (`CompanionBubble`). On Home she just hands you the
 * composer. No state of her own to maintain.
 *
 * Life, all of it off under `prefers-reduced-motion`:
 * - the nine-frame breath loop, each frame fading in over the last (two frames
 *   mounted: the last one underneath, the new one fading in on top)
 * - a wave when you arrive — the page opened, or its tab shown again, after
 *   thirty minutes or more with no tab of the app visible (and on a first
 *   visit in this browser) — once, at the next rest frame, then back to breathing
 * - every 20–45 s one pass of a variation: the glance, her eyes lowering to
 *   the ground and back (never the same one twice running, once there are several)
 * - a blink every few seconds, composited onto whichever frame is showing so
 *   the cycles run together
 * Every loop is one drawing and hands over at the same rest cell.
 */
export function LumiCompanion() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  // The bubble remembers which page it opened on, so leaving the page closes
  // it (the conversation is there on Home anyway) without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const close = useCallback(() => setOpenedOn(null), []);

  const [pose, setPose] = useState<{ cur: Pose; prev: Pose }>({ cur: REST, prev: REST });
  const [eyes, setEyes] = useState<LumiEyes>("open");
  // One blink on demand — her "got it" when you send from the bubble. Set up
  // by the idle effect so it shares its timers (and is absent under reduced motion).
  const ack = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const show = (loop: LumiLoop, frame: number) => setPose(({ cur }) => ({ cur: { loop, frame }, prev: cur }));

    // The loop: breath by default; another loop runs its frames once, then hands
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
          // A variation schedules the next one; a reaction just hands back.
          const finished = current;
          current = "breath";
          if (VARIATIONS.includes(finished)) scheduleVariation();
        } else if (pending) {
          current = pending;
          pending = null;
        }
      }
      show(current, f);
      after(FRAME_MS[current], tick);
    };
    // One variation timer at a time; a finished variation starts the next.
    let nextVariation: ReturnType<typeof setTimeout> | undefined;
    const scheduleVariation = () => {
      if (!VARIATIONS.length) return;
      clearTimeout(nextVariation);
      nextVariation = setTimeout(() => {
        // A cue or a reaction is already waiting: it plays, and the variation waits another turn. (Returning
        // without rescheduling stopped the variations for good whenever the waiting loop was a reaction.)
        if (pending) {
          scheduleVariation();
          return;
        }
        // Never the same one twice running, unless there is only one — the filter would leave nothing to play.
        const choices = VARIATIONS.length > 1 ? VARIATIONS.filter((loop) => loop !== last) : VARIATIONS;
        last = choices[Math.floor(Math.random() * choices.length)];
        pending = last;
      }, between(20000, 45000));
      timers.push(nextVariation);
    };

    // Arriving: away long enough, and she waves.
    const arrive = () => {
      if (Date.now() - readSeen() >= ARRIVAL_GAP_MS) after(ARRIVAL_DELAY_MS, () => (pending = "wave"));
      markSeen();
    };
    const visible = () => document.visibilityState === "visible";
    const onVisibility = () => (visible() ? arrive() : markSeen());
    const onPageHide = () => visible() && markSeen();
    // While a tab is visible she counts as seen; a hidden tab doesn't keep the time fresh.
    const heartbeat = setInterval(() => visible() && markSeen(), 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    if (visible()) arrive();

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
    ack.current = () => blink(() => {});

    // A cue from the debug strip: a loop plays at the next rest frame (the same
    // hand-over as a scheduled one); a blink plays now.
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
      ack.current = null;
      timers.forEach(clearTimeout);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (DEBUG) window.removeEventListener(CUE_EVENT, onCue);
    };
  }, []);

  // The previous frame stays underneath while the current one fades in on top.
  // Keyed by loop and frame so the frame that was current keeps its element
  // (and finished fade) when it becomes the previous one.
  const stack = key(pose.prev) === key(pose.cur) ? [pose.cur] : [pose.prev, pose.cur];

  const tap = () => {
    if (onHome) {
      document.querySelector<HTMLTextAreaElement>(".composer textarea")?.focus();
      return;
    }
    setOpenedOn(open ? null : pathname);
  };

  return (
    <>
      <div className="companion">
        {open && !onHome && <CompanionBubble onClose={close} onSend={() => ack.current?.()} />}
        <button
          type="button"
          className="companion-btn"
          onClick={tap}
          aria-label={onHome ? "Message Lumi" : "Say something to Lumi"}
          aria-expanded={onHome ? undefined : open}
        >
          <span className="companion-figure" style={{ ...cellSize("body", HEIGHT), "--fade": `${fadeMs(pose.cur.loop, pose.prev.loop)}ms` } as CSSProperties} aria-hidden>
            {stack.map((p, i) => (
              <LumiSprite
                key={key(p)}
                cell={idleCell(p.loop, p.frame, eyes)}
                height={HEIGHT}
                className={`companion-frame ${i === stack.length - 1 ? "on" : ""}`}
              />
            ))}
          </span>
        </button>
      </div>
      {DEBUG && <DebugStrip />}
    </>
  );
}

/**
 * Dev-only buttons above the companion: play each variation and reaction (or a
 * blink) on demand instead of waiting for the schedule or an arrival. A handle
 * at the right end folds them away (remembered per browser). Not a control in
 * the product — it never ships (`NODE_ENV === "development"` only).
 */
const FOLD_KEY = "lumi-debug-folded";
const foldListeners = new Set<() => void>();
const readFolded = () => {
  try {
    return localStorage.getItem(FOLD_KEY) === "1";
  } catch {
    return false;
  }
};
const writeFolded = (v: boolean) => {
  try {
    localStorage.setItem(FOLD_KEY, v ? "1" : "0");
  } catch {}
  foldListeners.forEach((fn) => fn());
};
const subscribeFolded = (fn: () => void) => {
  foldListeners.add(fn);
  return () => foldListeners.delete(fn);
};

let toggled = false; // animate the fold only once a click has asked for it, not on load

function DebugStrip() {
  const cues: Cue[] = [...VARIATIONS, ...REACTIONS, "blink"];
  // Read through a store so the server renders it open and the client catches up without a state-in-effect.
  const folded = useSyncExternalStore(subscribeFolded, readFolded, () => false);
  const toggle = () => {
    toggled = true;
    writeFolded(!folded);
  };
  return (
    <div className={`companion-debug ${folded ? "is-folded" : ""} ${toggled ? "is-animated" : ""}`}>
      <div className="companion-debug-cues">
        {cues.map((what) => (
          <button key={what} type="button" className="companion-debug-btn" onClick={() => cue(what)} tabIndex={folded ? -1 : 0}>
            {what}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="companion-debug-btn companion-debug-fold"
        onClick={toggle}
        aria-label={folded ? "Show Lumi cues" : "Hide Lumi cues"}
        aria-expanded={!folded}
      >
        {folded ? "‹" : "›"}
      </button>
    </div>
  );
}
