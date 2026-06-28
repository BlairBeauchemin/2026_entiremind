"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeFullOnboarding } from "@/lib/onboarding/actions";
import { buildRevealContent } from "@/lib/persona/content";
import type { PersonaProfile, QuizAnswers } from "@/lib/persona/types";

type CompletionResult = { success: true } | { error: string };

interface RevealStepProps {
  profile: PersonaProfile;
  answers: QuizAnswers;
  name: string;
  /** Collected during full onboarding; omitted by the shortened retake flow. */
  vision?: string;
  alignedState?: string | null;
  /** Length of the "reading your answers" transition. */
  transitionMs?: number;
  /** CTA label. Defaults to the first-onboarding copy. */
  submitLabel?: string;
  /** Where to go after a successful completion. */
  redirectTo?: string;
  /**
   * Custom completion handler. When provided (e.g. the retake flow), it runs
   * instead of completeFullOnboarding — vision/alignedState are then ignored.
   */
  onComplete?: () => Promise<CompletionResult>;
}

/** Screen 15 — transition, persona reveal, and the completion CTA. */
export function RevealStep({
  profile,
  answers,
  name,
  vision = "",
  alignedState = null,
  transitionMs = 1800,
  submitLabel = "Your first message is on its way",
  redirectTo = "/dashboard",
  onComplete,
}: RevealStepProps) {
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setRevealed(true), transitionMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [transitionMs]);

  const content = buildRevealContent(profile, { name });

  async function handleComplete() {
    setSubmitting(true);
    setError(null);
    const result = onComplete
      ? await onComplete()
      : await completeFullOnboarding({ answers, vision, alignedState });
    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(redirectTo);
  }

  if (!revealed) {
    return (
      <motion.button
        type="button"
        onClick={() => setRevealed(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full py-16 flex flex-col items-center gap-4 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full bg-em-purple-300/20 flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-em-purple-400" />
        </motion.div>
        <p className="text-teal-900/60 text-sm">Reading your answers…</p>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Archetype */}
      <section className="text-center space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
          You are
        </p>
        <h1 className="font-serif text-3xl text-navy font-medium">
          {content.archetype.name}
        </h1>
        <p className="text-teal-900/70 text-sm leading-relaxed text-left">
          {content.archetype.paragraph}
        </p>
      </section>

      {/* Inner critic */}
      {content.innerCritic && (
        <section className="space-y-2 rounded-2xl bg-white/40 border border-white/60 p-5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
            Your inner critic&apos;s favorite trick
          </p>
          <h2 className="font-serif text-xl text-navy font-medium">
            {content.innerCritic.name}
          </h2>
          <p className="text-teal-900/70 text-sm leading-relaxed">
            {content.innerCritic.oneLiner}
          </p>
          <p className="text-teal-900/70 text-sm leading-relaxed">
            {content.innerCritic.howWeRespond}
          </p>
        </section>
      )}

      {/* How it works */}
      <section className="space-y-3">
        {content.howItWorks.map((line) => (
          <p key={line} className="text-teal-900/70 text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        onClick={handleComplete}
        disabled={submitting}
        className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          submitLabel
        )}
      </Button>
    </motion.div>
  );
}
