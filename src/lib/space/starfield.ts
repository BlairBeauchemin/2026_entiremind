/**
 * The night sky for The Space.
 *
 * Two kinds of star, and the difference is the whole idea:
 *
 * - **Ambient stars** are the backdrop, seeded from the user's id. Faint, many,
 *   mostly far away. The same person always gets the same sky.
 * - **Affirmation stars** are bright and near, one per line the user has
 *   written, each placed by its own id hash. Write an affirmation and a new
 *   star joins the sky permanently; come back next week and it is still in the
 *   same place. That accumulation is what makes the sky feel like theirs.
 *
 * Pure data in, pure data out — nothing here touches the DOM, so both the
 * determinism and the per-frame draw budget are unit-testable.
 */

/**
 * How many backdrop stars fill the sky. High enough to read as a real night
 * sky, low enough that the whole field is a few hundred arcs per frame.
 */
export const AMBIENT_STAR_COUNT = 220;

/**
 * Ceiling on arcs drawn per frame. Mobile is the target and canvas fill cost
 * scales with arc count, so the renderer is tested against this rather than
 * trusted to stay small on its own.
 */
export const DRAW_BUDGET = 400;

/** Brightest ambient stars get a glow behind them; the rest are a single arc. */
export const HALO_ALPHA_THRESHOLD = 0.62;

/**
 * Affirmation stars never dim below this, and the ambient field never reaches
 * it. The user's own stars are meant to be the brightest things in their sky,
 * and that has to hold by construction rather than by luck of the seed.
 */
export const AFFIRMATION_ALPHA_FLOOR = 0.95;

export interface Star {
  /**
   * Stable identity. Affirmation stars use the affirmation's own id, which is
   * how an ignition finds its star: matching on the object reference instead
   * silently fails, because every call to starForAffirmation builds a fresh
   * object that is equal to — but not the same as — the one already in the sky.
   */
  id: string;
  /** Position in a unit square. Scaled to the viewport at draw time. */
  x: number;
  y: number;
  /**
   * 0 = far away (faint, barely parallaxes) → 1 = near (bright, moves most).
   * Depth drives brightness, size and parallax together, so a star never looks
   * near but moves like it is far.
   */
  depth: number;
  /** Resting radius in CSS pixels. */
  radius: number;
  /** Resting opacity before twinkle, breath and flare are applied. */
  baseAlpha: number;
  /** Twinkle offset, so no two stars blink in step. */
  phase: number;
  /** Twinkle rate in radians/second. */
  speed: number;
  /** True for a star that stands for one of the user's affirmations. */
  isAffirmation: boolean;
}

/**
 * FNV-1a. Short, dependency-free and well-spread over the short ASCII strings
 * we feed it (UUIDs, and the literal "intention" fallback).
 */
export function seedFromId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 keeps it an unsigned 32-bit value so the PRNG below stays in range.
  return h >>> 0;
}

/** mulberry32 — tiny, fast, and good enough for scattering stars. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wrap a unit coordinate back into 0..1.
 *
 * Every drawn position goes through this. Without it, panning walks the user
 * off the edge of the star field into empty black within a few seconds of
 * dragging; with it the sky is endless in both axes and a drag can never run
 * out of stars.
 */
export function wrapUnit(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return ((v % 1) + 1) % 1;
}

/**
 * The backdrop. Deterministic for a given seed, so a user's sky is stable
 * across reloads and devices.
 *
 * Depth is biased toward the far end (cubed) because a sky of uniformly-near
 * stars reads as noise — most of what you see at night is faint.
 */
export function buildAmbientSky(
  seed: number,
  count: number = AMBIENT_STAR_COUNT,
): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    const depth = Math.pow(rand(), 3);
    stars.push({
      id: `ambient-${seed}-${i}`,
      x: rand(),
      y: rand(),
      depth,
      radius: 0.5 + depth * 1.2,
      // A wide range on purpose: a sky where every star sits around half
      // brightness reads as grey noise. Most are faint (depth is cubed), and
      // the few near ones are genuinely bright — but the ceiling stays below
      // AFFIRMATION_ALPHA_FLOOR so a backdrop star can never outshine one of
      // the user's own.
      baseAlpha: 0.3 + depth * 0.6,
      phase: rand() * Math.PI * 2,
      // Slow, and varied: identical rates make the field pulse as one, which
      // reads as a glitch rather than as stars.
      speed: 0.35 + rand() * 0.9,
      isAffirmation: false,
    });
  }

  return stars;
}

/**
 * The star that stands for one affirmation.
 *
 * Kept clear of the very edges: a star at x=0.99 spends most of its life
 * clipped, and this one is meant to be seen. Bright, near, and slow-twinkling
 * so it reads as steady next to the restless backdrop.
 */
export function starForAffirmation(id: string): Star {
  const rand = mulberry32(seedFromId(id));

  return {
    id,
    x: 0.1 + rand() * 0.8,
    y: 0.1 + rand() * 0.8,
    depth: 0.8 + rand() * 0.2,
    radius: 1.8 + rand() * 0.9,
    baseAlpha: AFFIRMATION_ALPHA_FLOOR + rand() * (1 - AFFIRMATION_ALPHA_FLOOR),
    phase: rand() * Math.PI * 2,
    speed: 0.2 + rand() * 0.3,
    isAffirmation: true,
  };
}

/** Every star in the sky, backdrop first so affirmations draw on top. */
export function buildSky(skySeed: string, affirmationIds: string[]): Star[] {
  return [
    ...buildAmbientSky(seedFromId(skySeed)),
    ...affirmationIds.map(starForAffirmation),
  ];
}

/**
 * Twinkle multiplier at a moment in time, 0..1.
 *
 * Never reaches 0: a star that blinks fully out looks like a dropped frame.
 */
export function twinkleAt(star: Star, seconds: number): number {
  return 0.55 + 0.45 * Math.sin(seconds * star.speed + star.phase);
}
