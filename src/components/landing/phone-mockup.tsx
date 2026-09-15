"use client";

import {
  ThreadScreen,
  THREAD_SCREEN_WIDTH,
  THREAD_SCREEN_HEIGHT,
} from "./thread-screen";

interface PhoneMockupProps {
  rotated?: boolean;
}

/**
 * The drawn device: a CSS frame wrapped around <ThreadScreen />.
 *
 * The thread itself lives in `thread-screen.tsx` so the photographic
 * composites in `components/mock/phone-plate.tsx` render the very same
 * bubbles rather than a copy that can drift.
 *
 * The device carries the single contact shadow the system permits, on the
 * grounds that it is an object sitting on the page rather than a raised panel.
 */
export function PhoneMockup({ rotated = true }: PhoneMockupProps) {
  return (
    <div
      className={`relative bg-linen rounded-[3.25rem] border-[8px] border-ink overflow-hidden z-10 transition-transform duration-700 ease-out [box-shadow:0_18px_40px_-24px_rgba(20,18,15,0.45)] ${
        rotated ? "rotate-[-2deg] hover:rotate-0" : ""
      }`}
      style={{ width: THREAD_SCREEN_WIDTH, height: THREAD_SCREEN_HEIGHT }}
    >
      <ThreadScreen />
    </div>
  );
}
