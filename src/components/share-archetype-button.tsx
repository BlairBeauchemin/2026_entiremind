"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { Archetype } from "@/lib/persona/types";

/**
 * Shares the PUBLIC archetype page (generic content, zero user data) via the
 * native share sheet, falling back to copying the link. The shared URL never
 * contains quiz answers or anything personal.
 */
export function ShareArchetypeButton({
  archetype,
  archetypeName,
}: {
  archetype: Archetype;
  archetypeName: string;
}) {
  const [copied, setCopied] = useState(false);

  const url = `https://www.entiremind.com/archetype/${archetype}`;

  async function handleShare() {
    const shareData = {
      title: `I'm ${archetypeName}`,
      text: `My manifestation archetype is ${archetypeName}. What's yours?`,
      url,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed the sheet or share failed — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
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
      className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white/60 px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-white/80"
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
