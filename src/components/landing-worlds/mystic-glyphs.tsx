/**
 * Shared metaphysical glyphs, drawn rather than typed.
 *
 * The classical alchemical elements and the lunar cycle are geometry, not
 * characters — drawing them avoids depending on a font that happens to carry
 * the astrological block, and lets each world colour and weight them itself.
 */

export type Element = "fire" | "water" | "air" | "earth";

/** The four elements: an upward or downward triangle, barred or not. */
export function ElementSigil({
  element,
  className = "",
  stroke = "currentColor",
}: {
  element: Element;
  className?: string;
  stroke?: string;
}) {
  const up = element === "fire" || element === "air";
  const barred = element === "air" || element === "earth";

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d={up ? "M12 3 L22 21 L2 21 Z" : "M12 21 L2 3 L22 3 Z"}
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {barred && (
        <path
          d={up ? "M6 15 L18 15" : "M6 9 L18 9"}
          stroke={stroke}
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

/**
 * One moon at a given phase. 0 = new, 0.5 = full, 1 = new again.
 * The terminator is an ellipse whose width tracks the phase, which is the
 * actual geometry rather than a crescent approximation.
 */
export function MoonPhase({
  phase,
  size = 26,
  lit = "currentColor",
  dark = "transparent",
  ring = "currentColor",
}: {
  phase: number;
  size?: number;
  lit?: string;
  dark?: string;
  ring?: string;
}) {
  const r = 11.4;
  // cos is +1 at new moon and -1 at full, so it doubles as both the
  // terminator's horizontal radius and the test for which way it curves.
  const c = Math.cos(phase * 2 * Math.PI);
  const waxing = phase < 0.5;
  const id = `moon-${phase.toFixed(3).replace(".", "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <clipPath id={id}>
          {/* Waxing lights from the right; waning from the left. */}
          <rect x={waxing ? 12 : 0} y="0" width="12" height="24" />
        </clipPath>
      </defs>

      <circle cx="12" cy="12" r={r} fill={dark} />
      <g clipPath={`url(#${id})`}>
        <circle cx="12" cy="12" r={r} fill={lit} />
      </g>
      {/* Under half lit, the terminator cuts dark into the lit side; over half,
          it extends the lit side across the meridian. */}
      <ellipse
        cx="12"
        cy="12"
        rx={r * Math.abs(c)}
        ry={r}
        fill={c > 0 ? dark : lit}
      />
      <circle cx="12" cy="12" r={r} stroke={ring} strokeWidth="0.7" />
    </svg>
  );
}

/** The eight phases, as a cadence rail. */
export const LUNAR_CYCLE = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

/** The four archetypes the product already ships, as a suit. */
export const ARCHETYPE_SUIT: { name: string; element: Element; numeral: string }[] =
  [
    { name: "The Visionary", element: "air", numeral: "I" },
    { name: "The Alchemist", element: "fire", numeral: "II" },
    { name: "The Seeker", element: "water", numeral: "III" },
    { name: "The Phoenix", element: "earth", numeral: "IV" },
  ];
