"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

export function NotationHero() {
  const [open, setOpen] = useState(false);

  const openWaitlist = () => {
    analytics.leadFormOpen("hero");
    setOpen(true);
  };

  return (
    <>
      <section className="relative px-5 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-12 lg:pb-24">
        {/* The plate: a ruled field the drawing and the text both sit on. */}
        <div className="relative mx-auto max-w-[86rem] border border-nt-gold/25 bg-nt-plate px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          {/* Compass marks at the plate corners, struck by hand before printing. */}
          <PlateCorner className="left-3 top-3" />
          <PlateCorner className="right-3 top-3 rotate-90" />
          <PlateCorner className="bottom-3 left-3 -rotate-90" />
          <PlateCorner className="bottom-3 right-3 rotate-180" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            {/* On a phone the drawing is the ground the text sits on, so the
                thesis is present in the first viewport rather than a scroll
                away. From lg it takes its own column at full strength. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-[6%] -top-[7%] z-0 w-[80%] opacity-70 lg:hidden"
            >
              <TangleHead className="w-full" />
            </div>

            <div className="relative z-10">
              <p className="font-hand text-[0.68rem] uppercase tracking-[0.32em] text-nt-gold">
                {C.eyebrow.brand}
                <span className="mx-3 text-nt-gold/40">·</span>
                <span className="text-nt-vellum/55">{C.eyebrow.status}</span>
              </p>

              <h1 className="mt-8 font-plate text-[2.6rem] font-medium leading-[1.02] tracking-[-0.015em] text-nt-vellum sm:text-6xl lg:text-[4.4rem]">
                {C.headline.lead}
                <span className="block text-nt-gold-pale">
                  {C.headline.turn}
                </span>
              </h1>

              {/* The annotating second hand, set in the margin. */}
              <p className="mt-7 max-w-[34rem] font-hand text-[1.02rem] leading-[1.7] text-nt-vellum/75">
                {C.subhead}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={openWaitlist}
                  className="group inline-flex items-center justify-center gap-3 bg-nt-vermilion px-8 py-4 font-hand text-[0.95rem] font-medium tracking-wide text-nt-vellum transition-colors duration-300 hover:bg-nt-vermilion-bright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nt-gold"
                >
                  {C.cta.label}
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>

                <p className="font-hand text-[0.82rem] leading-relaxed text-nt-vellum/50">
                  {C.cta.reassurance[0]}
                  <br className="hidden sm:block" /> {C.cta.reassurance[1]}
                </p>
              </div>
            </div>

            <div className="relative z-10 hidden lg:block">
              <TangleHead className="w-full" />

              {/* Plate caption, in the hand that annotates rather than states. */}
              <p className="absolute -bottom-4 right-0 font-plate text-[0.9rem] italic text-nt-gold/70">
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

function PlateCorner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-4 w-4 border-l border-t border-nt-gold/35 ${className}`}
    />
  );
}
