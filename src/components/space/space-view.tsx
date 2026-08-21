"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Pencil } from "lucide-react";
import { BREATHS_PER_AFFIRMATION } from "@/lib/space/breath";
import { IGNITE_MS } from "@/lib/space/render";
import type { Affirmation } from "@/lib/affirmations";
import { StarfieldSky } from "./starfield-sky";
import { AffirmationDisplay } from "./affirmation-display";
import { AffirmationDrawer } from "./affirmation-drawer";

/**
 * The Space.
 *
 * A night sky you sit under while your own words come and go. Deliberately has
 * no timer, no session count, and no end state — you arrive, you breathe, you
 * leave. The only two controls fade out when you stop touching the screen and
 * come back the moment you move, so the surface can go fully quiet without ever
 * becoming a trap.
 *
 * The sky accumulates: one bright star per affirmation, in the same place every
 * visit. Writing a new one lights a new star.
 */

/** How long the exit and edit controls linger before fading away. */
const CHROME_IDLE_MS = 3200;

export interface SpaceViewProps {
  affirmations: Affirmation[];
  /** The user's active intention — the focus line when nothing else exists. */
  intention: string | null;
  /** Stable per-user seed for the backdrop stars. */
  skySeed: string;
}

export function SpaceView({
  affirmations: initialAffirmations,
  intention,
  skySeed,
}: SpaceViewProps) {
  const [affirmations, setAffirmations] = useState(initialAffirmations);
  const [index, setIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [ignitingId, setIgnitingId] = useState<string | null>(null);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const igniteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Breath bookkeeping. Both are refs: they change on a 13-second beat and
  // nothing renders off them directly.
  const cycleRef = useRef(0);
  const lastAdvanceRef = useRef(0);

  /**
   * What's on screen. Affirmations if the user has written any; otherwise their
   * intention, so the space is never a blank stage — the words they already
   * typed during onboarding are enough to sit with on day one.
   */
  const lines: { id: string; text: string }[] = affirmations.length
    ? affirmations.map((a) => ({ id: a.id, text: a.text }))
    : intention
      ? [{ id: "intention", text: intention }]
      : [];

  // Wrapping here rather than clamping the stored index means a shrinking list
  // (the user archived something) can never strand us past the end, with no
  // correcting effect and no render where `current` is momentarily undefined.
  const current = lines.length > 0 ? lines[index % lines.length] : null;

  const scheduleHide = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(
      () => setChromeVisible(false),
      CHROME_IDLE_MS,
    );
  }, []);

  const wakeChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // Mount only arms the fade-out timer; the controls already start visible, so
  // there is nothing to set.
  useEffect(() => {
    scheduleHide();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (igniteTimerRef.current) clearTimeout(igniteTimerRef.current);
    };
  }, [scheduleHide]);

  // While the drawer is open the controls stay put — fading them out behind an
  // open sheet would just be a flicker behind glass. Derived rather than
  // stored, so the drawer never has to write chrome state.
  const showChrome = chromeVisible || drawerOpen;

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      setDrawerOpen(open);
      // Closing the sheet is an interaction: give the controls their full
      // dwell again rather than snapping them away the instant it slides down.
      if (!open) wakeChrome();
    },
    [wakeChrome],
  );

  /**
   * A star has just been earned. Cleared once the flare has had time to play so
   * that saving the *same* text twice still reads as a change to the sky.
   */
  const handleCreated = useCallback((id: string) => {
    setIgnitingId(id);
    if (igniteTimerRef.current) clearTimeout(igniteTimerRef.current);
    igniteTimerRef.current = setTimeout(() => setIgnitingId(null), IGNITE_MS);
  }, []);

  const advance = useCallback(() => {
    lastAdvanceRef.current = cycleRef.current;
    setIndex((i) => (lines.length > 0 ? (i + 1) % lines.length : 0));
  }, [lines.length]);

  const handleCycle = useCallback(
    (cycle: number) => {
      cycleRef.current = cycle;
      if (cycle - lastAdvanceRef.current >= BREATHS_PER_AFFIRMATION) {
        advance();
      }
    },
    [advance],
  );

  const handleTap = useCallback(() => {
    wakeChrome();
    if (lines.length > 1) advance();
  }, [advance, lines.length, wakeChrome]);

  return (
    <div
      ref={surfaceRef}
      onPointerMove={wakeChrome}
      onPointerDown={wakeChrome}
      className="relative h-full w-full"
      // --breath is written here every frame by the sky; everything that wants
      // to move with the breath reads it from this scope.
      style={{ ["--breath" as string]: "0.5" }}
    >
      {/* Deep space. Static — no per-frame blur, which mobile cannot afford. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 8%, #14243f 0%, #0a1428 38%, #05080f 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-grain mix-blend-overlay" />

      <StarfieldSky
        skySeed={skySeed}
        affirmationIds={affirmations.map((a) => a.id)}
        igniteId={ignitingId}
        breathTargetRef={surfaceRef}
        onCycle={handleCycle}
        onTap={handleTap}
      />

      {/* The words. pointer-events-none throughout so the whole screen stays
          draggable — there is no dead zone in the middle of the sky. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {current ? (
          <AffirmationDisplay
            id={current.id}
            text={current.text}
            allLines={lines.map((l) => l.text)}
          />
        ) : (
          <EmptyInvitation onWrite={() => setDrawerOpen(true)} />
        )}
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showChrome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4"
          >
            <Link
              href="/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream/60 transition hover:bg-white/10 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-em-yellow-400"
              aria-label="Leave the space"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream/60 transition hover:bg-white/10 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-em-yellow-400"
              aria-label="Edit your affirmations"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One-time orientation, only while there is something to orient to. */}
      {lines.length > 1 && (
        <AnimatePresence>
          {showChrome && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs tracking-widest text-cream/35"
            >
              TAP FOR THE NEXT · DRAG THE SKY
            </motion.p>
          )}
        </AnimatePresence>
      )}

      <AffirmationDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        affirmations={affirmations}
        onChanged={setAffirmations}
        onCreated={handleCreated}
      />
    </div>
  );
}

function EmptyInvitation({ onWrite }: { onWrite: () => void }) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-6 px-8 text-center">
      <p
        className="text-balance font-serif text-2xl leading-snug tracking-wide text-cream/85 sm:text-3xl"
        style={{ opacity: "calc(0.5 + 0.5 * var(--breath, 0.5))" }}
      >
        Write the first thing you want to be true.
      </p>
      <button
        type="button"
        onClick={onWrite}
        className="pointer-events-auto rounded-full bg-em-yellow-400 px-6 py-3 text-sm font-medium text-teal-900 transition hover:bg-em-yellow-400/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-em-yellow-400"
      >
        Write one
      </button>
    </div>
  );
}
