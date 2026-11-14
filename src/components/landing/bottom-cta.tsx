"use client";

import { EmailWaitlistForm } from "./email-waitlist-form";
import { useWaitlistAsk } from "./signup-variant";

const NOTE = "Free to join. Launch updates by email. Unsubscribe anytime.";

// The final ask, on cobalt. "form": the second on-page form (the hero holds
// the first), so someone who has read the whole page can join where they
// are. "modal": a button that opens the email-only pop-up.
export function BottomCTA() {
  const { variant, ask, modal } = useWaitlistAsk("bottom_cta");

  return (
    <section className="py-section bg-cobalt relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-serif text-heading text-linen text-balance">
          Your next chapter starts with a text
        </h2>
        <p className="mt-6 text-lg text-linen font-sans leading-relaxed text-balance">
          Join the waitlist and get an invitation when Entiremind opens.
        </p>
        {variant === "form" ? (
          // A linen panel on the cobalt band, holding the same light form
          // as the hero: cream fields and the cobalt button.
          <div className="mt-8 max-w-lg mx-auto bg-linen rounded-sm p-6 sm:p-8">
            <EmailWaitlistForm location="bottom_cta" stacked note={NOTE} />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={ask}
              className="mt-8 bg-linen text-cobalt-deep px-10 py-4 rounded-sm text-lg font-medium hover:bg-surface transition-all duration-300 font-sans"
            >
              Join the waitlist
            </button>
            <p className="text-sm text-linen/85 mt-3 font-sans">{NOTE}</p>
          </>
        )}
      </div>
      {modal}
    </section>
  );
}
