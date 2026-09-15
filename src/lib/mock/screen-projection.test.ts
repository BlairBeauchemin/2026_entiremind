import { describe, expect, it } from "vitest";
import {
  cornersToPixels,
  matrix3dFromCorners,
  projectPoint,
  solveHomography,
  type ScreenCorners,
} from "./screen-projection";

const W = 340;
const H = 680;

const rect = (x: number, y: number, w: number, h: number): ScreenCorners => ({
  tl: { x, y },
  tr: { x: x + w, y },
  br: { x: x + w, y: y + h },
  bl: { x, y: y + h },
});

/** The real measured quad from public/mock/phone/plate-lean.png. */
const LEAN: ScreenCorners = {
  tl: { x: 0.4029, y: 0.29821 },
  tr: { x: 0.59431, y: 0.30045 },
  br: { x: 0.53627, y: 0.69866 },
  bl: { x: 0.33761, y: 0.68795 },
};

describe("solveHomography", () => {
  it("returns identity for a destination equal to the source rect", () => {
    const h = solveHomography(W, H, rect(0, 0, W, H));
    expect(h).not.toBeNull();
    const expected = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    h!.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));
  });

  it("recovers a pure translation", () => {
    const h = solveHomography(W, H, rect(50, 25, W, H))!;
    expect(h[2]).toBeCloseTo(50, 9);
    expect(h[5]).toBeCloseTo(25, 9);
    // No scaling and no perspective.
    expect(h[0]).toBeCloseTo(1, 9);
    expect(h[4]).toBeCloseTo(1, 9);
    expect(h[6]).toBeCloseTo(0, 9);
    expect(h[7]).toBeCloseTo(0, 9);
  });

  it("recovers a pure scale", () => {
    const h = solveHomography(W, H, rect(0, 0, W * 2, H * 3))!;
    expect(h[0]).toBeCloseTo(2, 9);
    expect(h[4]).toBeCloseTo(3, 9);
  });

  it("round-trips the source corners onto a real perspective quad", () => {
    const dest = cornersToPixels(LEAN, 560, 700);
    const h = solveHomography(W, H, dest)!;

    const checks: [{ x: number; y: number }, { x: number; y: number }][] = [
      [{ x: 0, y: 0 }, dest.tl],
      [{ x: W, y: 0 }, dest.tr],
      [{ x: W, y: H }, dest.br],
      [{ x: 0, y: H }, dest.bl],
    ];
    for (const [src, want] of checks) {
      const got = projectPoint(h, src);
      expect(got.x).toBeCloseTo(want.x, 6);
      expect(got.y).toBeCloseTo(want.y, 6);
    }
  });

  it("keeps the centre of the screen inside the destination quad", () => {
    const dest = cornersToPixels(LEAN, 560, 700);
    const h = solveHomography(W, H, dest)!;
    const mid = projectPoint(h, { x: W / 2, y: H / 2 });

    const xs = [dest.tl.x, dest.tr.x, dest.br.x, dest.bl.x];
    const ys = [dest.tl.y, dest.tr.y, dest.br.y, dest.bl.y];
    expect(mid.x).toBeGreaterThan(Math.min(...xs));
    expect(mid.x).toBeLessThan(Math.max(...xs));
    expect(mid.y).toBeGreaterThan(Math.min(...ys));
    expect(mid.y).toBeLessThan(Math.max(...ys));
  });

  it("returns null rather than a collapsed screen for degenerate input", () => {
    // Three collinear points.
    expect(
      solveHomography(W, H, {
        tl: { x: 0, y: 0 },
        tr: { x: 10, y: 0 },
        br: { x: 20, y: 0 },
        bl: { x: 0, y: 50 },
      }),
    ).toBeNull();

    expect(solveHomography(0, H, rect(0, 0, W, H))).toBeNull();
    expect(solveHomography(W, 0, rect(0, 0, W, H))).toBeNull();
    expect(
      solveHomography(W, H, {
        tl: { x: NaN, y: 0 },
        tr: { x: W, y: 0 },
        br: { x: W, y: H },
        bl: { x: 0, y: H },
      }),
    ).toBeNull();
  });
});

describe("matrix3dFromCorners", () => {
  it("emits sixteen finite values in column-major order", () => {
    const css = matrix3dFromCorners(W, H, cornersToPixels(LEAN, 560, 700));
    expect(css).toMatch(/^matrix3d\(/);

    const nums = css!.slice("matrix3d(".length, -1).split(",").map(Number);
    expect(nums).toHaveLength(16);
    expect(nums.every(Number.isFinite)).toBe(true);

    // The third row and column stay identity for a 2D projective transform.
    expect(nums[2]).toBe(0);
    expect(nums[6]).toBe(0);
    expect(nums[10]).toBe(1);
    expect(nums[14]).toBe(0);
  });

  it("emits the identity matrix when the destination is the source rect", () => {
    const css = matrix3dFromCorners(W, H, rect(0, 0, W, H));
    const nums = css!.slice("matrix3d(".length, -1).split(",").map(Number);
    expect(nums).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });

  it("puts translation in the fourth column, where CSS expects it", () => {
    const css = matrix3dFromCorners(W, H, rect(50, 25, W, H));
    const nums = css!.slice("matrix3d(".length, -1).split(",").map(Number);
    expect(nums[12]).toBeCloseTo(50, 6);
    expect(nums[13]).toBeCloseTo(25, 6);
  });

  it("returns null for degenerate input", () => {
    expect(matrix3dFromCorners(0, H, rect(0, 0, W, H))).toBeNull();
  });
});

describe("cornersToPixels", () => {
  it("scales fractional corners into stage pixels", () => {
    const px = cornersToPixels(LEAN, 560, 700);
    expect(px.tl.x).toBeCloseTo(0.4029 * 560, 6);
    expect(px.tl.y).toBeCloseTo(0.29821 * 700, 6);
    expect(px.br.x).toBeCloseTo(0.53627 * 560, 6);
    expect(px.br.y).toBeCloseTo(0.69866 * 700, 6);
  });
});
