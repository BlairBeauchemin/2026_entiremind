"use client";

import { useState } from "react";
import { WaitlistModal } from "./waitlist-modal";

export function BottomCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="py-24 bg-navy relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-800/30 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-900/20 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl text-cream mb-6 font-medium">
            Ready to Transform Your Intentions?
          </h2>
          <p className="text-lg text-teal-100/80 mb-10 font-sans font-light">
            Join the waitlist to be first when we launch.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-cream text-navy px-10 py-4 rounded-full text-lg font-medium hover:bg-cream/90 hover:shadow-lg hover:shadow-cream/10 transition-all duration-300 font-sans"
          >
            Join the Waitlist
          </button>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
