"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { LUNAR_CYCLE, MoonPhase } from "./mystic-glyphs";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Ephemeris — celestial and astrological, contemporary luxe, luminous.
 *
 * The lunar cycle is the structure, not the decoration: eight phases run as the
 * cadence rail at the foot, which is what a daily practice actually is. Dawn
 * ground, opal and blush, everything emitting rather than reflecting.
 */
export function EphemerisHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-ep-dawn px-6 py-20">
        {/* Iridescence: three offset fields, never a single centred glow. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[10%] -top-[18%] h-[62vw] w-[62vw] rounded-full bg-ep-blush/45 blur-[130px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[14%] top-[6%] h-[54vw] w-[54vw] rounded-full bg-ep-opal/45 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-22%] left-[24%] h-[48vw] w-[48vw] rounded-full bg-ep-sky/25 blur-[140px]"
        />

        <div className="relative mx-auto w-full max-w-5xl">
          <p className="text-center font-hand text-[0.64rem] uppercase tracking-[0.42em] text-ep-ink/50">
            {C.eyebrow.brand}
            <span className="mx-3">◦</span>
            {C.eyebrow.status}
          </p>

          <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1fr_0.82fr]">
            <div>
              <h1 className="font-plate text-[2.6rem] leading-[1.1] tracking-[0.01em] text-ep-ink sm:text-[3.4rem] lg:text-[4.1rem]">
                {C.headline.lead}
                <span className="mt-2 block text-ep-sky">{C.headline.turn}</span>
              </h1>

              <p className="mt-8 max-w-[44ch] font-hand text-[1.02rem] leading-[1.85] text-ep-ink/65">
                {C.subhead}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    analytics.leadFormOpen("hero");
                    setOpen(true);
                  }}
                  className="rounded-full bg-ep-ink px-10 py-4 font-hand text-[0.94rem] tracking-wide text-ep-dawn transition-colors duration-300 hover:bg-ep-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ep-sky"
                >
                  {C.cta.label}
                </button>
                <p className="max-w-[17rem] font-hand text-[0.8rem] leading-relaxed text-ep-ink/45">
                  {C.cta.reassurance.join(" ")}
                </p>
              </div>
            </div>

            {/* The head inside its orbit. */}
            <figure className="relative">
              <div
                aria-hidden
                className="absolute inset-[-8%] rounded-full border border-ep-ink/12"
              />
              <div
                aria-hidden
                className="absolute inset-[4%] rounded-full border border-dashed border-ep-ink/10"
              />
              <TangleHead
                hand="aura"
                profileColor="var(--color-ep-ink)"
                tangleColor="var(--color-ep-blush)"
                threadColor="var(--color-ep-sky)"
                compassColor="var(--color-ep-opal)"
                className="relative w-full"
              />
              <figcaption className="mt-3 text-center font-plate text-[0.9rem] italic text-ep-ink/40">
                {C.figure}
              </figcaption>
            </figure>
          </div>

          {/* The cadence rail: one message, every day, across a cycle. */}
          <div className="mt-16 border-t border-ep-ink/12 pt-7">
            <div className="flex items-center justify-between gap-2">
              {LUNAR_CYCLE.map((p) => (
                <MoonPhase
                  key={p}
                  phase={p}
                  size={26}
                  lit="var(--color-ep-ink)"
                  dark="var(--color-ep-dawn)"
                  ring="var(--color-ep-ink)"
                />
              ))}
            </div>
            <p className="mt-4 text-center font-hand text-[0.72rem] uppercase tracking-[0.28em] text-ep-ink/40">
              A message a day, through every phase
            </p>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
