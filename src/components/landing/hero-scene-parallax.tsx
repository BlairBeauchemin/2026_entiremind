"use client";

import { useEffect, useRef } from "react";

/**
 * Drives the scene's cursor parallax: eases `--px` / `--py` (each -1…1, the
 * pointer's position across the window) on the scene canvas, which
 * hero-scene.module.css turns into a small per-item shift by depth.
 *
 * Mouse only, and off for reduced motion. The easing runs on
 * requestAnimationFrame rather than a CSS transition so the recorder's fake
 * clock can step it, and the loop sleeps once it has caught up.
 */
export function HeroSceneParallax() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = ref.current?.parentElement;
    if (!canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let raf = 0;
    const tick = () => {
      now.x += (target.x - now.x) * 0.06;
      now.y += (target.y - now.y) * 0.06;
      canvas.style.setProperty("--px", now.x.toFixed(4));
      canvas.style.setProperty("--py", now.y.toFixed(4));
      const settled =
        Math.abs(target.x - now.x) < 0.001 &&
        Math.abs(target.y - now.y) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <span ref={ref} hidden />;
}
