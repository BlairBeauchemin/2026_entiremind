"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mountain } from "lucide-react";

interface ObstaclesStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ObstaclesStep({
  value,
  onChange,
  onNext,
  onBack,
}: ObstaclesStepProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("Even something small. Naming it helps.");
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
          <div className="w-12 h-12 rounded-full bg-em-purple-300/20 flex items-center justify-center">
            <Mountain className="w-6 h-6 text-em-purple-400" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium">
          What&apos;s been getting in the way?
        </h1>
        <p className="text-teal-900/60 text-sm">
          The thing you keep bumping into. No need to fix it yet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="obstacles"
            className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
          >
            What&apos;s in the Way
          </Label>
          <textarea
            id="obstacles"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="It keeps coming up..."
            rows={4}
            className="w-full px-4 py-3 bg-white/60 border border-white/60 rounded-xl text-navy placeholder:text-teal-900/30 resize-none focus:outline-none focus:ring-2 focus:ring-em-purple-300/30"
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 px-4 border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
          >
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
