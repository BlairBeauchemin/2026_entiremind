"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export interface TapOption {
  id: string;
  label: string;
  /** Cannot be combined with other selections (e.g. "no doubt comes up"). */
  exclusive?: boolean;
}

interface TapQuestionStepProps {
  title: string;
  subtitle?: string;
  options: TapOption[];
  mode: "single" | "multi";
  /** Max selections in multi mode. */
  max?: number;
  selected: string[];
  onSelect: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  /** Continue button label (multi mode only). */
  continueLabel?: string;
  /** Delay before single-select auto-advance. */
  autoAdvanceMs?: number;
}

/**
 * Generic tap-to-answer step rendered from questions.ts config.
 * Single-select auto-advances; multi-select uses an explicit Continue button
 * and enforces max + exclusive-option rules.
 */
export function TapQuestionStep({
  title,
  subtitle,
  options,
  mode,
  max,
  selected,
  onSelect,
  onNext,
  onBack,
  continueLabel = "Continue",
  autoAdvanceMs = 250,
}: TapQuestionStepProps) {
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function handleSingle(id: string) {
    onSelect([id]);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onNext, autoAdvanceMs);
  }

  function handleMulti(option: TapOption) {
    const isSelected = selected.includes(option.id);
    if (isSelected) {
      onSelect(selected.filter((id) => id !== option.id));
      return;
    }
    if (option.exclusive) {
      onSelect([option.id]);
      return;
    }
    // Selecting a normal option drops any exclusive selection already held.
    const withoutExclusive = selected.filter((id) => {
      const opt = options.find((o) => o.id === id);
      return !opt?.exclusive;
    });
    if (max !== undefined && withoutExclusive.length >= max) return;
    onSelect([...withoutExclusive, option.id]);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="font-serif text-2xl md:text-3xl text-ink">{title}</h1>
        {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() =>
                mode === "single"
                  ? handleSingle(option.id)
                  : handleMulti(option)
              }
              className={`w-full text-left px-4 py-3 rounded-sm border transition-colors ${
                isSelected
                  ? "bg-cobalt-wash border-cobalt text-ink"
                  : "bg-surface border-rule text-ink hover:border-cobalt"
              }`}
            >
              {option.label}
            </button>
          );
        })}
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
        {mode === "multi" && (
          <Button
            type="button"
            onClick={onNext}
            disabled={selected.length === 0}
            className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium disabled:opacity-40"
          >
            {continueLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
