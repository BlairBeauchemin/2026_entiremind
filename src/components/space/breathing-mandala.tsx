"use client";

import { useCallback, useEffect, useRef } from "react";
import { breathPhaseAt } from "@/lib/space/breath";
import { mandalaForId, type MandalaSpec } from "@/lib/space/mandala";
import {
  GLOW_WARM,
  clamp,
  drawSpec,
  radiusFor,
  restingMotion,
  type MotionState,
} from "@/lib/space/render";

/**
 * The breathing mandala.
 *
 * One canvas, one requestAnimationFrame loop, and zero React state written per
 * frame — every animated value lives in a ref, and the breath is published to
 * CSS as a `--breath` custom property so the affirmation above can fade in step
 * without React re-rendering thirteen hundred times a minute. React only hears
 * from this component once per completed breath (`onCycle`) and on a tap.
 */

/** How long a new affirmation's mandala takes to replace the previous one. */
const MORPH_MS = 900;

/** Drag feel. Tuned so a flick coasts for a moment and then settles. */
const SPIN_PER_PX = 0.00006;
const SPIN_DECAY = 0.94;
const MAX_SPIN = 0.9;
const TILT_PER_PX = 0.004;
const TILT_SPRING = 0.12;

/** How fast the bloom rises under a held finger, and relaxes after it lifts. */
const BLOOM_ATTACK = 0.18; // per-frame approach while held
const BLOOM_RELEASE = 0.055; // per-frame decay after lift

/** A tap is a short, still press. Anything longer or further is a drag. */
const TAP_MAX_MS = 260;
const TAP_MAX_PX = 12;

export interface BreathingMandalaProps {
  /**
   * Identity of the thing being contemplated — its hash picks the pattern.
   * Changing it morphs the mandala rather than snapping.
   */
  seedId: string;
  /** Element the `--breath` custom property is written to each frame. */
  breathTargetRef?: React.RefObject<HTMLElement | null>;
  /** Fired once per completed breath, with the running cycle count. */
  onCycle?: (cycle: number) => void;
  /** Fired on a tap (a short, still press) — never on a drag. */
  onTap?: () => void;
  className?: string;
}

export function BreathingMandala({
  seedId,
  breathTargetRef,
  onCycle,
  onTap,
  className = "",
}: BreathingMandalaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callbacks live in refs so a parent re-render never restarts the rAF loop.
  // Synced in an effect rather than during render: writing a ref mid-render is
  // unsafe under concurrent rendering, and the loop only reads them on the next
  // frame anyway.
  const onCycleRef = useRef(onCycle);
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onCycleRef.current = onCycle;
    onTapRef.current = onTap;
  }, [onCycle, onTap]);

  const specRef = useRef<MandalaSpec>(mandalaForId(seedId));
  const prevSpecRef = useRef<MandalaSpec | null>(null);
  const morphStartRef = useRef(0);

  const motionRef = useRef<MotionState>(restingMotion());

  /** Live drag bookkeeping — only read inside pointer handlers. */
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startedAt: number;
    travel: number;
  } | null>(null);

  const reducedRef = useRef(false);
  const lastCycleRef = useRef(-1);

  // Swap the pattern when the affirmation changes, keeping the outgoing one
  // around for the length of the morph so the two can cross-dissolve.
  useEffect(() => {
    const next = mandalaForId(seedId);
    if (next.seed === specRef.current.seed) return;
    prevSpecRef.current = specRef.current;
    specRef.current = next;
    morphStartRef.current =
      typeof performance !== "undefined" ? performance.now() : 0;
  }, [seedId]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const m = motionRef.current;
      m.pointer.x = e.clientX - rect.left;
      m.pointer.y = e.clientY - rect.top;
      m.pointer.held = true;

      gestureRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startedAt: e.timeStamp,
        travel: 0,
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const gesture = gestureRef.current;
      const canvas = canvasRef.current;
      if (!gesture || !canvas) return;

      const dx = e.clientX - gesture.lastX;
      const dy = e.clientY - gesture.lastY;
      gesture.lastX = e.clientX;
      gesture.lastY = e.clientY;
      gesture.travel += Math.abs(dx) + Math.abs(dy);

      const rect = canvas.getBoundingClientRect();
      const m = motionRef.current;
      m.pointer.x = e.clientX - rect.left;
      m.pointer.y = e.clientY - rect.top;

      if (reducedRef.current) return;
      m.spinVel = clamp(m.spinVel + dx * SPIN_PER_PX, -MAX_SPIN, MAX_SPIN);
      m.tiltTarget = clamp(m.tiltTarget + dy * TILT_PER_PX, -1, 1);
    },
    [],
  );

  const endGesture = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current;
    motionRef.current.pointer.held = false;
    motionRef.current.tiltTarget = 0;
    gestureRef.current = null;
    if (!gesture) return;

    canvasRef.current?.releasePointerCapture?.(e.pointerId);

    const quick = e.timeStamp - gesture.startedAt <= TAP_MAX_MS;
    const still = gesture.travel <= TAP_MAX_PX;
    if (quick && still) onTapRef.current?.();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = motionQuery.matches;
    const onMotionChange = (ev: MediaQueryListEvent) => {
      reducedRef.current = ev.matches;
      // Drop any in-flight motion immediately rather than letting it coast out.
      const m = motionRef.current;
      m.spinVel = 0;
      m.tiltTarget = 0;
      m.pointer.strength = 0;
    };
    motionQuery.addEventListener("change", onMotionChange);

    let width = 0;
    let height = 0;
    let coreGradient: CanvasGradient | null = null;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // Cap DPR at 2: beyond that the extra pixels cost real frames on phones
      // and buy nothing the eye can find on soft, low-contrast line work.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Built once per resize, not per frame — the alpha is varied instead.
      const r = radiusFor(width, height);
      const g = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        r * 1.15,
      );
      g.addColorStop(0, `rgba(${GLOW_WARM}, 0.10)`);
      g.addColorStop(0.45, "rgba(203, 187, 227, 0.05)");
      g.addColorStop(1, "rgba(32, 65, 71, 0)");
      coreGradient = g;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    let frame = 0;
    let start = performance.now();
    let hiddenAt = 0;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);

      const elapsed = now - start;
      const breath = breathPhaseAt(elapsed);

      // Publish the breath to CSS once per frame. Setting a custom property is
      // far cheaper than a React state update and lets the affirmation, the
      // vignette and anything else opt in with plain CSS.
      breathTargetRef?.current?.style.setProperty(
        "--breath",
        breath.amplitude.toFixed(3),
      );

      if (breath.cycle !== lastCycleRef.current) {
        lastCycleRef.current = breath.cycle;
        onCycleRef.current?.(breath.cycle);
      }

      const reduced = reducedRef.current;
      const m = motionRef.current;

      if (reduced) {
        m.spinAccum = 0;
        m.tilt = 0;
        m.pointer.strength = 0;
      } else {
        m.spinAccum += m.spinVel;
        m.spinVel *= SPIN_DECAY;
        if (Math.abs(m.spinVel) < 1e-5) m.spinVel = 0;

        m.tilt += (m.tiltTarget - m.tilt) * TILT_SPRING;

        const target = m.pointer.held ? 1 : 0;
        const rate = m.pointer.held ? BLOOM_ATTACK : BLOOM_RELEASE;
        m.pointer.strength += (target - m.pointer.strength) * rate;
        if (!m.pointer.held && m.pointer.strength < 0.002) {
          m.pointer.strength = 0;
        }
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = radiusFor(width, height);
      const scale = reduced ? 1 : 0.87 + 0.13 * breath.amplitude;
      const alpha = 0.5 + 0.5 * breath.amplitude;

      if (coreGradient) {
        ctx.globalAlpha = 0.55 + 0.45 * breath.amplitude;
        ctx.fillStyle = coreGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      const seconds = elapsed / 1000;
      const morph = prevSpecRef.current
        ? Math.min(1, (now - morphStartRef.current) / MORPH_MS)
        : 1;

      if (prevSpecRef.current && morph < 1) {
        drawSpec(
          ctx,
          prevSpecRef.current,
          cx,
          cy,
          radius * scale,
          seconds,
          m,
          alpha * (1 - morph),
          reduced,
        );
      } else if (prevSpecRef.current) {
        prevSpecRef.current = null;
      }

      drawSpec(
        ctx,
        specRef.current,
        cx,
        cy,
        radius * scale,
        seconds,
        m,
        alpha * morph,
        reduced,
      );
    };

    frame = requestAnimationFrame(render);

    // A backgrounded tab should cost nothing. On return, roll the clock forward
    // by the time spent hidden so the breath resumes mid-stride instead of
    // snapping to wherever wall-clock time landed.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        hiddenAt = performance.now();
      } else {
        if (hiddenAt) start += performance.now() - hiddenAt;
        hiddenAt = 0;
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [breathTargetRef]);

  return (
    <canvas
      ref={canvasRef}
      // touch-action:none is what lets a vertical drag warp the mandala instead
      // of scrolling the page out from under the user's finger.
      className={`absolute inset-0 h-full w-full touch-none select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      aria-hidden="true"
    />
  );
}
