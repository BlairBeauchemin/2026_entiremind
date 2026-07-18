"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { archetypeDisplayName, QUIZ_SHARE } from "@/lib/persona/share";
import type { PersonaProfile } from "@/lib/persona/types";

/**
 * The pre-gate payoff: archetype name + one-line hook, given freely — the
 * "feel seen" moment (goal-gradient + reciprocity, docs/design-philosophy.md).
 * The full reading (inner-critic pattern, how the practice adapts) is named
 * honestly as what the email unlocks. No countdowns, no fake scarcity.
 */
export function PartialReveal({
  profile,
  onUnlock,
  transitionMs = 1800,
}: {
  profile: PersonaProfile;
  onUnlock: () => void;
  transitionMs?: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setRevealed(true), transitionMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [transitionMs]);

  useEffect(() => {
    if (revealed) analytics.quizPartialReveal(profile.archetype);
  }, [revealed, profile.archetype]);

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

  const name = archetypeDisplayName(profile.archetype);
  const hook = QUIZ_SHARE[profile.archetype].hookLine;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8 text-center"
    >
      <section className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
          You are
        </p>
        <h1 className="font-serif text-3xl text-navy font-medium">{name}</h1>
        <p className="text-teal-900/70 text-sm leading-relaxed">{hook}</p>
      </section>

      {/* Honest preview of what the full reading contains — teased, not tricked. */}
      <section className="space-y-3 rounded-2xl bg-white/40 border border-white/60 p-5 text-left">
        <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          In your full reading
        </p>
        <ul className="space-y-2 text-sm text-teal-900/70">
          <li>Your inner critic&apos;s favorite trick — named</li>
          <li>
            What your {name.replace(/^The\s+/, "")} pattern means day to day
          </li>
          <li>How a daily practice would meet you where you are</li>
        </ul>
      </section>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={onUnlock}
          className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
        >
          Unlock my full reading
        </Button>
        <p className="text-xs text-teal-900/50">
          Free. We&apos;ll ask for your email so it&apos;s yours to keep.
        </p>
      </div>
    </motion.div>
  );
}
