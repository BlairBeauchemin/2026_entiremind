import Link from "next/link";

/**
 * Door into The Space from the dashboard.
 *
 * The preview is a hand-placed dozen stars in inline SVG with a CSS twinkle —
 * no canvas and no rAF loop on a page that is already doing other work. The
 * live, pannable sky starts when you walk through the door.
 */

/**
 * Fixed positions rather than generated ones: a dozen points read better when
 * they are placed than when they are scattered, and a static preview does not
 * need to match anyone's real sky.
 */
const PREVIEW_STARS = [
  { x: 14, y: 20, r: 1.5, delay: 0 },
  { x: 32, y: 11, r: 1, delay: 1.4 },
  { x: 48, y: 26, r: 2, delay: 0.6 },
  { x: 63, y: 14, r: 1, delay: 2.1 },
  { x: 20, y: 42, r: 1, delay: 1.1 },
  { x: 40, y: 50, r: 1.5, delay: 2.6 },
  { x: 58, y: 44, r: 1, delay: 0.3 },
  { x: 70, y: 58, r: 1.5, delay: 1.8 },
  { x: 12, y: 62, r: 1, delay: 2.9 },
  { x: 30, y: 70, r: 1, delay: 0.9 },
  { x: 52, y: 66, r: 1, delay: 2.3 },
  { x: 24, y: 32, r: 1, delay: 1.6 },
];

export function SpaceEntryCard({
  hasAffirmations,
}: {
  hasAffirmations: boolean;
}) {
  return (
    <Link
      href="/space"
      className="group block rounded-2xl border-l-4 border-em-purple-300 bg-white/60 p-6 transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      <div className="flex items-center gap-5">
        <div
          aria-hidden="true"
          className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-full sm:block"
          style={{
            background:
              "radial-gradient(120% 110% at 50% 10%, #16294a 0%, #0a1428 55%, #05080f 100%)",
          }}
        >
          <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
            {PREVIEW_STARS.map((star, i) => (
              <circle
                key={i}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill={i === 2 ? "#f9d97a" : "#fffcf5"}
                className="star-twinkle"
                style={{ animationDelay: `${star.delay}s` }}
              />
            ))}
          </svg>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs uppercase tracking-widest text-teal-900/50">
            The Space
          </p>
          <p className="font-serif text-xl leading-relaxed text-navy md:text-2xl">
            {hasAffirmations
              ? "Sit under your sky for a few breaths."
              : "A quiet sky to sit under with what you're manifesting."}
          </p>
          <p className="mt-2 text-sm text-teal-900/60">
            {hasAffirmations
              ? "Enter the space"
              : "Write your first affirmation"}{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
