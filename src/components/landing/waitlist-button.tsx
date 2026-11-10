"use client";

import { type CtaLocation } from "@/lib/analytics";
import { useWaitlistAsk } from "./signup-variant";

/**
 * The mid-page "Join the waitlist" button. Under the "form" variant it brings
 * the visitor to the next waitlist form on the page; under "modal" it opens
 * the email-only pop-up. (See signup-variant.tsx.)
 */
export function WaitlistButton({ location }: { location: CtaLocation }) {
  const { ask, modal } = useWaitlistAsk(location);

  return (
    <>
      <button
        type="button"
        onClick={ask}
        className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
      >
        Join the waitlist
      </button>
      {modal}
    </>
  );
}
