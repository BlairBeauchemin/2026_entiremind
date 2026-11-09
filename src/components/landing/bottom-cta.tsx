import { EmailWaitlistForm } from "./email-waitlist-form";

// The final ask, on cobalt: the second on-page form (the hero holds the
// first), so someone who has read the whole page can join where they are.
export function BottomCTA() {
  return (
    <section className="py-section bg-cobalt relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-serif text-heading text-linen text-balance">
          Come back to <em className="italic">what you truly want.</em>
        </h2>
        <p className="mt-6 text-lg text-linen font-sans leading-relaxed text-balance">
          Join the waitlist for an invitation when Entiremind opens.
        </p>
        <div className="mt-8 max-w-lg mx-auto">
          <EmailWaitlistForm
            location="bottom_cta"
            tone="cobalt"
            note="Free to join. Unsubscribe anytime."
          />
        </div>
      </div>
    </section>
  );
}
