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
      <section className="py-24 bg-cobalt relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif text-section text-linen mb-6">
            Ready to Transform Your Intentions?
          </h2>
          <p className="text-lg text-linen/80 mb-10 font-sans font-light">
            Join the waitlist to be first when we launch.
          </p>
          <button
            onClick={openModal}
            className="bg-linen text-ink px-10 py-4 rounded-sm text-lg font-medium hover:bg-surface transition-all duration-300 font-sans"
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
