"use client";

import { useState } from "react";
import { WaitlistModal } from "./waitlist-modal";
import { analytics, type CtaLocation } from "@/lib/analytics";

/** The primary "Join waitlist" button, for sections that are otherwise static. */
export function WaitlistButton({ location }: { location: CtaLocation }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    analytics.leadFormOpen(location);
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
      >
        Join waitlist
      </button>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
