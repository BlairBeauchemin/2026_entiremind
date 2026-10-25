// The problem, named before the answer. Plain linen, one narrow column: this
// section should read like a page someone wrote, not a feature block.
export function Problem() {
  return (
    <section
      id="section-problem"
      className="py-section relative z-10 border-t border-rule"
    >
      {/* The heading gets a wider measure than the body so each sentence
          holds its own line: the turn between them is the point. */}
      <h2 className="max-w-5xl mx-auto px-6 text-center font-serif text-display text-ink text-balance mb-8">
        <span className="block">Inspiration feels good.</span>
        <span className="block">Then everyday life takes over.</span>
      </h2>
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="text-lg lg:text-xl text-ink font-light leading-relaxed font-sans text-balance">
          You set an intention and feel excited about what&apos;s possible. Then
          your attention gets pulled elsewhere, familiar doubts return, and the
          practice you wanted to build quietly slips away.
        </p>
        <p className="mt-8 text-lg lg:text-xl text-ink font-light leading-relaxed font-sans">
          So you start over. Again.
        </p>
      </div>
      <p className="max-w-4xl mx-auto px-6 mt-10 text-center font-serif italic text-heading text-ink text-balance">
        <span className="block">It isn&apos;t a willpower problem.</span>
        <span className="block">Nothing was there to bring you back.</span>
      </p>
    </section>
  );
}
