import { describe, it, expect } from "vitest";
import {
  AFFIRMATION_ALPHA_FLOOR,
  AMBIENT_STAR_COUNT,
  buildAmbientSky,
  buildSky,
  seedFromId,
  starForAffirmation,
  twinkleAt,
  wrapUnit,
} from "./starfield";

const SAMPLE_IDS = Array.from(
  { length: 200 },
  (_, i) => `3f2a${i.toString(16).padStart(4, "0")}-affirmation`,
);

describe("seedFromId", () => {
  it("is deterministic", () => {
    expect(seedFromId("abc")).toBe(seedFromId("abc"));
  });

  it("separates ids that differ only in the last character", () => {
    expect(seedFromId("affirmation-1")).not.toBe(seedFromId("affirmation-2"));
  });

  it("stays an unsigned 32-bit integer", () => {
    for (const id of SAMPLE_IDS) {
      const seed = seedFromId(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 32);
    }
  });

  it("handles the empty string without producing NaN", () => {
    expect(Number.isNaN(seedFromId(""))).toBe(false);
  });
});

describe("wrapUnit", () => {
  it("leaves values already inside the unit range alone", () => {
    expect(wrapUnit(0)).toBe(0);
    expect(wrapUnit(0.5)).toBeCloseTo(0.5, 10);
  });

  it("wraps large positive pans back into range", () => {
    expect(wrapUnit(1.25)).toBeCloseTo(0.25, 10);
    expect(wrapUnit(97.75)).toBeCloseTo(0.75, 10);
  });

  it("wraps negative pans back into range rather than going negative", () => {
    expect(wrapUnit(-0.25)).toBeCloseTo(0.75, 10);
    expect(wrapUnit(-42.5)).toBeCloseTo(0.5, 10);
  });

  it("stays inside 0..1 across a long sweep in both directions", () => {
    for (let v = -500; v <= 500; v += 0.37) {
      const w = wrapUnit(v);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(1);
    }
  });

  it("degrades to 0 rather than NaN on a non-finite pan", () => {
    expect(wrapUnit(NaN)).toBe(0);
    expect(wrapUnit(Infinity)).toBe(0);
  });
});

describe("buildAmbientSky", () => {
  const sky = buildAmbientSky(seedFromId("a-user-id"));

  it("is deterministic — the same person always gets the same sky", () => {
    expect(buildAmbientSky(seedFromId("a-user-id"))).toEqual(sky);
  });

  it("gives different people different skies", () => {
    expect(buildAmbientSky(seedFromId("someone-else"))).not.toEqual(sky);
  });

  it("produces the expected number of stars", () => {
    expect(sky).toHaveLength(AMBIENT_STAR_COUNT);
    expect(buildAmbientSky(1, 12)).toHaveLength(12);
  });

  it("keeps every star inside the unit square with sane depth", () => {
    for (const star of sky) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(1);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThan(1);
      expect(star.depth).toBeGreaterThanOrEqual(0);
      expect(star.depth).toBeLessThanOrEqual(1);
    }
  });

  it("gives every star a positive radius and visible resting alpha", () => {
    for (const star of sky) {
      expect(star.radius).toBeGreaterThan(0);
      expect(star.baseAlpha).toBeGreaterThan(0);
      expect(star.baseAlpha).toBeLessThanOrEqual(1);
    }
  });

  it("weights the field toward faint, distant stars", () => {
    const near = sky.filter((s) => s.depth > 0.5).length;
    expect(near).toBeLessThan(sky.length / 2);
  });

  it("varies twinkle rate and phase so the field cannot pulse as one", () => {
    expect(new Set(sky.map((s) => s.speed)).size).toBeGreaterThan(50);
    expect(new Set(sky.map((s) => s.phase)).size).toBeGreaterThan(50);
  });

  it("marks nothing in the backdrop as an affirmation star", () => {
    expect(sky.some((s) => s.isAffirmation)).toBe(false);
  });
});

describe("starForAffirmation", () => {
  it("is deterministic — a line you wrote always lights the same star", () => {
    expect(starForAffirmation("abc")).toEqual(starForAffirmation("abc"));
  });

  it("puts different affirmations in different places", () => {
    const positions = new Set(
      SAMPLE_IDS.map((id) => {
        const s = starForAffirmation(id);
        return `${s.x.toFixed(4)},${s.y.toFixed(4)}`;
      }),
    );
    expect(positions.size).toBe(SAMPLE_IDS.length);
  });

  it("keeps clear of the edges so the star is actually seen", () => {
    for (const id of SAMPLE_IDS) {
      const star = starForAffirmation(id);
      expect(star.x).toBeGreaterThanOrEqual(0.1);
      expect(star.x).toBeLessThanOrEqual(0.9);
      expect(star.y).toBeGreaterThanOrEqual(0.1);
      expect(star.y).toBeLessThanOrEqual(0.9);
    }
  });

  it("is brighter, larger and nearer than the backdrop it sits in", () => {
    for (const id of SAMPLE_IDS.slice(0, 25)) {
      const star = starForAffirmation(id);
      expect(star.baseAlpha).toBeGreaterThanOrEqual(AFFIRMATION_ALPHA_FLOOR);
      expect(star.depth).toBeGreaterThan(0.75);
      expect(star.isAffirmation).toBe(true);
    }
  });

  it("outshines every possible backdrop star, not just this seed's", () => {
    // The user's own stars must be the brightest thing in their sky by
    // construction — checking one sampled sky would pass by luck.
    for (const seed of ["a-user-id", "another", "third", "fourth"]) {
      for (const star of buildAmbientSky(seedFromId(seed))) {
        expect(star.baseAlpha).toBeLessThan(AFFIRMATION_ALPHA_FLOOR);
      }
    }
  });
});

describe("buildSky", () => {
  it("draws the backdrop first so affirmation stars land on top", () => {
    const sky = buildSky("user-1", ["a", "b"]);
    expect(sky).toHaveLength(AMBIENT_STAR_COUNT + 2);
    expect(sky.slice(0, AMBIENT_STAR_COUNT).some((s) => s.isAffirmation)).toBe(
      false,
    );
    expect(sky.slice(AMBIENT_STAR_COUNT).every((s) => s.isAffirmation)).toBe(
      true,
    );
  });

  it("works before the user has written anything", () => {
    expect(buildSky("user-1", [])).toHaveLength(AMBIENT_STAR_COUNT);
  });

  it("grows by exactly one star per affirmation", () => {
    const before = buildSky("user-1", ["a"]).length;
    expect(buildSky("user-1", ["a", "b"]).length).toBe(before + 1);
  });
});

describe("twinkleAt", () => {
  const sky = buildAmbientSky(seedFromId("twinkle"));

  it("stays inside 0..1 for every star across a long span of time", () => {
    for (const star of sky) {
      for (let t = 0; t < 120; t += 0.83) {
        const v = twinkleAt(star, t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never blinks a star fully out — that reads as a dropped frame", () => {
    for (const star of sky.slice(0, 40)) {
      for (let t = 0; t < 60; t += 0.31) {
        expect(twinkleAt(star, t)).toBeGreaterThan(0.09);
      }
    }
  });

  it("actually varies over time", () => {
    const star = sky[0];
    const samples = new Set(
      [0, 1, 2, 3, 4].map((t) => twinkleAt(star, t).toFixed(3)),
    );
    expect(samples.size).toBeGreaterThan(1);
  });
});
