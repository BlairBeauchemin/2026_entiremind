"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/** Concentric aura bands — the field the thought sits inside. */
const AURA_BANDS = [
  { r: 46, color: "var(--color-rs-aura-warm)", opacity: 0.16 },
  { r: 38, color: "var(--color-rs-aura-deep)", opacity: 0.14 },
  { r: 30, color: "var(--color-rs-aura-cool)", opacity: 0.16 },
  { r: 22, color: "var(--color-rs-halo)", opacity: 0.3 },
];

/**
 * Resonance — sacred geometry and energy, timeless, luminous.
 *
 * Radial rather than gridded: the composition is a mandala with the thought at
 * its centre, aura bands emanating outward, and the six-fold construction of
 * the flower of life ruling the field behind it. Light is the material.
 */
export function ResonanceHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rs-light px-6 py-20">
        {/* Flower-of-life construction: six circles about a seventh. */}
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[125vh] w-[125vh] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={100 + Math.cos(rad) * 26}
                cy={100 + Math.sin(rad) * 26}
                r="26"
                fill="none"
                stroke="var(--color-rs-ink)"
                strokeWidth="0.3"
              />
            );
          })}
          <circle
            cx="100"
            cy="100"
            r="26"
            fill="none"
            stroke="var(--color-rs-ink)"
            strokeWidth="0.3"
          />
        </svg>

        {/* The aura field, emanating from where the head sits. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[105vh] w-[105vh] -translate-x-1/2 -translate-y-1/2"
        >
          {AURA_BANDS.map((b) => (
            <circle
              key={b.r}
              cx="50"
              cy="50"
              r={b.r}
              fill={b.color}
              opacity={b.opacity}
              style={{ filter: "blur(6px)" }}
            />
          ))}
        </svg>

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="font-hand text-[0.62rem] uppercase tracking-[0.45em] text-rs-ink/45">
            {C.eyebrow.brand}
          </p>

          <div className="mx-auto mt-8 max-w-[19rem]">
            <TangleHead
              hand="aura"
              profileColor="var(--color-rs-ink)"
              tangleColor="var(--color-rs-aura-warm)"
              threadColor="var(--color-rs-aura-cool)"
              compassColor="var(--color-rs-aura-deep)"
              className="w-full"
            />
          </div>

          <h1 className="mt-9 font-plate text-[2.2rem] uppercase leading-[1.22] tracking-[0.06em] text-rs-ink sm:text-[2.9rem] lg:text-[3.2rem]">
            {C.headline.lead}
            <span className="mt-2 block text-rs-aura-warm">
              {C.headline.turn}
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-[42ch] font-hand text-[1rem] leading-[1.9] text-rs-ink/65">
            {C.subhead}
          </p>

          <div className="mt-11 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                analytics.leadFormOpen("hero");
                setOpen(true);
              }}
              className="rounded-full border border-rs-ink/25 px-11 py-4 font-hand text-[0.8rem] uppercase tracking-[0.26em] text-rs-ink transition-colors duration-500 hover:bg-rs-ink hover:text-rs-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rs-aura-cool"
            >
              {C.cta.label}
            </button>
            <p className="font-hand text-[0.78rem] text-rs-ink/40">
              {C.cta.reassurance.join(" ")}
            </p>
          </div>

          <p className="mt-10 font-plate text-[0.88rem] italic text-rs-ink/35">
            {C.figure}
          </p>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
