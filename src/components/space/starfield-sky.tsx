"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { breathPhaseAt } from "@/lib/space/breath";
import { buildSky } from "@/lib/space/starfield";
import {
  STAR_WARM,
  STAR_WHITE,
  clamp,
  drawSky,
  ignitionProgress,
  restingMotion,
  type GlowSprites,
  type Ignition,
  type SkyMotion,
} from "@/lib/space/render";

/**
 * The night sky.
 *
 * One canvas, one requestAnimationFrame loop, and zero React state written per
 * frame — every animated value lives in a ref, and the breath is published to
 * CSS as a `--breath` custom property so the affirmation above can fade in step
 * without React re-rendering thirteen hundred times a minute. React only hears
 * from this component once per completed breath (`onCycle`) and on a tap.
 */

/** Ambient drift, in unit-square per second. Slow enough to notice only if you look. */
const DRIFT_X = 0.0035;
const DRIFT_Y = -0.0012;

/** Drag feel. Tuned so a flick coasts briefly and then settles. */
const PAN_PER_PX = 0.0011;
const PAN_DECAY = 0.92;
const MAX_PAN_VEL = 0.02;

/** How fast the finger-flare rises while held, and relaxes after it lifts. */
const FLARE_ATTACK = 0.2;
const FLARE_RELEASE = 0.06;

/** A tap is a short, still press. Anything longer or further is a drag. */
const TAP_MAX_MS = 260;
const TAP_MAX_PX = 12;

/** Edge length of the pre-rendered glow sprite. Blitted scaled, so this is
 *  about gradient smoothness, not on-screen size. */
const GLOW_SPRITE_PX = 64;

/**
 * Render one soft radial glow to an offscreen canvas.
 *
 * Built once and blitted per star. Drawing a real gradient per star would mean
 * hundreds of CanvasGradient allocations every frame; drawing a flat-alpha disc
 * instead leaves a hard edge that reads as a grey ring around the star rather
 * than as light. A sprite is the only option that is both soft and cheap.
 */
function createGlowSprite(rgb: string): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = GLOW_SPRITE_PX;
  canvas.height = GLOW_SPRITE_PX;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mid = GLOW_SPRITE_PX / 2;
  const gradient = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  gradient.addColorStop(0, `rgba(${rgb}, 0.85)`);
  gradient.addColorStop(0.25, `rgba(${rgb}, 0.28)`);
  gradient.addColorStop(0.55, `rgba(${rgb}, 0.07)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SPRITE_PX, GLOW_SPRITE_PX);
  return canvas;
}

export interface StarfieldSkyProps {
  /** Stable per-user seed for the backdrop, so the sky is the same each visit. */
  skySeed: string;
  /** One bright star per affirmation, placed by its own id. */
  affirmationIds: string[];
  /**
   * The affirmation just saved. Whenever this changes to a new id, that star
   * ignites. Cleared by the parent once the flare has had time to play.
   */
  igniteId?: string | null;
  /** Element the `--breath` custom property is written to each frame. */
  breathTargetRef?: React.RefObject<HTMLElement | null>;
  /** Fired once per completed breath, with the running cycle count. */
  onCycle?: (cycle: number) => void;
  /** Fired on a tap (a short, still press) — never on a drag. */
  onTap?: () => void;
  className?: string;
}

export function StarfieldSky({
  skySeed,
  affirmationIds,
  igniteId,
  breathTargetRef,
  onCycle,
  onTap,
  className = "",
}: StarfieldSkyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callbacks live in refs so a parent re-render never restarts the rAF loop.
  // Synced in an effect rather than during render: writing a ref mid-render is
  // unsafe under concurrent rendering, and the loop only reads them next frame.
  const onCycleRef = useRef(onCycle);
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onCycleRef.current = onCycle;
    onTapRef.current = onTap;
  }, [onCycle, onTap]);

  // Rebuilt only when the set of affirmations actually changes — joining the
  // ids keeps a new array identity from re-scattering the whole sky on every
  // parent render.
  const idKey = affirmationIds.join("|");
  const stars = useMemo(
    () => buildSky(skySeed, idKey ? idKey.split("|") : []),
    [skySeed, idKey],
  );
  const starsRef = useRef(stars);
  useEffect(() => {
    starsRef.current = stars;
  }, [stars]);

  const motionRef = useRef<SkyMotion>(restingMotion());
  const ignitionsRef = useRef<Ignition[]>([]);
  const reducedRef = useRef(false);
  const lastCycleRef = useRef(-1);

  /** Live drag bookkeeping — only read inside pointer handlers. */
  const gestureRef = useRef<{
    lastX: number;
    lastY: number;
    startedAt: number;
    travel: number;
  } | null>(null);

  // A new star arriving. Pushed onto a list rather than replacing a single
  // slot, so saving twice in quick succession plays both flares instead of the
  // second cutting off the first.
  useEffect(() => {
    if (!igniteId) return;
    ignitionsRef.current.push({
      starId: igniteId,
      startedAt: typeof performance !== "undefined" ? performance.now() : 0,
    });
  }, [igniteId]);

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
      // A new grab stops the sky where it is, rather than fighting the coast.
      m.panVel.x = 0;
      m.panVel.y = 0;

      gestureRef.current = {
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
      // The sky follows the finger directly, plus velocity for the coast.
      m.pan.x += dx * PAN_PER_PX;
      m.pan.y += dy * PAN_PER_PX;
      m.panVel.x = clamp(dx * PAN_PER_PX, -MAX_PAN_VEL, MAX_PAN_VEL);
      m.panVel.y = clamp(dy * PAN_PER_PX, -MAX_PAN_VEL, MAX_PAN_VEL);
    },
    [],
  );

  const endGesture = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const gesture = gestureRef.current;
    motionRef.current.pointer.held = false;
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
      m.panVel.x = 0;
      m.panVel.y = 0;
      m.pointer.strength = 0;
    };
    motionQuery.addEventListener("change", onMotionChange);

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // Cap DPR at 2: beyond that the extra pixels cost real frames on phones
      // and buy nothing the eye can find on a field of one-pixel dots.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    // Built once for the life of the surface — they are resolution-independent,
    // so a resize does not invalidate them.
    const white = createGlowSprite(STAR_WHITE);
    const warm = createGlowSprite(STAR_WARM);
    const glowSprites: GlowSprites | undefined =
      white && warm ? { white, warm } : undefined;

    let frame = 0;
    let start = performance.now();
    let hiddenAt = 0;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);

      const elapsed = now - start;
      const breath = breathPhaseAt(elapsed);

      // Publish the breath to CSS once per frame. Setting a custom property is
      // far cheaper than a React state update and lets the affirmation and
      // anything else opt in with plain CSS.
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
      const seconds = elapsed / 1000;

      if (!reduced) {
        // Coast, then drift. Both are pure additions to the accumulated pan;
        // wrapping happens at draw time so this can grow without bound.
        m.pan.x += m.panVel.x + DRIFT_X / 60;
        m.pan.y += m.panVel.y + DRIFT_Y / 60;
        m.panVel.x *= PAN_DECAY;
        m.panVel.y *= PAN_DECAY;
        if (Math.abs(m.panVel.x) < 1e-6) m.panVel.x = 0;
        if (Math.abs(m.panVel.y) < 1e-6) m.panVel.y = 0;

        const target = m.pointer.held ? 1 : 0;
        const rate = m.pointer.held ? FLARE_ATTACK : FLARE_RELEASE;
        m.pointer.strength += (target - m.pointer.strength) * rate;
        if (!m.pointer.held && m.pointer.strength < 0.002) {
          m.pointer.strength = 0;
        }
      }

      // Retire spent flares so the list cannot grow across a long session.
      if (ignitionsRef.current.length > 0) {
        ignitionsRef.current = ignitionsRef.current.filter(
          (ignition) => ignitionProgress(ignition, now) !== null,
        );
      }

      ctx.clearRect(0, 0, width, height);
      drawSky(ctx, {
        stars: starsRef.current,
        width,
        height,
        seconds,
        motion: m,
        breath: breath.amplitude,
        ignitions: ignitionsRef.current,
        now,
        glowSprites,
        reduced,
      });
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
      // touch-action:none is what lets a vertical drag pan the sky instead of
      // scrolling the page out from under the user's finger.
      className={`absolute inset-0 h-full w-full touch-none select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      aria-hidden="true"
    />
  );
}
