"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { WaitlistModal } from "@/components/landing/waitlist-modal";
import { SacredGeometryVisual } from "./sacred-geometry-visual";

export function SacredHero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 z-10 overflow-hidden"
      >
        {/* Subtle geometric background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%23204147' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 space-y-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface border border-rule text-ink text-[11px] font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cobalt animate-pulse" />
              Now accepting early signals
            </div>

            <h1 className="font-serif text-display text-ink text-balance">
              Manifestation at the <br />
              <span className="font-medium">speed of thought.</span>
            </h1>

            <p className="text-lg lg:text-xl text-ink max-w-lg mx-auto lg:mx-0 font-light leading-relaxed font-sans tracking-wide">
              A lightly magical SMS companion that aligns your intentions with
              reality. No apps to open, no dashboards to manage—just signals to
              send.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
              >
                Reserve My Spot
              </button>
            </div>

            {/* There is no social proof here on purpose. This slot held
                "Join 2,000+ others aligning intentions." beside three
                i.pravatar.cc stock avatars. There are zero users; both the
                number and the faces were invented, which fails the
                trusted-friend test in docs/design-philosophy.md. Real proof
                goes here when it exists, and not before. */}
          </motion.div>

          {/* Hero Visual - Phone with Sacred Geometry */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative lg:h-[700px] flex items-center justify-center"
          >
            {/* Sacred Geometry behind phone */}
            <div className="absolute inset-0 flex items-center justify-center">
              <SacredGeometryVisual size={600} className="opacity-80" />
            </div>

            {/* Ambient glow effects */}

            {/* Phone mockup */}
            <div className="relative z-10">
              <PhoneMockup />
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
