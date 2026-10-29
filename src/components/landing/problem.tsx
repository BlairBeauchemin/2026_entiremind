// The tension, as plain text: a heading, one sentence, one closing line. No
// list, card or CTA, and no transition paragraph after it; it flows straight
// into "Introducing Entiremind", which sits on the same paper with no rule
// between them.
export function Problem() {
  return (
    <section
      id="section-problem"
      className="pt-section pb-12 lg:pb-16 relative z-10 border-t border-rule"
    >
      {/* Same frame as the intro below, so their left edges line up. */}
      <div className="max-w-xl lg:max-w-5xl mx-auto px-6">
        <div className="max-w-xl">
          <h2 className="font-serif text-heading text-ink text-balance">
            <span className="block">
              You haven&apos;t forgotten what you want.
            </span>
            <span className="block">It just gets lost in the day.</span>
          </h2>
          <p className="mt-4 text-lg text-ink font-sans leading-normal">
            Between the things you need to do and the people who need you, your
            own intentions slip into the background.
          </p>
          <p className="mt-4 text-lg text-ink font-sans leading-normal">
            Until another day becomes &ldquo;I&apos;ll start tomorrow.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
