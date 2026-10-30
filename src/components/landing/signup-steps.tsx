import { WaitlistButton } from "./waitlist-button";

const steps = [
  {
    number: "01",
    title: "Join the waitlist.",
    description: "Share your name, email, and phone to get launch updates.",
  },
  {
    number: "02",
    title: "Get your invitation.",
    description:
      "We'll let you know when access opens so you can decide whether to join.",
  },
  {
    number: "03",
    title: "Begin with your intention.",
    description:
      "When you enroll, share what you want to create and start receiving your texts.",
  },
];

// How joining works, kept apart from the product itself: today's step is the
// waitlist form, and the daily texts only begin after someone enrolls at
// launch. The mid-page ask follows; its analytics location stays 'intro' so
// existing reporting keeps working.
export function SignupSteps() {
  return (
    <section
      id="section-signup-steps"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink text-balance mb-6">
          Your next chapter starts here.
        </h2>
        <ol className="divide-y divide-rule border-y border-rule">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4 py-5">
              <span className="font-serif italic text-cobalt text-xl w-7 shrink-0 leading-snug">
                {step.number}
              </span>
              <div>
                <h3 className="font-serif text-xl text-ink leading-snug">
                  {step.title}
                </h3>
                <p className="mt-1 text-base text-muted font-sans leading-normal">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 text-center">
          <WaitlistButton location="intro" />
          <p className="text-sm text-muted mt-3 font-sans text-balance">
            Free to join. Your daily texts begin only when you enroll.
          </p>
        </div>
      </div>
    </section>
  );
}
