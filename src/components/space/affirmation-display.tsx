"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * The line the user is sitting with.
 *
 * Two nested opacities, deliberately: the wrapper carries the breath (driven
 * from the `--breath` custom property the sky writes each frame, so it
 * costs no React renders), and the inner element carries the crossfade between
 * one line and the next. Nested opacity multiplies, so they compose without
 * either one having to know about the other — and Framer Motion's inline
 * opacity never fights the calc().
 *
 * The breath floor of 0.42 matters: the words never fully disappear, so nobody
 * has to wait out an exhale to finish reading.
 */

export interface AffirmationDisplayProps {
  /** Stable key for the current line — drives the crossfade. */
  id: string;
  text: string;
  /** Every line in rotation, exposed to assistive tech as static content. */
  allLines: string[];
}

export function AffirmationDisplay({
  id,
  text,
  allLines,
}: AffirmationDisplayProps) {
  return (
    <div className="pointer-events-none relative flex w-full items-center justify-center px-8">
      {/*
        The rotating line is decorative from an assistive-tech point of view: a
        politely-announced text swap every forty seconds is an interruption, not
        a feature. The full set is exposed statically below instead.
      */}
      {/*
        Capped short of the full width so the line wraps to two or three
        lines and sits as a block in the middle of the sky. Running edge to
        edge made the words a banner across the stars rather than something
        held within them.
      */}
      <div
        aria-hidden="true"
        className="w-full max-w-[17rem] sm:max-w-sm md:max-w-md"
        style={{ opacity: "calc(0.42 + 0.58 * var(--breath, 0.5))" }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={id}
            initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
            transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
            className="text-balance text-center font-serif text-[1.65rem] leading-snug tracking-wide text-cream sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 2px 24px rgba(13, 33, 38, 0.85)" }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>

      <ul className="sr-only">
        {allLines.map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
