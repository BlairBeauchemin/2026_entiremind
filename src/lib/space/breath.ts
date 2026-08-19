/**
 * The breath clock for The Space.
 *
 * Everything on screen — mandala scale, stroke opacity, glow radius, the
 * affirmation's own fade — reads from the single normalised amplitude this
 * module produces, so the whole scene moves as one organism rather than as a
 * pile of independently-timed animations.
 *
 * Kept pure (elapsed time in, numbers out) so the pacing is unit-testable
 * without a canvas, a DOM, or a fake rAF loop.
 */

/** Milliseconds spent in each phase of one breath. Tune here, nowhere else. */
export const BREATH_PHASES = {
  inhale: 4000,
  hold: 2000,
  exhale: 6000,
  rest: 1000,
} as const;

export type BreathPhaseName = keyof typeof BREATH_PHASES;

export const BREATH_CYCLE_MS =
  BREATH_PHASES.inhale +
  BREATH_PHASES.hold +
  BREATH_PHASES.exhale +
  BREATH_PHASES.rest;

/** Full breaths a single affirmation is held for before the next one arrives. */
export const BREATHS_PER_AFFIRMATION = 3;

export interface BreathState {
  /** Which part of the breath we're in right now. */
  phase: BreathPhaseName;
  /** 0 → 1 → 0 across the cycle: 0 at empty lungs, 1 at full. Eased. */
  amplitude: number;
  /** 0 → 1 progress through the current phase. */
  phaseProgress: number;
  /** How many complete cycles have elapsed since t=0. */
  cycle: number;
}

/** Sine ease — no hard corners, which is what makes it read as breathing. */
function easeInOutSine(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * Resolve the breath state at a given elapsed time.
 *
 * Negative input is clamped to 0 so a mis-ordered timestamp can never produce
 * a negative cycle count or an out-of-range amplitude.
 */
export function breathPhaseAt(elapsedMs: number): BreathState {
  const t = Math.max(0, elapsedMs);
  const cycle = Math.floor(t / BREATH_CYCLE_MS);
  let offset = t % BREATH_CYCLE_MS;

  if (offset < BREATH_PHASES.inhale) {
    const p = offset / BREATH_PHASES.inhale;
    return {
      phase: "inhale",
      amplitude: easeInOutSine(p),
      phaseProgress: p,
      cycle,
    };
  }
  offset -= BREATH_PHASES.inhale;

  if (offset < BREATH_PHASES.hold) {
    const p = offset / BREATH_PHASES.hold;
    return { phase: "hold", amplitude: 1, phaseProgress: p, cycle };
  }
  offset -= BREATH_PHASES.hold;

  if (offset < BREATH_PHASES.exhale) {
    const p = offset / BREATH_PHASES.exhale;
    return {
      phase: "exhale",
      amplitude: 1 - easeInOutSine(p),
      phaseProgress: p,
      cycle,
    };
  }
  offset -= BREATH_PHASES.exhale;

  const p = offset / BREATH_PHASES.rest;
  return { phase: "rest", amplitude: 0, phaseProgress: p, cycle };
}

/**
 * Index of the affirmation that should be showing at this point in the session.
 *
 * Advancing on the breath (rather than on a wall-clock interval) is the whole
 * point: the words arrive with the inhale instead of interrupting it. Returns 0
 * for an empty list so callers never index into nothing.
 */
export function affirmationIndexAt(elapsedMs: number, count: number): number {
  if (count <= 0) return 0;
  const cycles = breathPhaseAt(elapsedMs).cycle;
  return Math.floor(cycles / BREATHS_PER_AFFIRMATION) % count;
}
