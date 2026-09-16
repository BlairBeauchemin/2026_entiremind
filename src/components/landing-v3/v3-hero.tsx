"use client";

import { useState } from "react";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { V3HeroScene } from "./v3-hero-scene";

export function V3Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header
        id="section-hero"
        className="relative z-10 pt-32 pb-4 lg:pt-40 lg:pb-12"
      >
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:gap-10 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:gap-14">
          {/* Copy first in the DOM: on a phone the words should arrive before
              the photograph, and that is also the reading order we want. */}
          <div className="max-w-[34rem]">
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

          <V3HeroScene />
        </div>
      </header>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
