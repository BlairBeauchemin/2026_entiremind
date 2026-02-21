"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WaitlistModal } from "@/components/landing/waitlist-modal";

export function SacredCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="py-32 relative overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='none' stroke='%23cbbbe3' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='20' fill='none' stroke='%23cbbbe3' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-em-purple-300/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Decorative top element */}
            <div className="flex justify-center mb-10">
              <svg
                width="60"
                height="30"
                viewBox="0 0 60 30"
                className="text-em-purple-300/40"
                aria-hidden="true"
              >
                <line
                  x1="0"
                  y1="15"
                  x2="25"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <circle cx="30" cy="15" r="4" fill="currentColor" />
                <line
                  x1="35"
                  y1="15"
                  x2="60"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </div>

            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-navy font-medium mb-8 tracking-tight">
              Begin Your Alignment
            </h2>
            <p className="text-xl text-teal-900 mb-12 font-light font-sans max-w-xl mx-auto leading-relaxed tracking-wide">
              Join the waitlist and receive early access to the Entiremind
              experience. Your intentions are waiting.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-navy text-cream px-10 py-4 rounded-full text-lg font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
            >
              Reserve My Spot
            </button>

            {/* Bottom decorative element */}
            <div className="flex justify-center mt-16">
              <svg
                width="120"
                height="40"
                viewBox="0 0 120 40"
                className="text-em-purple-300/20"
                aria-hidden="true"
              >
                <path
                  d="M60 0L90 20L60 40L30 20Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <circle cx="60" cy="20" r="3" fill="currentColor" />
                <line
                  x1="0"
                  y1="20"
                  x2="30"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
                <line
                  x1="90"
                  y1="20"
                  x2="120"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
