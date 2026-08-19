import Link from "next/link";
import { SacredGeometryAccent } from "@/components/landing-v2/sacred-geometry-visual";

/**
 * Door into The Space from the dashboard.
 *
 * The preview is the existing static SVG accent with a CSS-only rotation — no
 * canvas and no rAF loop on a page that is already doing other work. The live,
 * interactive mandala starts when you walk through the door.
 */
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
        <div className="relative hidden h-20 w-20 shrink-0 items-center justify-center sm:flex">
          <SacredGeometryAccent
            size={80}
            className="geometry-rotate opacity-70 transition-opacity group-hover:opacity-100"
          />
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs uppercase tracking-widest text-teal-900/50">
            The Space
          </p>
          <p className="font-serif text-xl leading-relaxed text-navy md:text-2xl">
            {hasAffirmations
              ? "Sit with your affirmations for a few breaths."
              : "A quiet place to sit with what you're manifesting."}
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
