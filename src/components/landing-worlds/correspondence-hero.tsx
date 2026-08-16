"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Correspondence — grounded and lightly magical, and the most intimate of the set.
 *
 * The surface is a letter, which is the sharpest available answer to "apps that
 * gather dust": a letter is not an app, and nobody abandons one in week three.
 * Premium comes from paper craft — deckle, airmail border, postmark, a second
 * hand in the margin — rather than from restraint.
 */
export function CorrespondenceHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-cr-paper-deep px-4 py-12 sm:px-8 sm:py-16">
        <div className="relative mx-auto max-w-5xl">
          {/* Airmail border: the chevron edge that says this travelled to reach you. */}
          <div
            aria-hidden
            className="absolute inset-0 -m-[10px] opacity-90"
            style={{
              background:
                "repeating-linear-gradient(45deg, var(--color-cr-stamp) 0 12px, var(--color-cr-paper-pale) 12px 24px, var(--color-cr-airmail) 24px 36px, var(--color-cr-paper-pale) 36px 48px)",
            }}
          />

          <div className="relative bg-cr-paper-pale px-6 py-12 sm:px-14 sm:py-16">
            <header className="flex items-start justify-between gap-6 border-b border-cr-ink/12 pb-6">
              <p className="font-hand text-[0.68rem] uppercase tracking-[0.26em] text-cr-ink/60">
                {C.eyebrow.brand}
              </p>
              {/* Postmark: struck, slightly off-square, never a logo lockup. */}
              <div className="-rotate-6 border-2 border-cr-stamp/55 px-3 py-1.5 text-center">
                <p className="font-hand text-[0.56rem] uppercase leading-tight tracking-[0.16em] text-cr-stamp/85">
                  {C.eyebrow.status}
                </p>
              </div>
            </header>

            <div className="grid gap-10 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div>
                <h1 className="font-plate text-[2.2rem] leading-[1.16] text-cr-ink sm:text-[3rem] lg:text-[3.5rem]">
                  {C.headline.lead}
                  <span className="mt-1 block text-cr-ink-blue">
                    {C.headline.turn}
                  </span>
                </h1>

                <p className="mt-8 max-w-[46ch] font-hand text-[1.02rem] leading-[1.85] text-cr-ink/80">
                  {C.subhead}
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      analytics.leadFormOpen("hero");
                      setOpen(true);
                    }}
                    className="bg-cr-ink-blue px-9 py-4 font-hand text-[0.92rem] text-cr-paper-pale transition-colors duration-300 hover:bg-cr-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cr-stamp"
                  >
                    {C.cta.label}
                  </button>
                  <p className="max-w-[18rem] font-hand text-[0.8rem] leading-relaxed text-cr-ink/50">
                    {C.cta.reassurance.join(" ")}
                  </p>
                </div>
              </div>

              <figure className="relative">
                <TangleHead
                  hand="penned"
                  profileColor="var(--color-cr-ink)"
                  tangleColor="var(--color-cr-ink-blue)"
                  threadColor="var(--color-cr-stamp)"
                  compass={false}
                  className="w-full"
                />
                {/* The margin note, in the second hand a letter always has. */}
                <figcaption className="mt-2 -rotate-2 text-right font-plate text-[0.95rem] italic text-cr-ink/45">
                  {C.figure}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
