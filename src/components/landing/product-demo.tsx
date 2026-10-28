import { WaitlistButton } from "./waitlist-button";

const steps = [
  {
    number: "01",
    title: "Name what you’re calling in.",
    description: "Share what you want to create in your own words.",
  },
  {
    number: "02",
    title: "Receive a thoughtful text.",
    description:
      "A question, reflection, or small action shaped around your intention.",
  },
  {
    number: "03",
    title: "Answer, or don’t.",
    description: "Take a moment to reply—or carry the thought into your day.",
  },
];

// The experience and how it works, as one section: the promise, one example
// text, three compact steps, then the mid-page ask. The example is an
// illustration of a prompt, not a testimonial, so it is a single message with
// no invented reply. The hero already shows the phone, so this is a bubble.
export function ProductDemo() {
  return (
    <section
      id="section-how-it-works"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl lg:max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <h2 className="font-serif text-heading text-ink text-balance">
            A small reminder of what matters to you.
          </h2>
          <p className="mt-4 text-lg text-ink font-sans leading-normal">
            Set an intention. Get thoughtful texts with questions, reflections,
            and small actions to bring it into your day.
          </p>

          <figure className="mt-8">
            <figcaption className="text-sm text-muted font-sans mb-3">
              A text you might receive
            </figcaption>
            {/* The Messages facsimile's bubble language: surface fill, rule
                hairline, a tighter corner where it leaves the sender. */}
            <blockquote className="bg-surface border border-rule rounded-2xl rounded-bl-sm px-5 py-4 text-[1.0625rem] leading-normal text-ink font-sans">
              Picture an ordinary morning in the life you want to create. What
              feels different? Choose one small piece of that feeling to bring
              into today.
            </blockquote>
          </figure>
        </div>

        <div>
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

          <div className="mt-8 text-center lg:text-left">
            <WaitlistButton location="intro" />
            <p className="text-sm text-muted mt-3 font-sans">
              Free to join. Get an invitation when access opens.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
