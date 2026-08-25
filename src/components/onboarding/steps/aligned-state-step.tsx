"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles } from "lucide-react";

interface AlignedStateStepProps {
  value: string;
  onChange: (value: string) => void;
  /** Advance to the reveal, keeping the entered text. */
  onNext: () => void;
  /** Advance to the reveal without an answer (skippable question). */
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Screen 14 — "when do you feel most like yourself?" Skippable; it no longer
 * completes onboarding (the reveal does). Just collects optional tone material
 * and advances.
 */
export function AlignedStateStep({
  value,
  onChange,
  onNext,
  onSkip,
  onBack,
}: AlignedStateStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-cobalt-wash flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-cobalt" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          Last one: when do you feel most like yourself?
        </h1>
        <p className="text-muted text-sm">
          The moments where you&apos;re not performing. Where you&apos;re just
          here.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="aligned-state"
            className="text-[10px] font-medium uppercase tracking-widest text-muted"
          >
            Most Aligned
          </Label>
          <textarea
            id="aligned-state"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="I feel most like myself when..."
            rows={4}
            className="w-full px-4 py-3 bg-surface border border-rule rounded-sm text-ink placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-cobalt"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            aria-label="Go back"
            onClick={onBack}
            className="h-12 px-4 border-rule text-muted hover:bg-surface rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={!value.trim()}
            className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium disabled:opacity-40"
          >
            Continue
          </Button>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center text-sm text-muted hover:text-cobalt transition-colors"
        >
          Skip for now
        </button>
      </form>
    </motion.div>
  );
}
