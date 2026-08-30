"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VALUE_OPTIONS, VALUES_PICK } from "@/lib/persona/questions";
import type { ValueId } from "@/lib/persona/types";

interface ValuesStepProps {
  selected: ValueId[];
  onChange: (ids: ValueId[]) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Screen 12 — pick exactly VALUES_PICK values. Chip grid, explicit continue. */
export function ValuesStep({
  selected,
  onChange,
  onNext,
  onBack,
}: ValuesStepProps) {
  function toggle(id: ValueId) {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
      return;
    }
    if (selected.length >= VALUES_PICK) return;
    onChange([...selected, id]);
  }

  const complete = selected.length === VALUES_PICK;

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
          Pick the three that matter most — not the ones that should.
        </h1>
        <p className="text-muted text-sm">
          {selected.length} of {VALUES_PICK} chosen
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {VALUE_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          const atCap = !isSelected && complete;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              disabled={atCap}
              onClick={() => toggle(option.id)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-cobalt-wash border-cobalt text-ink"
                  : "bg-surface border-rule text-ink hover:border-cobalt"
              } ${atCap ? "opacity-40" : ""}`}
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
        <Button
          type="button"
          onClick={onNext}
          disabled={!complete}
          className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium disabled:opacity-40"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
