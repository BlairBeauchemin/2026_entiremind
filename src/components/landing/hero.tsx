"use client";

import { motion } from "framer-motion";
import { HeroScene } from "./hero-scene";
import { heroInter } from "./hero-font";
import { EmailWaitlistForm } from "./email-waitlist-form";
import { useWaitlistAsk } from "./signup-variant";

// The prints, board and phone drift gently. Off under reduced motion.
const HERO_MOTION = ["float-strong"] as const;

export function Hero() {
  const { variant, ask, modal } = useWaitlistAsk("hero");

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-32 pb-flow lg:pt-56 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-12 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="relative z-10 text-center lg:text-left animate-fade-in-up">
            <h1 className="font-serif text-display text-ink text-balance">
              Manifest your best life.
            </h1>

            <p className="mt-5 lg:mt-8 text-xl text-ink max-w-lg mx-auto lg:mx-0 font-light leading-normal lg:leading-relaxed font-sans text-balance">
              Lightly magical texts that weave inspiration into your day and
              help turn your intentions into reality.
            </p>

            {/* The ask. "form": first name + email right here, centred under
                the copy on phones and left-aligned with it from lg. "modal":
                the button that opens the email-only pop-up. Either way the
                spot is #join, where other pages send the visitor. */}
            {variant === "form" ? (
              <div className="mt-8 lg:mt-10 max-w-md mx-auto lg:mx-0 lg:max-w-lg text-center lg:text-left">
                <EmailWaitlistForm
                  id="join"
                  location="hero"
                  note="Free to join. Get an invitation when access opens."
                />
              </div>
            ) : (
              <div id="join" className="mt-8 lg:mt-10 scroll-mt-32">
                <button
                  type="button"
                  onClick={ask}
                  className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
                >
                  Join the waitlist
                </button>
                <p className="text-sm text-muted mt-3 font-sans">
                  Free to join. Get an invitation when access opens.
                </p>
              </div>
            )}
          </div>

          {/* Hero visual: the Messages phone with the "My vision" board and
              prints spilling out around it (HeroScene, layout "spill"). The
              scene canvas carries empty margins for ad crops; the negative
              margins trim them here so the phone fills the column. Mobile
              trims harder (about 20% larger) and centres the scene's content,
              which keeps it inside a 390px screen. Everything in it is
              transparent over the linen page. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            // The negative bottom margin absorbs the transparent margin under
            // the phone, so the gap to the next section looks like the rest.
            // Below lg it sits under the copy and CTA at the same size as
            // before, capped at phone width so tablets and landscape phones
            // don't blow the scene up; from lg it returns to its column
            // beside the copy.
            className={`relative w-full max-w-md mx-auto -mb-4 lg:-mb-6 lg:max-w-none ${heroInter.variable}`}
          >
            <div className="-mt-[11%] -mb-[9%] -ml-[17%] -mr-[20%] lg:-mx-[7%] lg:-mt-[8%] lg:-mb-[6%]">
              <HeroScene layout="spill" motion={HERO_MOTION} />
            </div>
          </motion.div>
        </div>
      </header>
      {modal}
    </>
  );
}
