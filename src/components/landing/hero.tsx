"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeroScene } from "./hero-scene";
import { heroInter } from "./hero-font";
import { WaitlistModal } from "./waitlist-modal";
import { analytics } from "@/lib/analytics";

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    analytics.leadFormOpen("hero");
    setIsModalOpen(true);
  };

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-12 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="relative z-10 space-y-10 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface border border-rule text-ink text-[11px] font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cobalt animate-pulse" />
              Coming Soon — Join the Waitlist
            </div>

            {/* Emphasis is a mid-sentence italic, never a bolder weight —
                Prata has only one cut, and the italic is the system's most
                characteristic typographic move. */}
            <h1 className="font-serif text-display text-ink text-balance">
              Manifest your best life, <br />
              {/* "at a time" never splits, so a narrow column wraps after
                  "one text" instead of orphaning "time." */}
              <em className="italic">one text at&nbsp;a&nbsp;time.</em>
            </h1>

            {/* mb-7 overrides the column's space-y-10 here only, so the
                waitlist line, button and reassurance read as one group
                under the subhead rather than a separate block. */}
            <p className="text-lg lg:text-xl text-ink max-w-lg mx-auto lg:mx-0 mb-7 font-light leading-relaxed font-sans">
              Lightly magical texts that take you off autopilot and turn your
              intentions into reality.
            </p>

            <div>
              <p className="text-base text-ink mb-3 font-sans text-balance">
                Join the waitlist and be first to know when we launch.
              </p>
              <button
                onClick={openModal}
                className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
              >
                Reserve My Spot
              </button>
              <p className="text-xs text-muted mt-3 font-sans">
                No commitment · No spam · No credit card required
              </p>
            </div>
          </div>

          {/* Hero visual: the Messages phone with the "My vision" board and
              prints spilling out around it (HeroScene, layout "spill"). The
              scene canvas carries empty margins for ad crops; the negative
              margins trim them here so the phone fills the column. Everything
              in it is transparent over the linen page. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`relative ${heroInter.variable}`}
          >
            <div className="-mx-[7%] -mt-[8%] -mb-[6%]">
              <HeroScene layout="spill" />
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
