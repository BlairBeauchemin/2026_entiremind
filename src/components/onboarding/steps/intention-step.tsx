"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Target } from "lucide-react";
import { createInitialIntention } from "@/lib/onboarding/actions";

interface IntentionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function IntentionStep({ onNext, onBack }: IntentionStepProps) {
  const [intention, setIntention] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!intention.trim()) {
      setError("Please share what you want to manifest");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createInitialIntention(intention.trim());

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

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
            <Target className="w-6 h-6 text-cobalt" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          What do you want to manifest?
        </h1>
        <p className="text-muted text-sm">
          Share your intention. This is the beginning of your journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="intention"
            className="text-[10px] font-medium uppercase tracking-widest text-muted"
          >
            Your Intention
          </Label>
          <textarea
            id="intention"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="I want to manifest..."
            rows={4}
            className="w-full px-4 py-3 bg-surface border border-rule rounded-sm text-ink placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-cobalt"
            autoFocus
          />
        </div>

        <p className="text-xs text-muted italic">
          &quot;What you seek is seeking you.&quot; — Rumi
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

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
            disabled={isLoading}
            className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
