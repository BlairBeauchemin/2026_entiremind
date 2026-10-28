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
          <h2 className="font-serif text-heading text-linen text-balance">
            Come back to <em className="italic">what you truly want.</em>
          </h2>
          <p className="mt-4 text-lg text-linen font-sans leading-normal text-balance">
            Join the waitlist for an invitation when Entiremind opens.
          </p>
          <button
            onClick={openModal}
            className="mt-8 bg-linen text-cobalt-deep px-10 py-4 rounded-sm text-lg font-medium hover:bg-surface transition-all duration-300 font-sans"
          >
            Join the waitlist
          </button>
          <p className="text-sm text-linen/85 mt-3 font-sans">
            Free to join. Launch updates by email.
          </p>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
