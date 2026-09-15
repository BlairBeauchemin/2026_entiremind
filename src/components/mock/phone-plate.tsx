import Image from "next/image";

import { ThreadScreen } from "@/components/landing/thread-screen";
import {
  THREAD_SCREEN_HEIGHT,
  THREAD_SCREEN_WIDTH,
} from "@/components/landing/thread-screen-size";
import {
  PLATE_STAGE_HEIGHT,
  PLATE_STAGE_WIDTH,
  type PlateDefinition,
} from "@/lib/mock/plates";
import {
  cornersToPixels,
  matrix3dFromCorners,
} from "@/lib/mock/screen-projection";

interface PhonePlateProps {
  plate: PlateDefinition;
  priority?: boolean;
}

/**
 * A photographed phone with the real thread projected onto its screen.
 *
 * The photograph supplies the light, the linen and the single contact shadow;
 * the screen is live DOM on top, so the copy stays editable and the type stays
 * Prata and Karla rather than whatever a model would have drawn.
 *
 * Deliberately nothing is layered over the screen — no gloss, no glare, no
 * extra shadow. Faking glass is the "rendered, not printed" move DESIGN.md
 * retired, and the composite reads cleaner without it.
 */
export function PhonePlate({ plate, priority = false }: PhonePlateProps) {
  const transform = matrix3dFromCorners(
    THREAD_SCREEN_WIDTH,
    THREAD_SCREEN_HEIGHT,
    cornersToPixels(plate.corners, PLATE_STAGE_WIDTH, PLATE_STAGE_HEIGHT),
  );

  return (
    <div
      className="plate-stage relative select-none"
      style={{ width: PLATE_STAGE_WIDTH, height: PLATE_STAGE_HEIGHT }}
    >
      <Image
        src={plate.src}
        alt={plate.alt}
        width={PLATE_STAGE_WIDTH}
        height={PLATE_STAGE_HEIGHT}
        priority={priority}
        sizes={`${PLATE_STAGE_WIDTH}px`}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* A null transform means the measured corners are not a proper quad.
          Showing the bare photograph beats showing a collapsed screen —
          `plates.test.ts` is what keeps that branch from going unnoticed. */}
      {transform ? (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: THREAD_SCREEN_WIDTH,
            height: THREAD_SCREEN_HEIGHT,
            transform,
          }}
        >
          <ThreadScreen settled />
        </div>
      ) : null}
    </div>
  );
}
