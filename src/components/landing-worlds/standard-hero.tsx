"use client";

import { useState } from "react";
import { TangleHead } from "./tangle-head";
import { LANDING_COPY as C } from "./copy";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { analytics } from "@/lib/analytics";

/**
 * The category standard, played straight — the control in the spread.
 *
 * This is the wellness-landing arrangement the other three worlds refuse:
 * cream ground, high-contrast serif display, soft lilac and sage wash,
 * centred column, generous air, pill button. Executed at full craft and
 * without irony, because a dishonest control teaches nothing. It deliberately
 * uses the site's incumbent faces, since those are what the category ships.
 */
export function StandardHero() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen overflow-hidden bg-cs-cream px-6 py-20 sm:py-28">
        {/* The ambient wash this category always reaches for. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[15%] -top-[20%] h-[55vw] w-[55vw] rounded-full bg-cs-lilac/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[25%] -right-[12%] h-[48vw] w-[48vw] rounded-full bg-cs-sage/20 blur-[110px]"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-hand text-[0.7rem] uppercase tracking-[0.3em] text-cs-ink/50">
            {C.eyebrow.brand} · {C.eyebrow.status}
          </p>

          <h1 className="mt-8 font-plate text-[2.7rem] font-medium leading-[1.1] text-cs-ink sm:text-6xl lg:text-[4.2rem]">
            {C.headline.lead}{" "}
            <em className="not-italic text-cs-ink/70">{C.headline.turn}</em>
          </h1>

          <p className="mx-auto mt-7 max-w-[52ch] font-hand text-[1.06rem] font-light leading-[1.8] text-cs-ink/70">
            {C.subhead}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                analytics.leadFormOpen("hero");
                setOpen(true);
              }}
              className="rounded-full bg-cs-ink px-10 py-4 font-hand text-[1rem] text-cs-cream shadow-lg shadow-cs-ink/10 transition-all duration-300 hover:shadow-xl hover:shadow-cs-ink/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cs-ink"
            >
              {C.cta.label}
            </button>
            <p className="font-hand text-[0.82rem] text-cs-ink/45">
              {C.cta.reassurance.join(" ")}
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-[26rem]">
            <TangleHead
              hand="ink"
              profileColor="var(--color-cs-ink)"
              tangleColor="var(--color-cs-lilac)"
              threadColor="var(--color-cs-gold)"
              compassColor="var(--color-cs-sage)"
              className="w-full"
            />
            <p className="mt-4 font-plate text-[0.9rem] italic text-cs-ink/45">
              {C.figure}
            </p>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
