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
            Come back to <em className="italic">what you truly want.</em>
          </h2>
          <p className="text-lg text-linen/80 mb-10 font-sans font-light text-balance">
            Be the first to know when we launch. No card, no spam.
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
