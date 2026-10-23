const beats = [
  {
    number: "01",
    title: "Name what you're calling in.",
    description:
      "Tell us your intention in your own words. It stays yours — we never rewrite it.",
  },
  {
    number: "02",
    title: "One text, each morning.",
    description:
      "A single question shaped around your intention. Nothing to open, nothing to keep up with.",
  },
  {
    number: "03",
    title: "Answer, or don't.",
    description:
      "A word or a paragraph. It remembers what you share, and quiet days are just quiet days.",
  },
];

export function ListensBack() {
  return (
    <section
      id="section-how-it-works"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-serif text-display text-ink text-balance mb-6">
          The manifestation practice that{" "}
          <em className="italic">listens back.</em>
        </h2>
        <p className="text-lg lg:text-xl text-ink font-light leading-relaxed font-sans text-balance">
          Affirmation apps talk at you. Entiremind texts you one question each
          morning, hears your answer, and remembers it — so tomorrow&apos;s text
          meets you where you actually are.
        </p>
      </div>

      <ol className="max-w-5xl mx-auto px-6 mt-16 lg:mt-20 grid md:grid-cols-3 gap-10 md:gap-12">
        {beats.map((beat) => (
          <li key={beat.number} className="border-t border-rule pt-6">
            <div className="font-serif italic text-cobalt text-2xl mb-4">
              {beat.number}
            </div>
            <h3 className="font-serif text-heading text-ink mb-3">
              {beat.title}
            </h3>
            <p className="text-muted font-sans leading-relaxed">
              {beat.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
