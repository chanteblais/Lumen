"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CompanionBubble } from "./CompanionBubble";
import { LUMI_IDLE_FRAMES, LumiSprite, cellSize, idleCell, type LumiEyes, type LumiLoop } from "@/components/chat/LumiSprite";

const HEIGHT = 150;
const BREATH_MS = 320; // nine frames ≈ one breath every three seconds
const SWAY_MS = 560; // nine frames ≈ five seconds, per the sheet

/**
 * Lumi in the corner of the screen, keeping you company. Full figure, standing
 * a little in from the bottom edge. Click her and a speech bubble opens so you
 * can say one thing from wherever you are ("add take out compost") without
 * leaving the page (`CompanionBubble`). On the chat page she just hands you the
 * composer. No state of her own to maintain.
 *
 * Idle life, all of it off under `prefers-reduced-motion`:
 * - the sheet's nine-frame breath loop, each frame fading in over the last
 * - every so often one pass of the sway loop, then back to breathing
 * - a blink every few seconds, composited onto whichever frame is showing so
 *   the cycles run together
 * One pose throughout — small movements, never a swap to another drawing.
 */
export function LumiCompanion() {
  const pathname = usePathname();
  const onChat = pathname === "/";
  // The bubble remembers which page it opened on, so leaving the page closes
  // it (the conversation is there in Chat anyway) without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const close = useCallback(() => setOpenedOn(null), []);

  const [loop, setLoop] = useState<LumiLoop>("breath");
  const [frame, setFrame] = useState(0);
  const [eyes, setEyes] = useState<LumiEyes>("open");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

    // The loop: breath by default; a sway pass runs its nine frames once, then
    // hands back to breath at frame 0 (both loops start from the same rest pose).
    let current: LumiLoop = "breath";
    let swayPending = false;
    let f = 0;
    const tick = () => {
      f = (f + 1) % LUMI_IDLE_FRAMES;
      if (f === 0) {
        // Loops only hand over at the rest frame, which both share.
        if (current === "sway") {
          current = "breath";
          setLoop(current);
          scheduleSway();
        } else if (swayPending) {
          swayPending = false;
          current = "sway";
          setLoop(current);
        }
      }
      setFrame(f);
      after(current === "sway" ? SWAY_MS : BREATH_MS, tick);
    };
    const scheduleSway = () => after(between(20000, 45000), () => (swayPending = true));

    // Blink: half → shut → half → open, ~0.3s. Occasionally doubled.
    const blink = (thenDouble: boolean) => {
      setEyes("half");
      after(70, () => setEyes("closed"));
      after(210, () => setEyes("half"));
      after(280, () => {
        setEyes("open");
        if (thenDouble) after(180, () => blink(false));
        else scheduleBlink();
      });
    };
    const scheduleBlink = () => after(between(2500, 6500), () => blink(Math.random() < 0.2));

    after(BREATH_MS, tick);
    scheduleBlink();
    scheduleSway();
    return () => timers.forEach(clearTimeout);
  }, []);

  const prev = (frame + LUMI_IDLE_FRAMES - 1) % LUMI_IDLE_FRAMES;
  const frames = Array.from({ length: LUMI_IDLE_FRAMES }, (_, i) => i);

  const tap = () => {
    if (onChat) {
      document.querySelector<HTMLTextAreaElement>(".composer textarea")?.focus();
      return;
    }
    setOpenedOn(open ? null : pathname);
  };

  return (
    <div className="companion">
      {open && !onChat && <CompanionBubble onClose={close} />}
      <button
        type="button"
        className="companion-btn"
        onClick={tap}
        aria-label={onChat ? "Message Lumi" : "Say something to Lumi"}
        aria-expanded={onChat ? undefined : open}
      >
        <span className="companion-figure" style={cellSize("body", HEIGHT)} aria-hidden>
          {frames.map((i) => (
            <LumiSprite
              key={i}
              cell={idleCell(loop, i, eyes)}
              height={HEIGHT}
              className={`companion-frame ${i === frame ? "on" : i === prev ? "prev" : ""}`}
            />
          ))}
        </span>
      </button>
    </div>
  );
}
