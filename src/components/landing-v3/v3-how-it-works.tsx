const STEPS = [
  {
    n: "1",
    title: "Share your intention.",
    body: "Tell us what you want to create and what tends to get in the way.",
  },
  {
    n: "2",
    title: "Receive personalized texts.",
    body: "Get prompts that invite you to reflect, visualize possibilities, and explore your next step.",
  },
  {
    n: "3",
    title: "Bring it into your day.",
    body: "Take a moment with the message, then try a small action connected to your intention.",
  },
];

/**
 * Paper cards on linen. Depth is the change of ground plus a hairline rule —
 * the cobalt band is spent once on the page, in v3-approach, where the gold
 * emblem needs a dark ground to be legal.
 */
export function V3HowItWorks() {
  return (
    <section id="section-how-it-works" className="relative z-10 py-section">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="max-w-[40rem]">
          <h2 className="font-serif text-heading text-balance text-ink">
            A simple practice, <em className="italic">shaped around you</em>.
          </h2>
          <p className="mt-6 text-label font-medium uppercase text-muted">
            When access opens
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-sm border border-rule bg-surface p-8"
            >
              <span className="block font-serif text-3xl italic text-cobalt">
                {step.n}
              </span>
              <h3 className="mt-6 font-sans text-base font-medium text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-body text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
