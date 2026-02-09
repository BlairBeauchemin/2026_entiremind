"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { OnboardingProgress } from "./onboarding-progress";
import { WelcomeStep } from "./steps/welcome-step";
import { NameStep } from "./steps/name-step";
import { PhoneStep } from "./steps/phone-step";
import { IntentionStep } from "./steps/intention-step";

type OnboardingStep = "welcome" | "name" | "phone" | "intention";

const STEPS: OnboardingStep[] = ["welcome", "name", "phone", "intention"];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");

  const stepIndex = STEPS.indexOf(currentStep);

  const goToNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  return (
    <div className="space-y-8">
      <OnboardingProgress currentStep={stepIndex} totalSteps={STEPS.length} />

      <AnimatePresence mode="wait">
        {currentStep === "welcome" && (
          <WelcomeStep key="welcome" onNext={goToNext} />
        )}
        {currentStep === "name" && (
          <NameStep key="name" onNext={goToNext} onBack={goBack} />
        )}
        {currentStep === "phone" && (
          <PhoneStep key="phone" onNext={goToNext} onBack={goBack} />
        )}
        {currentStep === "intention" && (
          <IntentionStep key="intention" onBack={goBack} />
        )}
      </AnimatePresence>
    </div>
  );
}
