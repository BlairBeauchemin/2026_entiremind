"use client";

import { WaitlistModalSingle } from "./waitlist-modal-single";
import { WaitlistModal as WaitlistModalTwoStep } from "./waitlist-modal-two-step";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Waitlist Modal Switcher
 *
 * Controls which modal version is rendered based on the
 * NEXT_PUBLIC_WAITLIST_MODAL_VERSION environment variable.
 *
 * - "single" (default): Single-screen modal with optional consent checkboxes
 *   (used during Twilio A2P 10DLC approval)
 * - "two-step": Two-step modal with required consent checkboxes
 *   (restore after Twilio approval)
 */
export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const modalVersion =
    process.env.NEXT_PUBLIC_WAITLIST_MODAL_VERSION || "single";

  if (modalVersion === "two-step") {
    return <WaitlistModalTwoStep isOpen={isOpen} onClose={onClose} />;
  }

  return <WaitlistModalSingle isOpen={isOpen} onClose={onClose} />;
}
