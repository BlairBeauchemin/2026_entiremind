"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * The signature motif: a profile drawn as one continuous line, its interior a
 * tangle of thought. As the visitor scrolls the tangle unwinds and a single
 * thread leaves the head and runs on down the page.
 *
 * Authored as SVG rather than generated art on purpose — it has to animate,
 * recolour per surface, and stay crisp at any density.
 */

/** Right-facing profile: neck, skull, crown, brow, nose, lips, chin, jaw. */
const PROFILE =
  "M 120 470 C 112 402, 86 374, 78 322 C 66 250, 96 168, 158 130 " +
  "C 206 100, 268 108, 300 150 C 322 180, 322 196, 318 214 " +
  "L 336 258 C 340 266, 336 272, 328 272 L 310 274 " +
  "C 316 288, 312 296, 300 298 C 306 310, 302 318, 290 320 " +
  "C 296 336, 288 350, 268 354 C 250 358, 236 372, 232 392 " +
  "C 228 420, 210 446, 186 460 C 168 470, 144 472, 120 470";

/**
 * The rumination itself. Each strand is a closed-ish loop inside the cranium;
 * together they read as one snarl rather than a pattern, which is why they are
 * hand-placed instead of generated on a grid.
 */
const STRANDS = [
  "M 150 250 C 104 210, 138 152, 198 160 C 256 168, 256 234, 204 248 C 154 260, 136 208, 174 186",
  "M 130 300 C 92 250, 126 178, 192 182 C 250 186, 272 250, 232 292 C 194 330, 142 312, 134 268",
  "M 176 214 C 216 172, 282 192, 284 240 C 286 294, 222 314, 184 286 C 152 262, 156 220, 192 210",
  "M 114 260 C 120 190, 198 144, 256 176 C 306 202, 306 268, 258 300 C 216 328, 164 314, 148 278",
  "M 158 172 C 230 142, 296 182, 292 234 C 288 284, 234 306, 196 292",
  "M 140 322 C 188 346, 256 326, 276 278 C 294 234, 268 190, 226 178",
  "M 204 150 C 164 188, 162 250, 202 280 C 240 308, 290 284, 296 244",
  "M 124 224 C 168 196, 230 210, 246 254 C 260 292, 220 322, 180 306 C 142 292, 138 250, 168 234",
  "M 190 168 C 138 184, 118 238, 148 282 C 176 322, 240 320, 266 284",
  "M 168 300 C 214 316, 268 296, 282 252 C 294 214, 268 176, 228 168",
  "M 136 202 C 190 168, 262 186, 280 232",
  "M 152 288 C 128 246, 148 194, 196 178",
  "M 232 300 C 276 282, 296 236, 278 196",
  "M 118 282 C 156 316, 218 320, 252 296",
];

/** Where the resolved thought goes once it stops circling. */
const RESOLVED =
  "M 150 250 C 190 236, 232 244, 268 262 C 316 286, 348 300, 400 300";

/**
 * Each world draws the same anatomy in its own hand. `ink` is a drawn plate
 * line, `stitch` is floss worked through cloth, `plot` is a plotted technical
 * contour. The geometry never changes — only the instrument does.
 */
export type TangleHand = "ink" | "stitch" | "plot" | "gilded" | "penned";

export interface TangleHeadProps {
  className?: string;
  hand?: TangleHand;
  /** CSS colour values, e.g. "var(--color-nt-vellum)". */
  profileColor?: string;
  tangleColor?: string;
  threadColor?: string;
  /** The struck compass marks. Off for worlds whose grammar rules rather than draws. */
  compass?: boolean;
  compassColor?: string;
}

const HAND_STYLE: Record<
  TangleHand,
  { profile: number; tangle: number; thread: number; dash?: string; cap: "round" | "butt" }
> = {
  ink: { profile: 1.6, tangle: 2.1, thread: 2.4, cap: "round" },
  stitch: { profile: 2.2, tangle: 2.6, thread: 2.8, dash: "5 4", cap: "butt" },
  plot: { profile: 1, tangle: 1.1, thread: 1.4, cap: "butt" },
  // Laid gold: heavier and softer, the line reading as leaf rather than nib.
  gilded: { profile: 1.4, tangle: 3, thread: 3.4, cap: "round" },
  // A nib on paper: fine contour, the snarl worked over until it darkens.
  penned: { profile: 1.3, tangle: 1.7, thread: 2, cap: "round" },
};

export function TangleHead({
  className,
  hand = "ink",
  profileColor = "var(--color-nt-vellum)",
  tangleColor = "var(--color-nt-vermilion)",
  threadColor = "var(--color-nt-gold)",
  compass = true,
  compassColor = "var(--color-nt-gold)",
}: TangleHeadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const style = HAND_STYLE[hand];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.15"],
  });

  // At rest the snarl is whole — that is the thesis, and it must be legible
  // before anyone scrolls. Scrolling is what unwinds it: the strands fade as
  // the single thread draws itself in their place. Drawing the strands ON
  // scroll would leave the first viewport nearly empty, which is the one
  // thing this composition cannot afford.
  const tangleOpacity = useTransform(scrollYProgress, [0.15, 0.65], [1, 0.1]);
  const threadDraw = useTransform(scrollYProgress, [0.25, 0.85], [0, 1]);

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox="0 0 400 480"
        fill="none"
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="A profile drawn in one line, the thinking inside it tangled and then resolving into a single thread."
      >
        {/* Struck compass marks, laid down before the drawing itself. */}
        {compass && (
          <>
            <circle
              cx="196"
              cy="246"
              r="184"
              stroke={compassColor}
              strokeOpacity="0.28"
              strokeWidth="1"
            />
            <circle
              cx="196"
              cy="246"
              r="168"
              stroke={compassColor}
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="2 7"
            />
          </>
        )}

        {/* Group carries the scroll fade; each strand owns its own draw-in, so
            the two never fight over the same property. */}
        <motion.g style={reduceMotion ? undefined : { opacity: tangleOpacity }}>
          {STRANDS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              stroke={tangleColor}
              strokeWidth={style.tangle}
              strokeLinecap={style.cap}
              strokeDasharray={style.dash}
              strokeOpacity={0.82}
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.1,
                delay: 0.15 + i * 0.055,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </motion.g>

        <motion.path
          d={RESOLVED}
          stroke={threadColor}
          strokeWidth={style.thread}
          strokeLinecap="round"
          style={reduceMotion ? { opacity: 1 } : { pathLength: threadDraw }}
        />

        <path
          d={PROFILE}
          stroke={profileColor}
          strokeWidth={style.profile}
          strokeLinecap={style.cap}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
