"use client";

import { useState } from "react";
import { WaitlistModal } from "./waitlist-modal";
import { analytics } from "@/lib/analytics";

export function BottomCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    analytics.leadFormOpen("bottom_cta");
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="py-section bg-cobalt relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif text-display text-linen text-balance mb-6">
            Your intention, <em className="italic">heard</em> every morning.
          </h2>
          <p className="text-lg text-linen/80 mb-10 font-sans font-light">
            First access when we launch. No card, no spam.
          </p>
          <button
            onClick={openModal}
            className="bg-linen text-ink px-10 py-4 rounded-sm text-lg font-medium hover:bg-surface transition-all duration-300 font-sans"
          >
            Join waitlist
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
