"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun } from "lucide-react";

interface VisionStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VisionStep({
  value,
  onChange,
  onNext,
  onBack,
}: VisionStepProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("Take a moment to picture it");
      return;
    }
    setError(null);
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
            <Sun className="w-6 h-6 text-cobalt" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          If it came true — what would an ordinary Tuesday look like?
        </h1>
        <p className="text-muted text-sm">
          Not the highlight reel. The quiet, everyday texture of that life.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="vision"
            className="text-[10px] font-medium uppercase tracking-widest text-muted"
          >
            Your Vision
          </Label>
          <textarea
            id="vision"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="In that life, I..."
            rows={4}
            className="w-full px-4 py-3 bg-surface border border-rule rounded-sm text-ink placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-cobalt"
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
            className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium"
          >
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
