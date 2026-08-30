"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/persona/questions";
import type { IntentionCategory } from "@/lib/persona/types";

interface CategoryStepProps {
  selected: IntentionCategory | null;
  onSelect: (id: IntentionCategory) => void;
  onNext: () => void;
  onBack: () => void;
  autoAdvanceMs?: number;
}

/** Screen 4 — pick the part of life calling them. Tile grid, auto-advances. */
export function CategoryStep({
  selected,
  onSelect,
  onNext,
  onBack,
  autoAdvanceMs = 250,
}: CategoryStepProps) {
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function handleSelect(id: IntentionCategory) {
    onSelect(id);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onNext, autoAdvanceMs);
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
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          What part of life is calling you right now?
        </h1>
        <p className="text-muted text-sm">Tap the one that pulls hardest.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(option.id)}
              className={`text-center px-3 py-4 rounded-sm border text-sm font-medium transition-colors ${
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

      <div className="flex">
        <Button
          type="button"
          variant="outline"
          aria-label="Go back"
          onClick={onBack}
          className="h-12 px-4 border-rule text-muted hover:bg-surface rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
