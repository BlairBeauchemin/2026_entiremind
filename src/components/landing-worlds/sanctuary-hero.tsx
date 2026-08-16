"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Sanctuary — unapologetically spiritual.
 *
 * Premium by reverence rather than luxury: a dusk ground, gold laid like leaf,
 * and a centred vertical axis that reads as an altar rather than a landing page.
 * Warm because the light is candlelight, not daylight.
 */
export function SanctuaryHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sn-dusk px-6 py-24">
        {/* Candlelight: one warm source low and centred, never an even wash. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[95vh] w-[95vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(216,171,85,0.20) 0%, rgba(216,171,85,0.06) 42%, transparent 68%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="font-hand text-[0.64rem] uppercase tracking-[0.46em] text-sn-gold">
            {C.eyebrow.brand}
          </p>

          {/* The vertical rule: the altar's axis, drawn before anything sits on it. */}
          <div
            aria-hidden
            className="mx-auto mt-7 h-16 w-px bg-gradient-to-b from-transparent via-sn-gold/60 to-transparent"
          />

          <div className="mx-auto mt-6 max-w-[22rem]">
            <TangleHead
              hand="gilded"
              profileColor="var(--color-sn-mist)"
              tangleColor="var(--color-sn-gold)"
              threadColor="var(--color-sn-gold-bright)"
              compassColor="var(--color-sn-rose)"
              className="w-full"
            />
          </div>

          <h1 className="mt-10 font-plate text-[2.4rem] font-normal leading-[1.14] text-sn-mist sm:text-5xl lg:text-[3.6rem]">
            {C.headline.lead}
            <span className="mt-2 block italic text-sn-gold-bright">
              {C.headline.turn}
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-[44ch] font-hand text-[1rem] leading-[1.85] text-sn-mist/70">
            {C.subhead}
          </p>

          <div className="mt-11 flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={() => {
                analytics.leadFormOpen("hero");
                setOpen(true);
              }}
              className="border border-sn-gold/60 px-12 py-4 font-hand text-[0.78rem] uppercase tracking-[0.28em] text-sn-gold-bright transition-colors duration-500 hover:bg-sn-gold/12 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sn-gold"
            >
              {C.cta.label}
            </button>
            <p className="font-hand text-[0.78rem] tracking-wide text-sn-mist/40">
              {C.cta.reassurance.join(" ")}
            </p>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
