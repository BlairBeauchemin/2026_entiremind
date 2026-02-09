"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Target } from "lucide-react";
import { createInitialIntention } from "@/lib/onboarding/actions";
import { useRouter } from "next/navigation";

interface IntentionStepProps {
  onBack: () => void;
}

export function IntentionStep({ onBack }: IntentionStepProps) {
  const [intention, setIntention] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

    router.push("/dashboard");
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
            <Target className="w-6 h-6 text-em-purple-400" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium">
          What do you want to manifest?
        </h1>
        <p className="text-teal-900/60 text-sm">
          Share your intention. This is the beginning of your journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="intention"
            className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
          >
            Your Intention
          </Label>
          <textarea
            id="intention"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="I want to manifest..."
            rows={4}
            className="w-full px-4 py-3 bg-white/60 border border-white/60 rounded-xl text-navy placeholder:text-teal-900/30 resize-none focus:outline-none focus:ring-2 focus:ring-em-purple-300/30"
            autoFocus
          />
        </div>

        <p className="text-xs text-teal-900/40 italic">
          &quot;What you seek is seeking you.&quot; — Rumi
        </p>

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
            disabled={isLoading}
            className="flex-1 h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Begin My Journey"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
