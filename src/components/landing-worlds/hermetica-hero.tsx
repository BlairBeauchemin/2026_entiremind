"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { ElementSigil, type Element } from "./mystic-glyphs";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/** The four elements, cut down the margin of the tablet like a rubric. */
const MARGIN_SIGILS: { element: Element; label: string }[] = [
  { element: "fire", label: "Solve" },
  { element: "water", label: "Coagula" },
  { element: "air", label: "Spiritus" },
  { element: "earth", label: "Corpus" },
];

/**
 * Hermetica — ancient mystery school, dark and jewel-like, carved.
 *
 * A stone tablet rather than a page: gold inlaid into cut stone, a rubric of
 * alchemical sigils down the left margin, and the profile etched rather than
 * drawn. Reads as lineage and initiation rather than as a product launch.
 */
export function HermeticaHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-hm-stone-deep px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[74rem]">
          <div className="relative border border-hm-gold/30 bg-hm-stone p-1.5">
            {/* Inner bevel: the cut edge of the stone, lit from above. */}
            <div className="border border-hm-gold/15 bg-hm-stone-raised/40 px-5 py-12 sm:px-12 sm:py-16">
              <div className="grid gap-10 lg:grid-cols-[auto_1fr_0.85fr] lg:gap-12">
                {/* The rubric. */}
                <ul className="flex gap-8 lg:flex-col lg:gap-10">
                  {MARGIN_SIGILS.map((s) => (
                    <li key={s.label} className="text-center">
                      <ElementSigil
                        element={s.element}
                        className="mx-auto h-6 w-6"
                        stroke="var(--color-hm-gold)"
                      />
                      <p className="mt-2 font-plate text-[0.56rem] uppercase tracking-[0.2em] text-hm-bone/45">
                        {s.label}
                      </p>
                    </li>
                  ))}
                </ul>

                <div>
                  <p className="font-plate text-[0.62rem] uppercase tracking-[0.42em] text-hm-gold">
                    {C.eyebrow.brand}
                  </p>

                  <h1 className="mt-7 font-plate text-[2rem] uppercase leading-[1.24] tracking-[0.05em] text-hm-bone sm:text-[2.7rem] lg:text-[3rem]">
                    {C.headline.lead}
                    <span className="mt-3 block text-hm-gold-bright">
                      {C.headline.turn}
                    </span>
                  </h1>

                  {/* Inlaid rule: gold run into a cut groove. */}
                  <div
                    aria-hidden
                    className="mt-8 h-px w-28 bg-gradient-to-r from-hm-gold to-transparent"
                  />

                  <p className="mt-8 max-w-[44ch] font-hand text-[0.98rem] leading-[1.9] text-hm-bone/70">
                    {C.subhead}
                  </p>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        analytics.leadFormOpen("hero");
                        setOpen(true);
                      }}
                      className="border border-hm-gold/70 px-10 py-4 font-plate text-[0.76rem] uppercase tracking-[0.28em] text-hm-gold-bright transition-colors duration-500 hover:bg-hm-gold hover:text-hm-stone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hm-lapis"
                    >
                      {C.cta.label}
                    </button>
                    <p className="max-w-[16rem] font-hand text-[0.76rem] leading-relaxed text-hm-bone/40">
                      {C.cta.reassurance.join(" ")}
                    </p>
                  </div>
                </div>

                <figure>
                  <TangleHead
                    hand="etched"
                    profileColor="var(--color-hm-bone)"
                    tangleColor="var(--color-hm-gold)"
                    threadColor="var(--color-hm-lapis)"
                    compassColor="var(--color-hm-gold)"
                    className="w-full"
                  />
                  <figcaption className="mt-3 text-center font-plate text-[0.8rem] uppercase tracking-[0.18em] text-hm-bone/35">
                    {C.figure}
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
