import { describe, it, expect } from "vitest";
import {
  AMBIENT_STAR_COUNT,
  DRAW_BUDGET,
  buildSky,
  starForAffirmation,
  type Star,
} from "./starfield";
import {
  IGNITE_MS,
  drawSky,
  ignitionProgress,
  restingMotion,
  type Ignition,
  type SkyMotion,
} from "./render";

/**
 * A canvas that draws nothing looks exactly like a canvas that works: no error,
 * no warning, just an empty screen. One NaN anywhere in the geometry silently
 * voids the draw. These tests run the real draw pass against a recording stub
 * so that failure mode cannot ship.
 */

interface Arc {
  x: number;
  y: number;
  r: number;
  fill: string;
}

interface Blit {
  sprite: unknown;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
}

/** Stand-ins for the offscreen glow canvases the component builds. */
const SPRITES = {
  white: { tint: "white" } as unknown as CanvasImageSource,
  warm: { tint: "warm" } as unknown as CanvasImageSource,
};

function mockContext() {
  const arcs: Arc[] = [];
  const blits: Blit[] = [];
  let fillStyle = "";
  let globalAlpha = 1;
  let pending: { x: number; y: number; r: number } | null = null;

  const ctx = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get globalAlpha() {
      return globalAlpha;
    },
    set globalAlpha(value: number) {
      globalAlpha = value;
    },
    beginPath() {
      pending = null;
    },
    arc(x: number, y: number, r: number) {
      pending = { x, y, r };
    },
    fill() {
      if (pending) arcs.push({ ...pending, fill: fillStyle });
    },
    drawImage(sprite: unknown, x: number, y: number, w: number, h: number) {
      blits.push({ sprite, x, y, w, h, alpha: globalAlpha });
    },
  };

  return { ctx: ctx as unknown as CanvasRenderingContext2D, arcs, blits };
}

const WIDTH = 390; // iPhone-ish, the target device
const HEIGHT = 844;
const SKY = buildSky("a-user-id", ["aff-one", "aff-two", "aff-three"]);

function draw(overrides: Partial<Parameters<typeof drawSky>[1]> = {}): {
  arcs: Arc[];
  blits: Blit[];
  count: number;
} {
  const mock = mockContext();
  const count = drawSky(mock.ctx, {
    stars: SKY,
    width: WIDTH,
    height: HEIGHT,
    seconds: 0,
    motion: restingMotion(),
    breath: 0.5,
    glowSprites: SPRITES,
    reduced: false,
    ...overrides,
  });
  return { arcs: mock.arcs, blits: mock.blits, count };
}

/** A pointer mid-drag with the sky panned a long way — the worst case for NaN. */
function pannedAndTouched(): SkyMotion {
  return {
    pan: { x: 37.42, y: -18.9 },
    panVel: { x: 0.4, y: -0.2 },
    pointer: { x: WIDTH * 0.6, y: HEIGHT * 0.4, strength: 1, held: true },
  };
}

describe("drawSky", () => {
  it("actually fills arcs", () => {
    const { arcs, blits, count } = draw();
    expect(arcs.length).toBeGreaterThan(100);
    expect(count).toBe(arcs.length + blits.length);
  });

  it("never produces a NaN or infinite coordinate, even panned and touched", () => {
    const { arcs } = draw({ motion: pannedAndTouched(), seconds: 91.3 });
    expect(arcs.length).toBeGreaterThan(0);
    for (const arc of arcs) {
      expect(Number.isFinite(arc.x)).toBe(true);
      expect(Number.isFinite(arc.y)).toBe(true);
      expect(Number.isFinite(arc.r)).toBe(true);
      expect(arc.r).toBeGreaterThan(0);
    }
  });

  it("keeps every star on screen after a huge pan — the wrap that matters", () => {
    for (const pan of [
      { x: 0, y: 0 },
      { x: 12.3, y: 4.5 },
      { x: -87.6, y: 51.2 },
    ]) {
      const { arcs } = draw({
        motion: { ...restingMotion(), pan },
      });
      for (const arc of arcs) {
        expect(arc.x).toBeGreaterThanOrEqual(0);
        expect(arc.x).toBeLessThanOrEqual(WIDTH);
        expect(arc.y).toBeGreaterThanOrEqual(0);
        expect(arc.y).toBeLessThanOrEqual(HEIGHT);
      }
    }
  });

  it("emits only valid rgba fills", () => {
    for (const arc of draw().arcs) {
      expect(arc.fill).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    }
  });

  it("stays inside the per-frame draw budget", () => {
    expect(draw().count).toBeLessThanOrEqual(DRAW_BUDGET);
    // Worst case: a finger held on the sky lifts many stars over the halo
    // threshold at once, which is exactly when the budget could blow.
    expect(
      draw({ motion: pannedAndTouched(), breath: 1 }).count,
    ).toBeLessThanOrEqual(DRAW_BUDGET);
  });

  it("parallaxes near stars further than far ones", () => {
    const near: Star = {
      id: "near",
      x: 0.5,
      y: 0.5,
      depth: 1,
      radius: 2,
      baseAlpha: 0.9,
      phase: 0,
      speed: 0,
      isAffirmation: false,
    };
    const far: Star = { ...near, id: "far", depth: 0 };
    const stars = [near, far];

    const at = (panX: number) => {
      const mock = mockContext();
      drawSky(mock.ctx, {
        stars,
        width: WIDTH,
        height: HEIGHT,
        seconds: 0,
        motion: { ...restingMotion(), pan: { x: panX, y: 0 } },
        breath: 1,
        reduced: true,
      });
      return mock.arcs.map((a) => a.x);
    };

    const before = at(0);
    const after = at(0.1);
    const nearShift = Math.abs(after[0] - before[0]);
    const farShift = Math.abs(after[1] - before[1]);

    expect(nearShift).toBeGreaterThan(farShift);
    expect(farShift).toBeGreaterThan(0); // still drifts, just less
  });

  it("twinkles — the same star is not equally bright at every moment", () => {
    const early = draw({ seconds: 0 }).arcs.map((a) => a.fill);
    const later = draw({ seconds: 3.7 }).arcs.map((a) => a.fill);
    expect(later).not.toEqual(early);
  });

  it("brightens the whole field with the breath", () => {
    const exhaled = draw({ breath: 0, reduced: true }).arcs;
    const inhaled = draw({ breath: 1, reduced: true }).arcs;

    const alphaOf = (arc: Arc) => Number(arc.fill.match(/([\d.]+)\)$/)![1]);
    const sum = (list: Arc[]) => list.reduce((t, a) => t + alphaOf(a), 0);

    expect(sum(inhaled)).toBeGreaterThan(sum(exhaled));
  });

  it("flares stars near a held finger and leaves distant ones alone", () => {
    const finger = {
      ...restingMotion(),
      pointer: { x: WIDTH / 2, y: HEIGHT / 2, strength: 1, held: true },
    };

    // Flaring pushes stars over the halo threshold, so the two draws emit
    // different numbers of arcs and cannot be compared index by index. Position
    // is the stable key: the flare changes brightness and size, never location.
    const alphaOf = (arc: Arc) => Number(arc.fill.match(/([\d.]+)\)$/)![1]);
    const brightestByPosition = (arcs: Arc[]) => {
      const map = new Map<string, number>();
      for (const arc of arcs) {
        const key = `${arc.x.toFixed(3)},${arc.y.toFixed(3)}`;
        map.set(key, Math.max(map.get(key) ?? 0, alphaOf(arc)));
      }
      return map;
    };

    const calm = brightestByPosition(draw().arcs);
    const touched = brightestByPosition(draw({ motion: finger }).arcs);

    let brightenedNear = 0;
    let brightenedFar = 0;
    for (const [key, calmAlpha] of calm) {
      const lift = (touched.get(key) ?? 0) - calmAlpha;
      const [x, y] = key.split(",").map(Number);
      const distance = Math.hypot(x - WIDTH / 2, y - HEIGHT / 2);
      if (distance < 40 && lift > 0.05) brightenedNear++;
      if (distance > Math.min(WIDTH, HEIGHT) && lift > 0.05) brightenedFar++;
    }

    expect(brightenedNear).toBeGreaterThan(0);
    expect(brightenedFar).toBe(0);
  });

  it("draws affirmation stars warm and backdrop stars white", () => {
    const { arcs } = draw({ reduced: true });
    const warm = arcs.filter((a) => a.fill.startsWith("rgba(249, 217, 122"));
    // Three affirmations, and reduced motion suppresses their haloes.
    expect(warm).toHaveLength(3);
    expect(arcs.length).toBeGreaterThan(AMBIENT_STAR_COUNT / 2);
  });

  describe("glow sprites", () => {
    it("blits a soft glow behind the bright stars", () => {
      const { blits } = draw();
      expect(blits.length).toBeGreaterThan(0);
      // Only the brightest carry a glow; the rest are bare points.
      expect(blits.length).toBeLessThan(SKY.length / 2);
    });

    it("centres every glow on its star with finite, positive extent", () => {
      for (const blit of draw({ motion: pannedAndTouched() }).blits) {
        expect(Number.isFinite(blit.x)).toBe(true);
        expect(Number.isFinite(blit.y)).toBe(true);
        expect(blit.w).toBeGreaterThan(0);
        expect(blit.w).toBe(blit.h); // square, so the glow stays circular
      }
    });

    it("always restores globalAlpha, so a blit cannot dim the next star", () => {
      const mock = mockContext();
      drawSky(mock.ctx, {
        stars: SKY,
        width: WIDTH,
        height: HEIGHT,
        seconds: 0,
        motion: restingMotion(),
        breath: 1,
        glowSprites: SPRITES,
        reduced: false,
      });
      expect(mock.ctx.globalAlpha).toBe(1);
      for (const blit of mock.blits) {
        expect(blit.alpha).toBeGreaterThan(0);
        expect(blit.alpha).toBeLessThanOrEqual(1);
      }
    });

    it("tints affirmation glows warm and backdrop glows white", () => {
      const { blits } = draw();
      const warm = blits.filter((b) => b.sprite === SPRITES.warm);
      expect(warm).toHaveLength(3); // one per affirmation
      expect(blits.length).toBeGreaterThan(warm.length);
    });

    it("still draws the stars when no sprites are supplied", () => {
      const { arcs, blits } = draw({ glowSprites: undefined });
      expect(arcs.length).toBeGreaterThan(100);
      expect(blits).toHaveLength(0);
    });
  });

  describe("reduced motion", () => {
    it("holds completely still over time", () => {
      const early = draw({ seconds: 0, reduced: true }).arcs;
      const late = draw({ seconds: 240, reduced: true }).arcs;

      expect(late).toHaveLength(early.length);
      for (let i = 0; i < early.length; i++) {
        expect(late[i].x).toBeCloseTo(early[i].x, 10);
        expect(late[i].y).toBeCloseTo(early[i].y, 10);
        expect(late[i].fill).toBe(early[i].fill);
      }
    });

    it("does not flare under a finger", () => {
      const finger = {
        ...restingMotion(),
        pointer: { x: WIDTH / 2, y: HEIGHT / 2, strength: 1, held: true },
      };
      expect(draw({ motion: finger, reduced: true }).arcs).toEqual(
        draw({ reduced: true }).arcs,
      );
    });

    it("draws no glows, so every star is a single arc", () => {
      const { count, blits } = draw({ reduced: true });
      expect(blits).toHaveLength(0);
      expect(count).toBeLessThanOrEqual(SKY.length);
    });
  });

  describe("ignition", () => {
    const star = starForAffirmation("aff-two");

    // Built the way the component builds it: from the affirmation id alone,
    // with no access to the Star instance sitting in the sky array. An earlier
    // version keyed ignitions on the object reference, which meant the flare
    // silently never drew in the real app while a test that reached into SKY
    // for the matching instance passed happily.
    const ignite = (elapsed: number): Ignition[] => [
      { starId: "aff-two", startedAt: -elapsed },
    ];

    const ignitedArc = (elapsed: number) => {
      const { arcs } = draw({
        ignitions: ignite(elapsed),
        now: 0,
        reduced: true,
      });
      // Reduced motion draws one arc per star, so positions map cleanly.
      return arcs.find(
        (a) =>
          Math.abs(a.x - star.x * WIDTH) < 0.01 &&
          Math.abs(a.y - star.y * HEIGHT) < 0.01,
      );
    };

    it("reports progress from 0 to 1 and then retires", () => {
      const at = (now: number) =>
        ignitionProgress({ starId: star.id, startedAt: 0 }, now);
      expect(at(0)).toBe(0);
      expect(at(IGNITE_MS / 2)).toBeCloseTo(0.5, 5);
      expect(at(IGNITE_MS)).toBeNull();
      expect(at(IGNITE_MS * 3)).toBeNull();
    });

    it("treats a not-yet-started ignition as progress 0, not negative", () => {
      expect(ignitionProgress({ starId: star.id, startedAt: 100 }, 0)).toBe(0);
    });

    it("finds its star from the affirmation id alone", () => {
      // The regression guard: if identity matching creeps back, the flare
      // vanishes and this is the only thing that notices.
      const flaring = draw({ ignitions: ignite(0), now: 0 });
      const calm = draw();
      expect(Math.max(...flaring.arcs.map((a) => a.r))).toBeGreaterThan(
        Math.max(...calm.arcs.map((a) => a.r)),
      );
    });

    it("flares large and bright, then settles to the resting star", () => {
      const atStart = draw({ ignitions: ignite(0), now: 0, reduced: false });
      const settled = draw({ reduced: false });

      const biggest = (arcs: Arc[]) => Math.max(...arcs.map((a) => a.r));
      expect(biggest(atStart.arcs)).toBeGreaterThan(biggest(settled.arcs));
    });

    it("fades the new star in rather than flaring under reduced motion", () => {
      const early = ignitedArc(0);
      const late = ignitedArc(IGNITE_MS * 0.9);
      const alphaOf = (a?: Arc) =>
        a ? Number(a.fill.match(/([\d.]+)\)$/)![1]) : 0;

      // Fading in: dim (or below the visibility cutoff) at first, bright later.
      expect(alphaOf(early)).toBeLessThan(alphaOf(late));
      // Never a flare — the radius must not balloon.
      if (early) expect(early.r).toBeCloseTo(late!.r, 5);
    });

    it("ignores an ignition that has already finished", () => {
      expect(
        draw({ ignitions: ignite(IGNITE_MS * 2), now: 0, reduced: true }).arcs,
      ).toEqual(draw({ reduced: true }).arcs);
    });
  });
});
