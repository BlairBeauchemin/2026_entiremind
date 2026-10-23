import Link from "next/link";

// The second door: a visitor not ready to hand over a phone number can still
// take the quiz, which captures an email lead (source 'quiz') at its gate.
export function QuizInvite() {
  return (
    <section id="section-quiz" className="py-section relative z-10">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="font-serif text-display text-ink text-balance mb-6">
          Curious how <em className="italic">you</em> manifest?
        </h2>
        <p className="text-lg text-ink font-light leading-relaxed font-sans text-balance mb-10">
          Eight quick taps tell you whether you&apos;re a Visionary, an
          Alchemist, a Seeker or a Phoenix — and what your inner critic tends to
          whisper.
        </p>
        <Link
          href="/quiz"
          className="inline-block border border-cobalt text-cobalt px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt hover:text-linen transition-colors duration-300 font-sans"
        >
          Take the quiz
        </Link>
      </div>
    </section>
  );
}
