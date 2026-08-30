"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-cobalt-wash flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-cobalt" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          Welcome to Entiremind
        </h1>
        <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
          A space where your intentions become reality through gentle,
          consistent reflection.
        </p>
      </div>

      <p className="text-xs text-muted">
        Let&apos;s set up your experience in just a few steps.
      </p>

      <Button
        onClick={onNext}
        className="w-full h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium"
      >
        Get Started
      </Button>
    </motion.div>
  );
}
