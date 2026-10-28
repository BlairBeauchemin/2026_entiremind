// The problem, named before the answer, closing on why we built Entiremind.
// The struggle is shown as the cycle it is: four short beats on a hairline,
// with a bracket that carries the last one back to the first. Plain linen,
// no icons or cards: it should read as printed, and scan in a glance on a
// phone.
const cycle = [
  "You set an intention.",
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
      {/* The heading gets a wider measure than the body so each sentence
          holds its own line: the turn between them is the point. */}
      <h2 className="max-w-5xl mx-auto px-6 text-center font-serif text-display text-ink text-balance mb-12">
        <span className="block">Inspiration feels good.</span>
        <span className="block">Then everyday life takes over.</span>
      </h2>

      <div className="px-6 flex justify-center">
        <div className="relative pl-8">
          {/* The loop: a hairline bracket from the last beat back up to the
              first, ending in a small arrowhead pointing at it. */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-[0.95rem] bottom-[0.95rem] w-5 border border-r-0 border-cobalt/50 rounded-l-sm"
          >
            <svg
              viewBox="0 0 8 8"
              className="absolute -top-[4.5px] -right-[7px] w-2 h-2 text-cobalt/70"
              fill="currentColor"
            >
              <path d="M0 0 L8 4 L0 8 Z" />
            </svg>
          </div>
          <ol className="space-y-5">
            {cycle.map((beat, i) => (
              <li key={beat} className="flex items-baseline gap-4">
                <span className="font-serif italic text-cobalt text-xl w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg lg:text-xl text-ink font-light font-sans">
                  {beat}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="max-w-4xl mx-auto px-6 mt-14 text-center font-serif italic text-heading text-ink text-balance">
        <span className="block">
          <span className="block sm:inline">We know that cycle.</span>{" "}
          <span className="block sm:inline">
            It isn&apos;t a willpower problem.
          </span>
        </span>
        <span className="block">So we built something to bring you back.</span>
      </p>
    </section>
  );
}
