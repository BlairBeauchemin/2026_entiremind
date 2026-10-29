const benefits = [
  {
    title: "Step out of autopilot.",
    description:
      "Pause, notice what's on your mind, and bring your attention back to what you want.",
  },
  {
    title: "Move beyond familiar doubts.",
    description:
      "Question the stories that hold you back and explore a different way forward.",
  },
  {
    title: "Bring your intentions to life.",
    description:
      "Get clear on what you want and take small, meaningful actions to manifest it.",
  },
];

// Three benefits as one section: compact rows on hairlines, a serif title and
// one sentence each. Stacked on mobile; three across from lg.
export function Benefits() {
  return (
    <section
      id="section-benefits"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl lg:max-w-5xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink text-balance mb-6 lg:mb-8">
          Make room for what&apos;s possible.
        </h2>
        <ul className="divide-y divide-rule border-y border-rule lg:grid lg:grid-cols-3 lg:gap-10 lg:divide-y-0 lg:border-y-0">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="py-5 lg:py-0 lg:border-t lg:border-rule lg:pt-6"
            >
              <h3 className="font-serif text-xl text-ink leading-snug">
                {benefit.title}
              </h3>
              <p className="mt-1 text-base text-muted font-sans leading-normal">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
