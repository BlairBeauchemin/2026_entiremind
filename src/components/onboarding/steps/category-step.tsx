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
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium">
          What part of life is calling you right now?
        </h1>
        <p className="text-teal-900/60 text-sm">
          Tap the one that pulls hardest.
        </p>
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
              className={`text-center px-3 py-4 rounded-xl border text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-em-purple-300/30 border-em-purple-400 text-navy"
                  : "bg-white/60 border-white/60 text-teal-900/80 hover:bg-white/80"
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
          className="h-12 px-4 border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
