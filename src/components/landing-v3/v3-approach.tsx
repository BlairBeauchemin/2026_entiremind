/**
 * The page's single full-bleed moment, and the only ground on which gold is
 * legal — so the emblem lives here rather than in v3-how-it-works.
 *
 * The framework is named but not enumerated, because the six steps have not
 * been written down anywhere we can quote. The emblem carries the count (six
 * nodes on a ring) without inventing names for them. When the real six steps
 * exist, they replace the ring.
 */
function SixNodeMark({ size = 168 }: { size?: number }) {
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return { x: 60 + 40 * Math.cos(angle), y: 60 + 40 * Math.sin(angle) };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      {/* .geometry-line-leaf supplies the gold and the fill rule, but its
          stroke-width of 0.5 is tuned for larger viewBoxes — at a 120 box it
          renders near-invisible. DESIGN.md asks for ~1.3px at 120px, so the
          width is set here rather than left to drift. */}
      <g className="geometry-line-leaf" strokeWidth={1.3}>
        <circle cx="60" cy="60" r="40" />
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r="5.5" />
        ))}
      </g>
    </svg>
  );
}

export function V3Approach() {
  return (
    <section
      id="section-approach"
      className="relative z-10 bg-cobalt py-section text-linen"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16 lg:justify-center">
          <div className="mx-auto md:mx-0">
            <SixNodeMark />
          </div>

          <div className="max-w-[46rem]">
            <h2 className="font-serif text-heading text-balance text-linen">
              A method behind the messages.
            </h2>

            <p className="mt-6 text-body text-linen/80">
              The Entiremind six-step framework brings together
              intention-setting, awareness of thought patterns, visualization,
              and action. It gives the practice a structure you can keep
              returning to as you grow.
            </p>

            <p className="mt-8 font-serif text-xl italic text-linen">
              Thoughtful, practical, and lightly magical.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
