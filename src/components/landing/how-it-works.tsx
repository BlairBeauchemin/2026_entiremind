export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Discover Your Archetype",
      description:
        "A three-minute reflection reveals how you manifest — and what your inner critic whispers.",
    },
    {
      number: "02",
      title: "A Morning Text Meets You",
      description:
        "Each day, one short message tuned to your intention arrives. Nothing to open, nothing to keep up with.",
    },
    {
      number: "03",
      title: "Reply in Your Own Words",
      description:
        "Whatever's true that day. It's a journal that answers back — reflecting your words, never judging them.",
    },
    {
      number: "04",
      title: "It Grows With You",
      description:
        "The more you share, the more it remembers — and the more each message feels like it was written for you.",
    },
  ];

  return (
    // Full-bleed is reserved for a cobalt band or a single image. A floating
    // rounded slab reads as a card; edge to edge reads as a change of paper.
    <section
      id="section-how-it-works"
      className="py-section bg-cobalt text-linen relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-section mb-6 italic">
              How It Works
            </h2>
            <p className="text-linen/80 text-xl font-light font-sans">
              A gentle daily practice that starts with who you are and deepens
              with every reply.
            </p>
          </div>
          <a
            href="#section-hero"
            className="shrink-0 text-linen border border-linen/40 px-6 py-2.5 rounded-sm hover:border-linen hover:bg-cobalt-deep font-sans text-sm transition-colors duration-300"
          >
            Get Early Access
          </a>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            // Inside the cobalt band a card cannot be a paper surface — that
            // is the ground it is sitting on inverted. Depth here is a deeper
            // cobalt plus a linen hairline.
            <div
              key={step.number}
              className="relative p-8 rounded-sm bg-cobalt-deep border border-linen/15 transition-colors hover:border-linen/40"
            >
              <div className="text-4xl font-serif text-leaf mb-8 italic">
                {step.number}
              </div>
              <h3 className="text-2xl font-serif italic mb-3 text-linen">
                {step.title}
              </h3>
              <p className="text-sm text-linen/80 font-sans leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
