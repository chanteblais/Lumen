"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { FIRE_CROP, FIRE_LIGHT, FIRE_SCALE, createFlame, fireLevel, type FlameFrame } from "./fire";

/**
 * Home's stove fire (globals.css → Home: the fire): the painting's flames warped
 * in a small canvas over the glass (`fire.ts`), and the firelight on the stove
 * and hearth following how high they burn. About 30 frames a second while the
 * page is seen (requestAnimationFrame waits in a hidden tab). Nothing moves
 * under reduced motion, followed live, and the painting shows as painted.
 */
export function HomeFire() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const light = lightRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !light || !ctx) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const frame = ctx.createImageData(canvas.width, canvas.height);
    let draw: FlameFrame | null = null;
    let raf = 0;
    let last = 0;
    let slow = 0.5;
    let gone = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!draw || now - last < 33) return;
      last = now;
      const t = now / 1000;
      const level = fireLevel(t);
      draw(t, frame.data);
      ctx.putImageData(frame, 0, 0);
      slow += (level - slow) * 0.2; // the spill on the floor answers a little behind the flames
      light.style.setProperty("--fire", level.toFixed(3));
      light.style.setProperty("--fire-slow", slow.toFixed(3));
    };
    const start = () => {
      if (!raf && draw && !still.matches) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const onStill = () => (still.matches ? stop() : start());

    // The same file RoomScene preloads, so it is usually already in the browser.
    const painting = new Image();
    painting.src = "/home-room.webp";
    painting.decode().then(
      () => {
        const crop = document.createElement("canvas");
        crop.width = canvas.width;
        crop.height = canvas.height;
        const c = crop.getContext("2d");
        if (gone || !c) return;
        c.imageSmoothingQuality = "high";
        c.drawImage(painting, FIRE_CROP.x, FIRE_CROP.y, FIRE_CROP.w, FIRE_CROP.h, 0, 0, crop.width, crop.height);
        draw = createFlame(c.getImageData(0, 0, crop.width, crop.height).data, crop.width, crop.height);
        start();
      },
      () => {}, // no painting, no fire: the room's colour shows instead
    );
    still.addEventListener("change", onStill);
    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      still.removeEventListener("change", onStill);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="scene-flame"
        width={FIRE_CROP.w * FIRE_SCALE}
        height={FIRE_CROP.h * FIRE_SCALE}
        style={{ "--x": FIRE_CROP.x, "--y": FIRE_CROP.y, "--w": FIRE_CROP.w, "--h": FIRE_CROP.h } as CSSProperties}
      />
      <div ref={lightRef} className="scene-fire" style={{ "--x": FIRE_LIGHT.x, "--y": FIRE_LIGHT.y } as CSSProperties}>
        <span className="scene-fire-spill" />
        <span className="scene-fire-glow" />
      </div>
    </>
  );
}
