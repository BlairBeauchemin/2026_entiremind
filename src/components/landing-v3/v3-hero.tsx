"use client";

import { useState } from "react";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { V3HeroScene } from "./v3-hero-scene";
import heroWideA from "../../../public/images/v3/hero-wide-a.webp";
import heroWideB from "../../../public/images/v3/hero-wide-b.webp";
import heroTall from "../../../public/images/v3/hero-tall.webp";

/**
 * Two candidate rooms. `tableLine` is where each plate's table surface sits,
 * measured off the rendered page — A's runs brighter and higher in frame than
 * B's, so the device's resting point is not the same number for both.
 */
const PLATES = {
  a: { wide: heroWideA, tableLine: "21%" },
  b: { wide: heroWideB, tableLine: "23%" },
} as const;

const PLATE = PLATES.a;

export function V3Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header id="section-hero" className="relative z-10">
        <V3HeroScene
          wide={PLATE.wide}
          tall={heroTall}
          tableLine={PLATE.tableLine}
        >
          {/* The copy sits directly on the plaster. The plates were generated
              with a deliberately bright, empty left field for exactly this;
              ink measures ~12:1 against it even in the darkest tile. */}
          <div className="max-w-[34rem] lg:max-w-[30rem]">
            <h1 className="font-serif text-display text-balance text-ink">
              A manifestation practice that{" "}
              {/* The mock sets this clause in cobalt italic. DESIGN.md asks for
                  emphasis by italic "rather than by bolding, colouring, or
                  enlarging" — so the colour is a deliberate v3 departure from
                  the house rule, kept because it is the approved direction. */}
              <em className="italic text-cobalt">
                fits into your everyday life
              </em>
              .
            </h1>

            <p className="mt-8 max-w-[38ch] text-body text-muted">
              Keep coming back to what you want to create. Entiremind sends
              personalized text prompts to help you pause, reconnect with your
              intentions, and take a small step forward&mdash;even when life
              gets busy.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-sm bg-cobalt px-8 py-3.5 font-sans text-sm font-medium text-linen transition-colors duration-300 hover:bg-cobalt-deep"
              >
                Join the waitlist
              </button>
              <a
                href="#section-how-it-works"
                className="font-sans text-sm text-ink underline underline-offset-4 transition-colors hover:text-cobalt"
              >
                See how it works
              </a>
            </div>

            <p className="mt-6 max-w-[42ch] text-sm text-muted">
              Be the first to hear when the personalized text experience opens.
              Free to join.
            </p>
          </div>
        </V3HeroScene>
      </header>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
