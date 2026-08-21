/**
 * The sky's drawing pass.
 *
 * Split out from the React component so it can be exercised against a mock 2D
 * context: a canvas that silently draws nothing (a single NaN in the geometry
 * poisons an entire path) looks exactly like a canvas that works, so the draw
 * calls themselves are worth asserting on.
 *
 * Nothing here touches the DOM, React, or the clock — everything the frame
 * needs arrives as an argument.
 */

import {
  HALO_ALPHA_THRESHOLD,
  twinkleAt,
  wrapUnit,
  type Star,
} from "./starfield";

/** Star colour. Barely-blue white, warmed for the affirmation stars. */
export const STAR_WHITE = "255, 252, 245";
export const STAR_WARM = "249, 217, 122"; // #f9d97a — the brand's warm yellow

/**
 * How far a full pan of the unit square carries a star at depth 1. Depth
 * scales this down, and that difference between near and far is the entire
 * illusion of depth — without it a drag just slides a flat image.
 */
export const PARALLAX_DEPTH_FLOOR = 0.25;

/** Radius of the finger's influence, as a fraction of the smaller viewport axis. */
export const FLARE_RADIUS = 0.28;
/** How much a star directly under the finger brightens and swells. */
export const FLARE_ALPHA_GAIN = 0.9;
export const FLARE_RADIUS_GAIN = 1.6;

/** How long a newly saved star takes to settle into the sky. */
export const IGNITE_MS = 2200;
/**
 * Peak core-radius multiplier at the instant a star ignites. Kept modest on
 * purpose: pushing the solid core to seven times its size draws a flat yellow
 * disc that reads as a sun, not as a star catching light. The drama belongs in
 * the glow, which spreads much further.
 */
export const IGNITE_RADIUS_PEAK = 3.2;
/** How much wider the glow reaches at the peak of an ignition. */
export const IGNITE_GLOW_SPREAD = 2.4;

export interface PointerState {
  x: number;
  y: number;
  /** 0-1 flare intensity. Rises while held, decays after release. */
  strength: number;
  held: boolean;
}

export interface SkyMotion {
  /** Accumulated pan, in unit-square terms. Wrapped at draw time. */
  pan: { x: number; y: number };
  /** Residual velocity from a flick, decaying toward rest. */
  panVel: { x: number; y: number };
  pointer: PointerState;
}

/**
 * Pre-rendered radial-gradient discs, one per star tint.
 *
 * A glow drawn as a flat-alpha arc has a hard edge and reads as a grey ring
 * around the star rather than as light coming off it. A real gradient per star
 * would mean allocating hundreds of CanvasGradients per frame; blitting one
 * pre-rendered sprite is both correct and far cheaper. Built by the component
 * (it needs a real canvas) and passed in, so this module stays pure.
 */
export interface GlowSprites {
  white: CanvasImageSource;
  warm: CanvasImageSource;
}

/**
 * A star arriving in the sky.
 *
 * Identified by `starId`, not by a Star object: the caller does not have the
 * instance that is in the sky array, and matching on object identity fails
 * silently — the flare simply never draws, with nothing to debug.
 * `startedAt` is a performance.now() timestamp.
 */
export interface Ignition {
  starId: string;
  startedAt: number;
}

/** A motion state at complete rest — the loop's starting point, and the tests'. */
export function restingMotion(): SkyMotion {
  return {
    pan: { x: 0, y: 0 },
    panVel: { x: 0, y: 0 },
    pointer: { x: 0, y: 0, strength: 0, held: false },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Ignition progress 0..1, or null once the flare is spent.
 *
 * Returning null rather than 1 lets the caller drop finished ignitions from its
 * list instead of re-checking them every frame forever.
 */
export function ignitionProgress(
  ignition: Ignition,
  now: number,
): number | null {
  const elapsed = now - ignition.startedAt;
  if (elapsed < 0) return 0;
  if (elapsed >= IGNITE_MS) return null;
  return elapsed / IGNITE_MS;
}

/** Fast at first, long tail — a flare that decays linearly looks mechanical. */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export interface DrawSkyOptions {
  stars: Star[];
  width: number;
  height: number;
  /** Seconds since the surface opened. Drives twinkle and drift. */
  seconds: number;
  motion: SkyMotion;
  /** 0-1 breath amplitude — the whole field brightens on the inhale. */
  breath: number;
  /** Active ignitions, and the timestamp to measure them against. */
  ignitions?: Ignition[];
  now?: number;
  /** Omit to skip glows entirely — the stars still draw as points. */
  glowSprites?: GlowSprites;
  reduced: boolean;
}

/**
 * Draw one frame of the sky.
 *
 * Returns the number of draw operations issued (star cores plus glow blits), so
 * the per-frame budget can be asserted in tests rather than trusted.
 */
export function drawSky(
  ctx: CanvasRenderingContext2D,
  options: DrawSkyOptions,
): number {
  const {
    stars,
    width,
    height,
    seconds,
    motion,
    breath,
    ignitions = [],
    now = 0,
    glowSprites,
    reduced,
  } = options;

  const minAxis = Math.min(width, height);
  const flareRadius = minAxis * FLARE_RADIUS;
  const flareRadiusSq = flareRadius * flareRadius;
  const bloom = reduced ? 0 : motion.pointer.strength;

  // The breath lifts the whole field together, so the sky inhales as one rather
  // than as a few hundred independently-blinking points.
  const breathGain = 0.72 + 0.28 * breath;

  // The igniting star is already in `stars`; the flare is an overlay on its
  // normal draw rather than a separate sprite, so it inherits the twinkle,
  // parallax and breath the rest of the sky has.
  const igniting = new Map<string, number>();
  for (const ignition of ignitions) {
    const progress = ignitionProgress(ignition, now);
    if (progress !== null) igniting.set(ignition.starId, progress);
  }

  let arcs = 0;

  for (const star of stars) {
    // Depth scales parallax: distant stars barely move, near ones sweep.
    const depthPan =
      PARALLAX_DEPTH_FLOOR + star.depth * (1 - PARALLAX_DEPTH_FLOOR);
    const x = wrapUnit(star.x + motion.pan.x * depthPan) * width;
    const y = wrapUnit(star.y + motion.pan.y * depthPan) * height;

    let alpha = star.baseAlpha * breathGain;
    let radius = star.radius;

    if (!reduced) alpha *= twinkleAt(star, seconds);

    if (bloom > 0.002) {
      const dx = x - motion.pointer.x;
      const dy = y - motion.pointer.y;
      // Squared Lorentzian: the plain form has a long tail that lifts the whole
      // sky whenever a finger touches anywhere, which reads as a global
      // brightness bug rather than as stars responding to a touch.
      const falloff = flareRadiusSq / (dx * dx + dy * dy + flareRadiusSq);
      const near = bloom * falloff * falloff;
      alpha += near * FLARE_ALPHA_GAIN;
      radius += near * FLARE_RADIUS_GAIN;
    }

    const ignitionAt = igniting.get(star.id);
    let flare = 0;
    if (ignitionAt !== undefined) {
      // Reduced motion still gets the star, just without the theatre.
      if (reduced) {
        alpha *= Math.min(1, ignitionAt * 4);
      } else {
        flare = 1 - easeOutQuart(ignitionAt);
        alpha = Math.max(alpha, star.baseAlpha) + flare * 0.6;
        radius += flare * star.radius * (IGNITE_RADIUS_PEAK - 1);
      }
    }

    alpha = clamp(alpha, 0, 1);
    if (alpha < 0.02 || radius <= 0) continue;

    const tint = star.isAffirmation ? STAR_WARM : STAR_WHITE;

    // A glow would be lovely on all 220 stars and unaffordable on all 220; the
    // brightest few carry it and the rest read as points, which is how a real
    // sky looks anyway.
    const wantsGlow =
      ignitionAt !== undefined ||
      star.isAffirmation ||
      alpha > HALO_ALPHA_THRESHOLD;

    if (wantsGlow && !reduced && glowSprites) {
      const sprite = star.isAffirmation ? glowSprites.warm : glowSprites.white;
      // An igniting star throws light much further than it grows.
      const reach = radius * 5 * (1 + flare * IGNITE_GLOW_SPREAD);
      ctx.globalAlpha = clamp(alpha * 0.5, 0, 1);
      ctx.drawImage(sprite, x - reach, y - reach, reach * 2, reach * 2);
      ctx.globalAlpha = 1;
      arcs++;
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(${tint}, ${alpha.toFixed(3)})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    arcs++;
  }

  return arcs;
}
