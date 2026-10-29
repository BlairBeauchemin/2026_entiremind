// The answer to the tension above it, on the same paper with no rule between:
// what Entiremind is, then one example text. The example illustrates a
// prompt; it is not a testimonial, so it is a single message with no invented
// reply. The hero already shows the phone, so this is just the bubble.
export function Introducing() {
  return (
    <section id="section-how-it-works" className="pb-section relative z-10">
      <div className="max-w-xl mx-auto px-6">
        <h2 className="font-serif text-heading text-cobalt">
          Introducing Entiremind
        </h2>
        <p className="mt-3 font-serif text-xl text-ink leading-snug text-balance">
          A little space for your intentions, woven into everyday life.
        </p>
        <p className="mt-4 text-lg text-ink font-sans leading-normal">
          Get thoughtful texts shaped around what you want to create—with
          questions, reflections, and small actions to help you move toward it.
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
    </section>
  );
}
