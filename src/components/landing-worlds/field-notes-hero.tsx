"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Field Notes — quietly evidence-based, still warm.
 *
 * What the Geigy world would be if it liked you: the same rigour, the same
 * ruled sheet, but the rules are softened and a second hand annotates in the
 * margin. Observation rather than diagnosis. The specimen here is a thought.
 */
export function FieldNotesHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-fn-paper px-5 py-10 sm:px-10 sm:py-14">
        {/* Ruled sheet. Faint, warm, and never reaching the edges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 31px, var(--color-fn-rule) 31px 32px)",
            maskImage:
              "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-[78rem]">
          <div className="flex items-baseline justify-between border-b border-fn-ink/25 pb-3">
            <p className="font-hand text-[0.7rem] uppercase tracking-[0.22em] text-fn-ink">
              {C.eyebrow.brand}
            </p>
            <p className="font-plate text-[0.92rem] italic text-fn-annotate">
              {C.eyebrow.status}
            </p>
          </div>

          <div className="grid gap-12 pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <figure className="order-2 lg:order-1">
              <div className="border border-fn-ink/20 bg-fn-paper-deep/35 p-8">
                <TangleHead
                  hand="penned"
                  profileColor="var(--color-fn-ink)"
                  tangleColor="var(--color-fn-annotate)"
                  threadColor="var(--color-fn-specimen)"
                  compassColor="var(--color-fn-rule)"
                  className="w-full"
                />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between">
                <span className="font-hand text-[0.72rem] uppercase tracking-[0.16em] text-fn-ink/55">
                  Specimen i
                </span>
                {/* The margin hand: what a person wrote next to the plate. */}
                <span className="-rotate-1 font-plate text-[0.95rem] italic text-fn-annotate/80">
                  {C.figure}
                </span>
              </figcaption>
            </figure>

            <div className="order-1 lg:order-2">
              <h1 className="font-plate text-[2.4rem] leading-[1.1] text-fn-ink sm:text-[3.2rem] lg:text-[3.9rem]">
                {C.headline.lead}
                <span className="block text-fn-specimen">{C.headline.turn}</span>
              </h1>

              <p className="mt-8 max-w-[46ch] font-hand text-[1rem] leading-[1.85] text-fn-ink/80">
                {C.subhead}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    analytics.leadFormOpen("hero");
                    setOpen(true);
                  }}
                  className="border-b-2 border-fn-annotate bg-fn-annotate px-9 py-4 font-hand text-[0.92rem] text-fn-paper transition-colors duration-300 hover:bg-fn-ink hover:border-fn-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fn-specimen"
                >
                  {C.cta.label}
                </button>
                <p className="max-w-[17rem] font-hand text-[0.8rem] leading-relaxed text-fn-ink/55">
                  {C.cta.reassurance.join(" ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
