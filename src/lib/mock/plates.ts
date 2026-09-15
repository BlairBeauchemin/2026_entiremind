import type { ScreenCorners } from "./screen-projection";

/**
 * The stage the composites are laid out in. The plates are 4:5, and every
 * corner below is a fraction of the plate, so this is the one place the pixel
 * size is decided. Changing it rescales the whole composite and nothing else.
 */
export const PLATE_STAGE_WIDTH = 560;
export const PLATE_STAGE_HEIGHT = 700;

export type PlateId = "flat" | "hand" | "lean";

export interface PlateDefinition {
  id: PlateId;
  src: string;
  /** Screen corners as fractions of the plate, measured off the photograph. */
  corners: ScreenCorners;
  alt: string;
}

/**
 * Corner fractions were measured off each plate by thresholding the bright
 * screen region and taking the extreme points of the blob the bezel encloses,
 * not by eye. `docs/brand/phone-mock-plates.md` records how to redo it.
 *
 * Kept free of React so `plates.test.ts` can assert every plate still projects
 * to a real quad — a bad corner renders a blank screen over a perfectly fine
 * photograph, which looks like a styling problem and is not one.
 */
export const PLATES: Record<PlateId, PlateDefinition> = {
  flat: {
    id: "flat",
    src: "/mock/phone/plate-flat.webp",
    alt: "A phone lying on a linen drape in raking daylight, beside a sheet of deckle-edge paper and a brass disc.",
    corners: {
      tl: { x: 0.2952, y: 0.26518 },
      tr: { x: 0.52344, y: 0.26652 },
      br: { x: 0.52176, y: 0.68705 },
      bl: { x: 0.2952, y: 0.6875 },
    },
  },
  hand: {
    id: "hand",
    src: "/mock/phone/plate-hand.webp",
    alt: "A hand holding a phone upright, with window light and linen behind it.",
    corners: {
      tl: { x: 0.34487, y: 0.1875 },
      tr: { x: 0.6529, y: 0.1875 },
      br: { x: 0.65458, y: 0.74643 },
      bl: { x: 0.34598, y: 0.74821 },
    },
  },
  lean: {
    id: "lean",
    src: "/mock/phone/plate-lean.webp",
    alt: "A phone leaning against a matte cobalt arch on a linen drape, with a brass disc beside it.",
    corners: {
      tl: { x: 0.4029, y: 0.29821 },
      tr: { x: 0.59431, y: 0.30045 },
      br: { x: 0.53627, y: 0.69866 },
      bl: { x: 0.33761, y: 0.68795 },
    },
  },
};
