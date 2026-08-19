import { describe, it, expect } from "vitest";
import {
  SEGMENT_BUDGET,
  SYMMETRY_ORDERS,
  buildMandala,
  estimateSegments,
  mandalaForId,
  seedFromId,
} from "./mandala";

const SAMPLE_IDS = Array.from(
  { length: 200 },
  (_, i) => `3f2a${i.toString(16).padStart(4, "0")}-affirmation`,
);

describe("seedFromId", () => {
  it("is deterministic — the same affirmation always wears the same face", () => {
    expect(seedFromId("abc")).toBe(seedFromId("abc"));
    expect(mandalaForId("abc")).toEqual(mandalaForId("abc"));
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

describe("buildMandala", () => {
  it("only ever picks a supported symmetry order", () => {
    for (const id of SAMPLE_IDS) {
      expect(SYMMETRY_ORDERS).toContain(mandalaForId(id).symmetry);
    }
  });

  it("uses more than one symmetry order across a realistic sample", () => {
    const orders = new Set(SAMPLE_IDS.map((id) => mandalaForId(id).symmetry));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("always builds the same four-layer stack so the family reads as one", () => {
    for (const id of SAMPLE_IDS.slice(0, 25)) {
      const spec = mandalaForId(id);
      expect(spec.layers.map((l) => l.kind)).toEqual([
        "ring",
        "petals",
        "rays",
        "arcs",
      ]);
    }
  });

  it("counter-rotates adjacent layers", () => {
    for (const id of SAMPLE_IDS.slice(0, 25)) {
      const spins = mandalaForId(id).layers.map((l) => Math.sign(l.spin));
      for (let i = 1; i < spins.length; i++) {
        expect(spins[i]).not.toBe(spins[i - 1]);
      }
    }
  });

  it("keeps spin slow enough to read as ambient, not as spinning", () => {
    for (const id of SAMPLE_IDS) {
      for (const layer of mandalaForId(id).layers) {
        // Under ~0.05 rad/s: a full revolution takes over two minutes.
        expect(Math.abs(layer.spin)).toBeLessThan(0.05);
        expect(Math.abs(layer.spin)).toBeGreaterThan(0);
      }
    }
  });

  it("orders layers outward so the renderer can draw back-to-front", () => {
    const radii = mandalaForId("ordering").layers.map((l) => l.radius);
    expect([...radii].sort((a, b) => a - b)).toEqual(radii);
    expect(Math.max(...radii)).toBeLessThanOrEqual(1);
  });

  it("stays inside the per-frame draw budget for every seed", () => {
    for (const id of SAMPLE_IDS) {
      expect(estimateSegments(mandalaForId(id))).toBeLessThanOrEqual(
        SEGMENT_BUDGET,
      );
    }
  });

  it("is reproducible from a raw seed, not just from an id", () => {
    expect(buildMandala(12345)).toEqual(buildMandala(12345));
    expect(buildMandala(12345)).not.toEqual(buildMandala(54321));
  });
});
