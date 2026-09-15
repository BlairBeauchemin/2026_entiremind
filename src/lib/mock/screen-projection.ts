/**
 * Projecting the coded phone screen onto a photographed phone.
 *
 * The plates are photographs, so even a "shot face-on" phone lands a little
 * off-square, and the leaning plate carries real perspective. A 2D rotate and
 * scale cannot land a trapezoid; a projective transform can.
 *
 * This solves the homography taking the flat screen rectangle to the four
 * corners measured off the photograph, and emits it as a CSS `matrix3d`.
 * Nudging three plates by hand would have been faster once and wrong forever
 * after — a re-shoot would mean re-nudging. Re-measure the corners instead.
 */

export interface Point {
  x: number;
  y: number;
}

/** The four screen corners, in the order a reader expects to find them. */
export interface ScreenCorners {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

/**
 * Row-major 3x3 projective transform:
 *
 *   [ h0 h1 h2 ]
 *   [ h3 h4 h5 ]
 *   [ h6 h7 h8 ]
 */
export type Homography = readonly number[];

/** Solve `A x = b` by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Work on a copy so the caller's arrays are left alone.
  const m = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    // A singular system means the four points are degenerate — three
    // collinear, or two coincident. There is no transform to return.
    if (Math.abs(m[pivot][col]) < 1e-12) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    const d = m[col][col];
    for (let c = col; c <= n; c++) m[col][c] /= d;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }

  return m.map((row) => row[n]);
}

/**
 * Is `dest` a proper convex quad, walked tl -> tr -> br -> bl?
 *
 * Worth checking separately: a flattened quad (three corners collinear, say a
 * mistyped coordinate) still gives a *solvable* linear system below, so the
 * solver happily returns a transform that collapses the screen to a sliver.
 * The geometry is the real precondition, so it is tested as geometry.
 */
function isProperQuad(dest: ScreenCorners): boolean {
  const pts = [dest.tl, dest.tr, dest.br, dest.bl];

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const span =
    Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));
  if (!(span > 0)) return false;
  // Scale-relative, so the same quad passes in fractions or in pixels.
  const epsilon = span * span * 1e-6;

  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < epsilon) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * The homography mapping the rectangle (0,0)-(width,height) onto `dest`.
 *
 * Returns null when the destination quad is degenerate, so callers can fall
 * back rather than render a phone screen collapsed to a line.
 */
export function solveHomography(
  width: number,
  height: number,
  dest: ScreenCorners,
): Homography | null {
  if (!(width > 0) || !(height > 0)) return null;

  const src: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const dst = [dest.tl, dest.tr, dest.br, dest.bl];

  if (
    ![...src, ...dst].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  ) {
    return null;
  }
  if (!isProperQuad(dest)) return null;

  // Fix h8 = 1 and solve the remaining eight unknowns.
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }

  const h = solve(A, b);
  if (!h || !h.every(Number.isFinite)) return null;
  return [...h, 1];
}

/** Apply a homography to a point. Exported so the tests can round-trip it. */
export function projectPoint(h: Homography, p: Point): Point {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  if (w === 0 || !Number.isFinite(w)) return { x: NaN, y: NaN };
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / w,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / w,
  };
}

/**
 * A CSS `matrix3d(...)` placing a `width` x `height` element onto `dest`.
 *
 * CSS wants column-major, and the 2D projective transform sits inside the 4x4
 * with the third row and column left as identity. Pair it with
 * `transform-origin: 0 0` — the matrix already assumes the element's own
 * top-left is the origin.
 */
export function matrix3dFromCorners(
  width: number,
  height: number,
  dest: ScreenCorners,
): string | null {
  const h = solveHomography(width, height, dest);
  if (!h) return null;

  // Laid out as the 4x4 CSS actually reads, one column per line.
  // prettier-ignore
  const m = [
    h[0], h[3], 0, h[6],
    h[1], h[4], 0, h[7],
    0,    0,    1, 0,
    h[2], h[5], 0, h[8],
  ];
  return `matrix3d(${m.map((v) => Number(v.toFixed(6))).join(", ")})`;
}

/** Scale fractional corners (0..1 of the plate) into a stage's pixel space. */
export function cornersToPixels(
  corners: ScreenCorners,
  stageWidth: number,
  stageHeight: number,
): ScreenCorners {
  const s = (p: Point): Point => ({
    x: p.x * stageWidth,
    y: p.y * stageHeight,
  });
  return {
    tl: s(corners.tl),
    tr: s(corners.tr),
    br: s(corners.br),
    bl: s(corners.bl),
  };
}
