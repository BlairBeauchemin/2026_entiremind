// One text, set large, carries the "it remembers" claim instead of describing
// it. Full-bleed cobalt reads as a change of paper, not a card.
export function Remembered() {
  return (
    <section className="py-section bg-cobalt text-linen relative z-10">
      <figure className="max-w-3xl mx-auto px-6 text-center">
        <p className="text-label uppercase text-linen/70 font-sans mb-8">
          A morning text, three weeks in
        </p>
        <blockquote className="font-serif italic text-heading md:text-display text-linen text-balance">
          &ldquo;Three weeks ago you said asking for more felt like pretending.
          This morning you asked. What changed?&rdquo;
        </blockquote>
        <figcaption className="mt-12 text-sm text-linen/80 font-sans tracking-wide">
          No app. No streaks. No feed. No guilt when life gets loud.
        </figcaption>
      </figure>
    </section>
  );
}
