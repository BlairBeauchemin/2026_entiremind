/**
 * Deterministic mandala geometry for The Space.
 *
 * Each affirmation gets its own mandala, derived from its id — so a line the
 * user wrote always comes back wearing the same face. That recognisability is
 * the point: it makes the pattern feel like *theirs* rather than like a random
 * screensaver.
 *
 * Pure data in, pure data out. The canvas renderer consumes this spec; nothing
 * here touches the DOM, so both the determinism and the per-frame draw budget
 * are unit-testable.
 */

/** Radial symmetry orders we draw. All divide evenly into a circle. */
export const SYMMETRY_ORDERS = [6, 8, 12] as const;
export type SymmetryOrder = (typeof SYMMETRY_ORDERS)[number];

/**
 * Ceiling on path segments drawn per frame. Mobile is the target device and
 * canvas stroke cost scales with segment count, so the generator is tested
 * against this rather than trusted to stay small on its own.
 */
export const SEGMENT_BUDGET = 600;

export type LayerKind = "petals" | "ring" | "rays" | "arcs";

export interface MandalaLayer {
  kind: LayerKind;
  /** Base radius as a fraction (0-1) of the mandala's outer radius. */
  radius: number;
  /** Repetitions around the circle. */
  count: number;
  /** Angular width of one element, in radians. */
  spread: number;
  /** How far petal tips bow outward, as a fraction of radius. */
  curvature: number;
  /** Radians per second. Sign sets direction; layers alternate. */
  spin: number;
  /** Stroke opacity at full inhale (0-1). */
  alpha: number;
  /** Stroke width in CSS pixels. */
  width: number;
}

export interface MandalaSpec {
  seed: number;
  symmetry: SymmetryOrder;
  layers: MandalaLayer[];
  /** Warm glow points placed at the outer petal tips. */
  glowCount: number;
  /** 0-1 blend between the two brand line colours (purple ↔ teal). */
  hueMix: number;
}

/**
 * FNV-1a. Chosen for being short, dependency-free and well-spread over the
 * short ASCII strings we feed it (UUIDs, and the literal "intention" fallback).
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

/** mulberry32 — tiny, fast, and good enough for picking petal counts. */
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
 * Build the four-layer mandala for a seed.
 *
 * The layer stack is fixed (ring → petals → rays → arcs) so every mandala reads
 * as the same family; the seed varies symmetry, proportion, curvature and spin
 * within deliberately narrow bands. Wide random ranges produced patterns that
 * felt arbitrary — the constraint is what makes them feel designed.
 */
export function buildMandala(seed: number): MandalaSpec {
  const rand = mulberry32(seed);
  const symmetry = SYMMETRY_ORDERS[Math.floor(rand() * SYMMETRY_ORDERS.length)];

  // Counter-rotation: the eye rests when adjacent layers disagree in direction.
  const baseSpin = 0.012 + rand() * 0.014; // radians/second — very slow
  const curvature = 0.28 + rand() * 0.22;

  // Radii are spaced so each layer reads against the next rather than leaving a
  // dead gap: the petal cluster reaches two thirds out, the rays bridge from
  // the petal tips to the scalloped rim, and the rim closes the disc.
  const layers: MandalaLayer[] = [
    {
      kind: "ring",
      radius: 0.34,
      count: symmetry,
      spread: 0,
      curvature: 0,
      spin: baseSpin * 1.6,
      alpha: 0.5,
      width: 1,
    },
    {
      kind: "petals",
      radius: 0.66,
      count: symmetry,
      spread: (Math.PI * 2) / symmetry,
      curvature,
      spin: -baseSpin,
      alpha: 0.72,
      width: 1.25,
    },
    {
      kind: "rays",
      radius: 0.9,
      count: symmetry * 2,
      spread: 0,
      curvature: 0,
      spin: baseSpin * 0.55,
      alpha: 0.28,
      width: 0.75,
    },
    {
      kind: "arcs",
      radius: 0.9,
      count: symmetry,
      spread: (Math.PI * 2) / symmetry,
      curvature: curvature * 0.5,
      spin: -baseSpin * 0.35,
      alpha: 0.42,
      width: 1,
    },
  ];

  return {
    seed,
    symmetry,
    layers,
    glowCount: symmetry,
    hueMix: rand(),
  };
}

/** Convenience: id → spec, the only entry point the renderer needs. */
export function mandalaForId(id: string): MandalaSpec {
  return buildMandala(seedFromId(id));
}

/**
 * Segments used to tessellate one curved element, given how many of them ring
 * the circle.
 *
 * Segment count scales with the element's angular size rather than being fixed:
 * a petal at 12-fold symmetry is half the width of one at 6-fold, so it reaches
 * the same apparent smoothness with half the segments. A flat count either
 * over-draws the dense mandalas or under-draws the sparse ones — this keeps
 * every seed inside one budget without any of them looking faceted.
 */
export function segmentsFor(count: number): number {
  return Math.min(16, Math.max(6, Math.round(96 / Math.max(1, count))));
}

/**
 * Rays are short and straight, so they need far fewer segments than a petal —
 * but they cannot be two-point lines. Under a finger the rim bows away while an
 * unsegmented ray stays rigid, and the result reads as a chord cutting across
 * the pattern. Four segments is enough to let them bend along with everything
 * else without meaningfully denting the frame budget.
 */
export const RAY_SEGMENTS = 4;

/**
 * Estimated path segments for one frame of this spec — the number the
 * SEGMENT_BUDGET test asserts against. Mirrors the renderer's tessellation.
 */
export function estimateSegments(spec: MandalaSpec): number {
  return spec.layers.reduce((total, layer) => {
    switch (layer.kind) {
      case "rays":
        return total + layer.count * RAY_SEGMENTS;
      case "ring":
        return total + layer.count * segmentsFor(layer.count); // small circles
      default:
        return total + layer.count * segmentsFor(layer.count) * 2; // two bowed edges
    }
  }, spec.glowCount);
}
