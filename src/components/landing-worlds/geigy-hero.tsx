"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Geigy-era pharmaceutical identity. A ruled grid, one signal colour, and
 * every element registered to the column. Interior change treated as
 * clinical craft: the drawing is a plotted contour with a figure number, not
 * an illustration.
 */
export function GeigyHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="min-h-screen bg-gg-paper px-5 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-[80rem]">
          {/* Registration row: the sheet identifies itself before it speaks. */}
          <div className="flex items-baseline justify-between border-b border-gg-ink pb-3">
            <p className="font-hand text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gg-ink">
              {C.eyebrow.brand}
            </p>
            <p className="font-hand text-[0.7rem] uppercase tracking-[0.2em] text-gg-ink/55">
              {C.eyebrow.status}
            </p>
          </div>

          <div className="grid gap-10 border-b border-gg-rule py-12 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-7">
              <h1 className="font-hand text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.03em] text-gg-ink sm:text-[3.6rem] lg:text-[4.6rem]">
                {C.headline.lead}
                <span className="block text-gg-signal">{C.headline.turn}</span>
              </h1>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <p className="font-hand text-[0.96rem] leading-[1.65] text-gg-ink/80">
                  {C.subhead}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      analytics.leadFormOpen("hero");
                      setOpen(true);
                    }}
                    className="w-full bg-gg-signal px-8 py-4 text-left font-hand text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-gg-paper transition-colors duration-200 hover:bg-gg-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gg-cobalt"
                  >
                    {C.cta.label}
                  </button>
                  <ul className="mt-4 space-y-1">
                    {C.cta.reassurance.map((line) => (
                      <li
                        key={line}
                        className="font-hand text-[0.78rem] text-gg-ink/55"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* The plate, registered to the right columns and captioned. */}
            <figure className="lg:col-span-5">
              <div className="border border-gg-rule bg-gg-paper-deep/40 p-6">
                <TangleHead
                  hand="plot"
                  profileColor="var(--color-gg-ink)"
                  tangleColor="var(--color-gg-signal)"
                  threadColor="var(--color-gg-cobalt)"
                  compass={false}
                  className="w-full"
                />
              </div>
              <figcaption className="mt-3 flex justify-between font-hand text-[0.72rem] uppercase tracking-[0.16em] text-gg-ink/55">
                <span>{C.figure}</span>
                <span>01</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
