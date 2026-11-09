"use client";

import { analytics, type CtaLocation } from "@/lib/analytics";
import { goToWaitlistForm } from "./waitlist-scroll";

/**
 * The mid-page "Join the waitlist" button. On the email-first page it brings
 * the visitor to the next waitlist form on the page and puts the cursor in
 * it, rather than opening a pop-up. (The pop-up flow approved for A2P 10DLC
 * is kept on the branch `claude/landing-sms-consent-flow`.)
 */
export function WaitlistButton({ location }: { location: CtaLocation }) {
  const onClick = () => {
    analytics.leadFormOpen(location);
    if (!goToWaitlistForm()) window.location.href = "/#join";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
    >
      Join the waitlist
    </button>
  );
}
