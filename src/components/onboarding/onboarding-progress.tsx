"use client";

import { motion } from "framer-motion";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * The colour lives in Tailwind classes rather than in framer's `animate`.
 * It was previously animated as the literal `rgb(32, 65, 71)` — retired teal —
 * which survived the palette migration precisely because an rgb() string inside
 * a JS prop is invisible to both a class-name sweep and the design detector.
 * Keeping colour in classes means the next palette change reaches it.
 */
export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep + 1}
      aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          initial={false}
          animate={{ scale: index === currentStep ? 1.2 : 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            index <= currentStep ? "bg-cobalt" : "bg-rule"
          }`}
        />
      ))}
    </div>
  );
}
