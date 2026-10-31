"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeroScene } from "./hero-scene";
import { heroInter } from "./hero-font";
import { WaitlistModal } from "./waitlist-modal";
import { analytics } from "@/lib/analytics";

// The prints, board and phone drift gently. Off under reduced motion.
const HERO_MOTION = ["float-strong"] as const;

// Preview-only props: the comparison branch stacks two heroes, each with a
// label and its own subhead.
export function Hero({
  subhead = "Lightly magical texts to help you turn your intentions into reality.",
  label,
}: {
  subhead?: string;
  label?: string;
} = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    analytics.leadFormOpen("hero");
    setIsModalOpen(true);
  };

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-32 pb-12 lg:pt-56 lg:pb-24 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-12 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="relative z-10 text-center lg:text-left animate-fade-in-up">
            {label && (
              <p className="mb-6 inline-block bg-cobalt text-linen px-3 py-1.5 text-sm font-sans">
                {label}
              </p>
            )}
            <h1 className="font-serif text-display text-ink text-balance">
              Manifest your best life.
            </h1>

            <p className="mt-5 lg:mt-8 text-lg lg:text-xl text-ink max-w-lg mx-auto lg:mx-0 font-light leading-relaxed font-sans text-balance">
              {subhead}
            </p>

            <div className="mt-8 lg:mt-10">
              <button
                onClick={openModal}
                className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
              >
                Join the waitlist
              </button>
              <p className="text-sm text-muted mt-3 font-sans">
                Free to join. Get an invitation when access opens.
              </p>
            </div>
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
            // Below lg it sits under the copy and CTA at the same size as
            // before, capped at phone width so tablets and landscape phones
            // don't blow the scene up; from lg it returns to its column
            // beside the copy.
            className={`relative w-full max-w-md mx-auto lg:max-w-none ${heroInter.variable}`}
          >
            <div className="-mt-[11%] -mb-[9%] -ml-[17%] -mr-[20%] lg:-mx-[7%] lg:-mt-[8%] lg:-mb-[6%]">
              <HeroScene layout="spill" motion={HERO_MOTION} />
            </div>
          </motion.div>
        </div>
      </header>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
