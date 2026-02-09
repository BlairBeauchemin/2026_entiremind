"use client";

import { motion } from "framer-motion";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          initial={false}
          animate={{
            scale: index === currentStep ? 1.2 : 1,
            backgroundColor:
              index <= currentStep
                ? "rgb(32, 65, 71)"
                : "rgba(32, 65, 71, 0.2)",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-2 h-2 rounded-full"
        />
      ))}
    </div>
  );
}
