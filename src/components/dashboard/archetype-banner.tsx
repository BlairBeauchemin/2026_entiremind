"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { dismissArchetypeBanner } from "@/lib/onboarding/actions";

/**
 * Dismissible invitation shown to existing onboarded users who don't yet have a
 * persona profile (Milestone 5 backfill). Launches the shortened archetype flow.
 * Dismissal is persisted server-side so it survives devices and sign-out.
 */
export function ArchetypeBanner() {
  const [dismissed, setDismissed] = useState(false);

  function handleDismiss() {
    setDismissed(true);
    // Fire-and-forget; the UI hides immediately regardless of the network call.
    void dismissArchetypeBanner();
  }

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex items-center gap-4 rounded-sm border border-rule bg-cobalt-wash p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt-wash">
            <Sparkles className="h-5 w-5 text-cobalt" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg text-ink">
              Discover your manifestation archetype — 2 minutes
            </p>
            <p className="text-sm text-muted">
              A few quick questions to tune how we show up for you.
            </p>
          </div>

          <Link
            href="/onboarding/archetype"
            className="shrink-0 rounded-sm bg-cobalt px-4 py-2.5 text-sm font-medium text-linen transition-colors hover:bg-cobalt-deep"
          >
            Discover
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-sm p-1.5 text-muted transition-colors hover:bg-surface hover:text-cobalt"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
