"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { analytics } from "@/lib/analytics";
import {
  QUIZ_SHARE,
  archetypeShareUrl,
  archetypeDisplayName,
} from "@/lib/persona/share";
import type { Archetype } from "@/lib/persona/types";

/**
 * Share button for the quiz's full reveal. Shares the PUBLIC archetype page
 * (generic copy, zero user data) with pre-written share text; native share
 * sheet with clipboard fallback — same pattern as ShareArchetypeButton, plus
 * quiz analytics.
 */
export function ShareResult({ archetype }: { archetype: Archetype }) {
  const [copied, setCopied] = useState(false);

  const url = archetypeShareUrl(archetype);
  const name = archetypeDisplayName(archetype);
  const text = QUIZ_SHARE[archetype].shareText;

  async function handleShare() {
    analytics.quizShareClick(archetype);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `I'm ${name}`, text, url });
        return;
      } catch {
        // Sheet dismissed or share failed — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing sensible left to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white/60 px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-white/80"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share your archetype
        </>
      )}
    </button>
  );
}
