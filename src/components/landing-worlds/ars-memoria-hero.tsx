"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { ARCHETYPE_SUIT, ElementSigil } from "./mystic-glyphs";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Ars Memoria — tarot and esoteric publishing, 1970s revival, dark and jewel-like.
 *
 * The hero is not a page with a card on it; the hero *is* the card. Double rule
 * border, roman numeral at the head, title plate at the foot, and the product's
 * four existing archetypes running beneath as the suit they already are.
 */
export function ArsMemoriaHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-ar-night-deep px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
            {/* The card itself. */}
            <div className="relative mx-auto w-full max-w-[26rem] border-2 border-ar-gold/70 bg-ar-night p-2.5">
              <div className="border border-ar-gold/40 px-6 py-8">
                <p className="text-center font-plate text-[0.95rem] tracking-[0.4em] text-ar-gold">
                  ✦
                </p>

                <TangleHead
                  hand="gilded"
                  profileColor="var(--color-ar-parch)"
                  tangleColor="var(--color-ar-wine)"
                  threadColor="var(--color-ar-gold-bright)"
                  compassColor="var(--color-ar-verd)"
                  className="mt-3 w-full"
                />

                <div className="mt-4 border-t border-ar-gold/35 pt-4">
                  <p className="text-center font-plate text-[1.05rem] uppercase tracking-[0.24em] text-ar-gold-bright">
                    The Tangle
                  </p>
                  <p className="mt-1 text-center font-hand text-[0.72rem] italic tracking-wide text-ar-parch/55">
                    {C.figure}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-hand text-[0.66rem] uppercase tracking-[0.36em] text-ar-gold">
                {C.eyebrow.brand}
                <span className="mx-3 text-ar-wine">✧</span>
                {C.eyebrow.status}
              </p>

              <h1 className="mt-7 font-plate text-[2.3rem] uppercase leading-[1.14] tracking-[0.01em] text-ar-parch sm:text-[3rem] lg:text-[3.5rem]">
                {C.headline.lead}
                <span className="mt-2 block text-ar-gold-bright">
                  {C.headline.turn}
                </span>
              </h1>

              <p className="mt-7 max-w-[46ch] font-hand text-[1rem] leading-[1.85] text-ar-parch/75">
                {C.subhead}
              </p>

              {/* The suit: four archetypes the product already assigns. */}
              <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ARCHETYPE_SUIT.map((a) => (
                  <div
                    key={a.name}
                    className="border border-ar-gold/25 bg-ar-night/60 px-3 py-4 text-center"
                  >
                    <ElementSigil
                      element={a.element}
                      className="mx-auto h-5 w-5"
                      stroke="var(--color-ar-gold)"
                    />
                    <p className="mt-2 font-plate text-[0.62rem] uppercase tracking-[0.16em] text-ar-parch/80">
                      {a.name}
                    </p>
                    <p className="font-hand text-[0.6rem] tracking-[0.2em] text-ar-gold/60">
                      {a.numeral}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    analytics.leadFormOpen("hero");
                    setOpen(true);
                  }}
                  className="border border-ar-gold bg-ar-wine px-9 py-4 font-plate text-[0.8rem] uppercase tracking-[0.24em] text-ar-parch transition-colors duration-300 hover:bg-ar-gold hover:text-ar-night focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ar-gold-bright"
                >
                  {C.cta.label}
                </button>
                <p className="max-w-[17rem] font-hand text-[0.78rem] leading-relaxed text-ar-parch/45">
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
