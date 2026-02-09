"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { updateOnboardingName } from "@/lib/onboarding/actions";

interface NameStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function NameStep({ onNext, onBack }: NameStepProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await updateOnboardingName(name.trim());

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
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium">
          What should we call you?
        </h1>
        <p className="text-teal-900/60 text-sm">
          This is how we&apos;ll greet you in messages.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
          >
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="h-12 bg-white/60 border-white/60 rounded-xl text-navy placeholder:text-teal-900/30"
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
            disabled={isLoading}
            className="flex-1 h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
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
