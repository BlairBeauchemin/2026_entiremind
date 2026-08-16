"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Atelier — grounded daily practice.
 *
 * Premium via material honesty rather than ornament: warm plaster, unglazed
 * clay, one ochre. The composition is a workbench — a wide left column of
 * plaster and a narrow clay band at the right, meeting on a hard vertical seam
 * with no blend, the way two real materials meet.
 */
export function AtelierHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-at-plaster">
        <div className="grid min-h-screen lg:grid-cols-[1.35fr_0.65fr]">
          <div className="flex flex-col justify-center px-6 py-20 sm:px-14 lg:px-20">
            <p className="font-hand text-[0.66rem] uppercase tracking-[0.3em] text-at-slate">
              {C.eyebrow.brand}
              <span className="mx-3 text-at-clay">/</span>
              {C.eyebrow.status}
            </p>

            <h1 className="mt-9 max-w-[16ch] font-plate text-[2.5rem] font-medium leading-[1.06] text-at-ink sm:text-[3.4rem] lg:text-[4.2rem]">
              {C.headline.lead}
              <span className="block text-at-clay">{C.headline.turn}</span>
            </h1>

            {/* A scored line, as if pressed into the plaster while still wet. */}
            <div aria-hidden className="mt-9 h-px w-24 bg-at-ink/25" />

            <p className="mt-9 max-w-[48ch] font-hand text-[1.04rem] leading-[1.8] text-at-ink/75">
              {C.subhead}
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <button
                type="button"
                onClick={() => {
                  analytics.leadFormOpen("hero");
                  setOpen(true);
                }}
                className="bg-at-ink px-10 py-4 font-hand text-[0.94rem] text-at-plaster transition-colors duration-300 hover:bg-at-clay focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-at-clay"
              >
                {C.cta.label}
              </button>
              <p className="max-w-[17rem] font-hand text-[0.82rem] leading-relaxed text-at-ink/50">
                {C.cta.reassurance.join(" ")}
              </p>
            </div>
          </div>

          {/* The clay band. Hard seam, no gradient — two materials, butted. */}
          <div className="relative flex items-center justify-center bg-at-clay px-8 py-16 lg:py-0">
            <div className="w-full max-w-[22rem]">
              <TangleHead
                hand="ink"
                profileColor="var(--color-at-plaster)"
                tangleColor="var(--color-at-ink)"
                threadColor="var(--color-at-ochre)"
                compassColor="var(--color-at-plaster)"
                className="w-full"
              />
              <p className="mt-5 text-center font-plate text-[0.88rem] italic text-at-plaster/70">
                {C.figure}
              </p>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
