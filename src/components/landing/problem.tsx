// The familiar problem, kept short: a heading and the cycle as four beats on
// a hairline, with a bracket that carries the last one back to the first. It
// hands straight to the product section, with no closing paragraph. Plain
// linen, no icons or cards: it should read as printed, and scan in a glance
// on a phone.
const cycle = [
  "You feel clear about what you want.",
  "Life pulls your attention away.",
  "Old doubts creep back in.",
  "You start over. Again.",
];

export function Problem() {
  return (
    <section
      id="section-problem"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink mb-8">
          <span className="block">You set an intention.</span>
          <span className="block">Then life takes over.</span>
        </h2>

        <div className="relative pl-7">
          {/* The loop: a hairline bracket from the last beat back up to the
              first, ending in a small arrowhead pointing at it. */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-[0.8rem] bottom-[0.8rem] w-4 border border-r-0 border-cobalt/50 rounded-l-sm"
          >
            <svg
              viewBox="0 0 8 8"
              className="absolute -top-[4.5px] -right-[7px] w-2 h-2 text-cobalt/70"
              fill="currentColor"
            >
              <path d="M0 0 L8 4 L0 8 Z" />
            </svg>
          </div>
          <ol className="space-y-4">
            {cycle.map((beat, i) => (
              <li key={beat} className="flex items-baseline gap-3">
                <span className="font-serif italic text-cobalt text-xl w-7 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg text-ink font-sans leading-normal">
                  {beat}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
