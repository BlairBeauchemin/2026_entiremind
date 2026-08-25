"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { buildRevealContent } from "@/lib/persona/content";
import { analytics } from "@/lib/analytics";
import { ShareResult } from "./share-result";
import type { PersonaProfile } from "@/lib/persona/types";

/**
 * Post-gate payoff: the same reading onboarding users get (content.ts is the
 * single source of reveal copy), rendered in the public quiz shell. Ends with
 * share + a soft waitlist pointer — the lead is already captured, so the CTA
 * informs rather than converts.
 */
export function FullReveal({
  profile,
  name,
}: {
  profile: PersonaProfile;
  name: string;
}) {
  const content = buildRevealContent(profile, { name });

  useEffect(() => {
    analytics.quizComplete(profile.archetype);
  }, [profile.archetype]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      <section className="text-center space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
          You are
        </p>
        <h1 className="font-serif text-3xl text-ink">
          {content.archetype.name}
        </h1>
        <p className="text-muted text-sm leading-relaxed text-left">
          {content.archetype.paragraph}
        </p>
      </section>

      {content.innerCritic && (
        <section className="space-y-2 rounded-sm bg-surface border border-rule p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Your inner critic&apos;s favorite trick
          </p>
          <h2 className="font-serif text-xl text-ink">
            {content.innerCritic.name}
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            {content.innerCritic.oneLiner}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
          How the daily practice would meet you
        </p>
        {content.howItWorks.map((line) => (
          <p key={line} className="text-muted text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </section>

      <div className="space-y-4 text-center pt-2">
        <ShareResult archetype={profile.archetype} />
        <p className="text-xs text-muted">
          You&apos;re on the list — we&apos;ll email your reading and let you
          know when the daily practice opens.{" "}
          <Link href="/" className="underline hover:text-cobalt">
            Back to Entiremind
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
