import { describe, it, expect } from "vitest";
import {
  BREATH_CYCLE_MS,
  BREATH_PHASES,
  BREATHS_PER_AFFIRMATION,
  affirmationIndexAt,
  breathPhaseAt,
} from "./breath";

const { inhale, hold, exhale } = BREATH_PHASES;

describe("breathPhaseAt", () => {
  it("starts at empty lungs", () => {
    const s = breathPhaseAt(0);
    expect(s.phase).toBe("inhale");
    expect(s.amplitude).toBe(0);
    expect(s.cycle).toBe(0);
  });

  it("reaches full lungs at the top of the inhale and holds there", () => {
    expect(breathPhaseAt(inhale - 1).amplitude).toBeCloseTo(1, 3);
    expect(breathPhaseAt(inhale).phase).toBe("hold");
    expect(breathPhaseAt(inhale).amplitude).toBe(1);
    expect(breathPhaseAt(inhale + hold - 1).amplitude).toBe(1);
  });

  it("returns to empty across the exhale and stays there through the rest", () => {
    const startExhale = inhale + hold;
    expect(breathPhaseAt(startExhale).phase).toBe("exhale");
    expect(breathPhaseAt(startExhale).amplitude).toBeCloseTo(1, 5);
    expect(breathPhaseAt(startExhale + exhale / 2).amplitude).toBeCloseTo(
      0.5,
      5,
    );

    const startRest = startExhale + exhale;
    expect(breathPhaseAt(startRest).phase).toBe("rest");
    expect(breathPhaseAt(startRest).amplitude).toBe(0);
    expect(breathPhaseAt(BREATH_CYCLE_MS - 1).amplitude).toBe(0);
  });

  it("keeps amplitude inside 0..1 across several whole cycles", () => {
    for (let t = 0; t < BREATH_CYCLE_MS * 3; t += 97) {
      const { amplitude } = breathPhaseAt(t);
      expect(amplitude).toBeGreaterThanOrEqual(0);
      expect(amplitude).toBeLessThanOrEqual(1);
    }
  });

  it("wraps cleanly into the next cycle", () => {
    const next = breathPhaseAt(BREATH_CYCLE_MS);
    expect(next.phase).toBe("inhale");
    expect(next.amplitude).toBe(0);
    expect(next.cycle).toBe(1);
    expect(breathPhaseAt(BREATH_CYCLE_MS * 4 + 10).cycle).toBe(4);
  });

  it("clamps a negative or out-of-order timestamp to the start", () => {
    const s = breathPhaseAt(-5000);
    expect(s.cycle).toBe(0);
    expect(s.phase).toBe("inhale");
    expect(s.amplitude).toBe(0);
  });
});

describe("affirmationIndexAt", () => {
  it("returns 0 for an empty list rather than indexing into nothing", () => {
    expect(affirmationIndexAt(999_999, 0)).toBe(0);
    expect(affirmationIndexAt(0, -1)).toBe(0);
  });

  it("holds one affirmation for BREATHS_PER_AFFIRMATION whole breaths", () => {
    const lastBreathOfFirst =
      BREATH_CYCLE_MS * (BREATHS_PER_AFFIRMATION - 1) + 10;
    expect(affirmationIndexAt(0, 3)).toBe(0);
    expect(affirmationIndexAt(lastBreathOfFirst, 3)).toBe(0);
    expect(
      affirmationIndexAt(BREATH_CYCLE_MS * BREATHS_PER_AFFIRMATION, 3),
    ).toBe(1);
  });

  it("cycles back to the first affirmation after the last", () => {
    const oneFullPass = BREATH_CYCLE_MS * BREATHS_PER_AFFIRMATION * 3;
    expect(affirmationIndexAt(oneFullPass, 3)).toBe(0);
  });

  it("stays on the only affirmation when there is just one", () => {
    expect(affirmationIndexAt(BREATH_CYCLE_MS * 40, 1)).toBe(0);
  });
});
