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
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 border border-teal-900/10 text-teal-900 text-[11px] font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-900 animate-pulse" />
              Now accepting early signals
            </div>

            <h1 className="font-serif text-6xl lg:text-8xl leading-[0.95] text-navy font-medium tracking-tight">
              Manifestation at the <br />
              <span className="font-medium">speed of thought.</span>
            </h1>

            <p className="text-lg lg:text-xl text-teal-900 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed font-sans tracking-wide">
              A lightly magical SMS companion that aligns your intentions with
              reality. No apps to open, no dashboards to manage—just signals to
              send.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-10 py-4 rounded-full text-lg font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
              >
                Reserve My Spot
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-sm text-teal-900/70 font-sans font-light">
              <div className="flex -space-x-3 opacity-80">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/150?u=${i}`}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-cream grayscale"
                  />
                ))}
              </div>
              <span>Join 2,000+ others aligning intentions.</span>
            </div>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-em-purple-300/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-em-yellow-400/5 rounded-full blur-[60px] pointer-events-none" />

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
