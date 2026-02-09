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
        <div className="w-16 h-16 rounded-full bg-em-purple-300/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-em-purple-400" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium">
          Welcome to Entiremind
        </h1>
        <p className="text-teal-900/60 text-sm leading-relaxed max-w-xs mx-auto">
          A space where your intentions become reality through gentle,
          consistent reflection.
        </p>
      </div>

      <p className="text-xs text-teal-900/40">
        Let&apos;s set up your experience in just a few steps.
      </p>

      <Button
        onClick={onNext}
        className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
      >
        Get Started
      </Button>
    </motion.div>
  );
}
