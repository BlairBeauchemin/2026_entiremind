import { describe, expect, it } from "vitest";
import {
  PLATES,
  PLATE_STAGE_HEIGHT,
  PLATE_STAGE_WIDTH,
  type PlateId,
} from "./plates";
import { cornersToPixels, matrix3dFromCorners } from "./screen-projection";
import {
  THREAD_SCREEN_HEIGHT,
  THREAD_SCREEN_WIDTH,
} from "@/components/landing/thread-screen-size";

const ids = Object.keys(PLATES) as PlateId[];

describe("plate definitions", () => {
  it.each(ids)("%s projects to a real quad", (id) => {
    const css = matrix3dFromCorners(
      THREAD_SCREEN_WIDTH,
      THREAD_SCREEN_HEIGHT,
      cornersToPixels(
        PLATES[id].corners,
        PLATE_STAGE_WIDTH,
        PLATE_STAGE_HEIGHT,
      ),
    );
    // A null matrix renders a blank screen over a good photograph, which reads
    // as a CSS problem and is not one. Fail here instead.
    expect(css, `${id} produced no transform`).not.toBeNull();
    expect(css).toMatch(/^matrix3d\(/);
  });

  it.each(ids)("%s keeps its screen inside the plate", (id) => {
    const { corners } = PLATES[id];
    for (const p of Object.values(corners)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it.each(ids)("%s points at a webp under /mock/phone", (id) => {
    expect(PLATES[id].src).toMatch(/^\/mock\/phone\/plate-[a-z]+\.webp$/);
    expect(PLATES[id].alt.length).toBeGreaterThan(20);
  });
});
