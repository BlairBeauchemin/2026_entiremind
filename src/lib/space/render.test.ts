import { describe, it, expect } from "vitest";
import { mandalaForId, SYMMETRY_ORDERS, buildMandala } from "./mandala";
import { drawSpec, radiusFor, restingMotion, type MotionState } from "./render";

/**
 * A canvas that draws nothing looks exactly like a canvas that works: no error,
 * no warning, just an empty screen. One NaN anywhere in the geometry silently
 * voids the whole path. These tests run the real draw pass against a recording
 * stub so that failure mode cannot ship.
 */

interface Point {
  x: number;
  y: number;
}

function mockContext() {
  const points: Point[] = [];
  const calls: string[] = [];
  const strokeStyles: string[] = [];

  const record = (name: string) => () => {
    calls.push(name);
  };

  const ctx = {
    lineCap: "",
    lineJoin: "",
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: "",
    globalAlpha: 1,
    set strokeStyle(value: string) {
      strokeStyles.push(value);
    },
    get strokeStyle() {
      return strokeStyles[strokeStyles.length - 1] ?? "";
    },
    fillStyle: "",
    beginPath: record("beginPath"),
    stroke: record("stroke"),
    fill: record("fill"),
    moveTo(x: number, y: number) {
      calls.push("moveTo");
      points.push({ x, y });
    },
    lineTo(x: number, y: number) {
      calls.push("lineTo");
      points.push({ x, y });
    },
    arc(x: number, y: number) {
      calls.push("arc");
      points.push({ x, y });
    },
  };

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    points,
    calls,
    strokeStyles,
  };
}

const WIDTH = 390; // iPhone-ish, the target device
const HEIGHT = 844;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = radiusFor(WIDTH, HEIGHT);

function draw(motion: MotionState, seconds = 0, alpha = 1, reduced = false) {
  const mock = mockContext();
  drawSpec(
    mock.ctx,
    mandalaForId("a-user-affirmation"),
    CX,
    CY,
    RADIUS,
    seconds,
    motion,
    alpha,
    reduced,
  );
  return mock;
}

describe("drawSpec", () => {
  it("actually emits a path and strokes it", () => {
    const { calls, points } = draw(restingMotion());
    expect(calls).toContain("beginPath");
    expect(calls).toContain("stroke");
    expect(points.length).toBeGreaterThan(100);
  });

  it("never produces a NaN or infinite coordinate", () => {
    for (const order of SYMMETRY_ORDERS) {
      // Reach every symmetry order, not just whichever one this id happens to
      // hash to — a NaN in the 12-fold branch alone would still be a blank screen.
      const spec = findSpecWithSymmetry(order);
      const mock = mockContext();
      drawSpec(mock.ctx, spec, CX, CY, RADIUS, 12.5, activeDrag(), 0.8, false);

      expect(mock.points.length).toBeGreaterThan(0);
      for (const p of mock.points) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it("keeps every point on screen at rest", () => {
    const { points } = draw(restingMotion());
    for (const p of points) {
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeLessThanOrEqual(RADIUS * 1.05);
    }
  });

  it("does not fling geometry off-canvas even under a hard drag", () => {
    const { points } = draw(activeDrag(), 40, 1, false);
    for (const p of points) {
      // Bloom and tilt together may push past the nominal radius, but never so
      // far that the pattern escapes the viewport.
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeLessThan(RADIUS * 1.6);
    }
  });

  it("displaces points near a held finger and leaves distant ones alone", () => {
    const resting = draw(restingMotion()).points;

    const finger = restingMotion();
    finger.pointer = { x: CX, y: CY - RADIUS, strength: 1, held: true };
    const bloomed = draw(finger).points;

    expect(bloomed.length).toBe(resting.length);

    let movedNearFinger = 0;
    let movedFarFromFinger = 0;
    for (let i = 0; i < resting.length; i++) {
      const shift = Math.hypot(
        bloomed[i].x - resting[i].x,
        bloomed[i].y - resting[i].y,
      );
      const distance = Math.hypot(
        resting[i].x - finger.pointer.x,
        resting[i].y - finger.pointer.y,
      );
      if (distance < RADIUS * 0.2 && shift > 1) movedNearFinger++;
      if (distance > RADIUS * 1.5 && shift > 1) movedFarFromFinger++;
    }

    expect(movedNearFinger).toBeGreaterThan(0);
    expect(movedFarFromFinger).toBe(0);
  });

  it("holds still over time when reduced motion is requested", () => {
    const early = draw(restingMotion(), 0, 1, true).points;
    const late = draw(restingMotion(), 600, 1, true).points;

    expect(late.length).toBe(early.length);
    for (let i = 0; i < early.length; i++) {
      expect(late[i].x).toBeCloseTo(early[i].x, 6);
      expect(late[i].y).toBeCloseTo(early[i].y, 6);
    }
  });

  it("does rotate over time when reduced motion is not requested", () => {
    const early = draw(restingMotion(), 0).points;
    const late = draw(restingMotion(), 60).points;

    const moved = early.some(
      (p, i) => Math.hypot(late[i].x - p.x, late[i].y - p.y) > 0.5,
    );
    expect(moved).toBe(true);
  });

  it("skips the whole pass once faded out, rather than drawing invisibly", () => {
    const mock = mockContext();
    drawSpec(
      mock.ctx,
      mandalaForId("faded"),
      CX,
      CY,
      RADIUS,
      0,
      restingMotion(),
      0,
      false,
    );
    expect(mock.calls).toHaveLength(0);
  });

  it("carries the frame's alpha into the stroke colour", () => {
    const dim = draw(restingMotion(), 0, 0.2).strokeStyles;
    const bright = draw(restingMotion(), 0, 1).strokeStyles;

    expect(dim.length).toBe(bright.length);
    expect(dim).not.toEqual(bright);
    for (const style of [...dim, ...bright]) {
      expect(style).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    }
  });
});

/** A pointer mid-drag, with spin and tilt wound up — the worst case for NaN. */
function activeDrag(): MotionState {
  return {
    spinAccum: 7.3,
    spinVel: 0.4,
    tilt: 0.9,
    tiltTarget: 1,
    pointer: { x: CX + 40, y: CY - 30, strength: 1, held: true },
  };
}

function findSpecWithSymmetry(order: number) {
  for (let seed = 0; seed < 500; seed++) {
    const spec = buildMandala(seed);
    if (spec.symmetry === order) return spec;
  }
  throw new Error(`No seed produced symmetry ${order}`);
}
