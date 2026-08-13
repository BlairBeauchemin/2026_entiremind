"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * Embroidery sampler. The page is a worked cloth: a ruled linen ground, a
 * band of cross-stitch at the border, and the drawing rendered in floss
 * rather than ink. The sampler's own conventions — the alphabet row, the
 * maker's line at the foot — carry the structure.
 */
export function EmbroideryHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-em-linen px-4 py-10 sm:px-8 sm:py-14">
        {/* The weave. Two crossed thread directions, not a texture image. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 3px, rgba(61,50,37,0.07) 3px 4px), repeating-linear-gradient(90deg, transparent 0 3px, rgba(61,50,37,0.055) 3px 4px)",
          }}
        />

        <div className="relative mx-auto max-w-[74rem] border-[3px] border-em-thread-dark/25 bg-em-linen-pale/45 px-5 py-10 sm:px-12 sm:py-14">
          <StitchBand />

          <p className="mt-8 text-center font-hand text-[0.66rem] uppercase tracking-[0.4em] text-em-thread-dark/70">
            {C.eyebrow.brand}
            <span className="mx-3 text-em-madder">✕</span>
            {C.eyebrow.status}
          </p>

          <h1 className="mx-auto mt-7 max-w-[24ch] text-center font-plate text-[2.3rem] leading-[1.08] text-em-thread-dark sm:text-[3.4rem] lg:text-[4rem]">
            {C.headline.lead}
            <span className="mt-1 block text-em-madder">{C.headline.turn}</span>
          </h1>

          <div className="mx-auto mt-9 max-w-[30rem]">
            <TangleHead
              hand="stitch"
              profileColor="var(--color-em-indigo)"
              tangleColor="var(--color-em-madder)"
              threadColor="var(--color-em-saffron)"
              compassColor="var(--color-em-sage)"
              className="w-full"
            />
          </div>

          <p className="mx-auto mt-8 max-w-[46ch] text-center font-hand text-[1rem] leading-[1.75] text-em-thread-dark/85">
            {C.subhead}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                analytics.leadFormOpen("hero");
                setOpen(true);
              }}
              className="border-[3px] border-dashed border-em-thread-dark/50 bg-em-madder px-10 py-4 font-hand text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-em-linen-pale transition-colors duration-300 hover:bg-em-thread-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-em-indigo"
            >
              {C.cta.label}
            </button>
            <p className="text-center font-hand text-[0.8rem] text-em-thread-dark/60">
              {C.cta.reassurance.join(" ")}
            </p>
          </div>

          {/* The sampler's maker line, worked at the foot of the cloth. */}
          <p className="mt-10 text-center font-plate text-[0.85rem] italic text-em-thread-dark/55">
            {C.figure}
          </p>

          <StitchBand className="mt-8 rotate-180" />
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** A worked border: the cross-stitch band a sampler opens and closes with. */
function StitchBand({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex justify-center gap-2 ${className}`}>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="text-[0.7rem] leading-none"
          style={{
            color: [
              "var(--color-em-madder)",
              "var(--color-em-indigo)",
              "var(--color-em-sage)",
              "var(--color-em-saffron)",
            ][i % 4],
          }}
        >
          ✕
        </span>
      ))}
    </div>
  );
}
