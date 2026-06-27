"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { OnboardingProgress } from "./onboarding-progress";
import { WelcomeStep } from "./steps/welcome-step";
import { NameStep } from "./steps/name-step";
import { PhoneStep } from "./steps/phone-step";
import { CategoryStep } from "./steps/category-step";
import { IntentionStep } from "./steps/intention-step";
import { VisionStep } from "./steps/vision-step";
import { TapQuestionStep } from "./steps/tap-question-step";
import { ValuesStep } from "./steps/values-step";
import { AlignedStateStep } from "./steps/aligned-state-step";
import { RevealStep } from "./steps/reveal-step";
import { recordOnboardingStep } from "@/lib/onboarding/actions";
import { scoreProfile } from "@/lib/persona/score";
import {
  ORIENTATION_OPTIONS,
  STYLE_OPTIONS,
  PAST_PATTERN_OPTIONS,
  FIRST_DOUBT_OPTIONS,
  FIRST_DOUBT_MAX,
  INNER_VOICE_OPTIONS,
  TONE_OPTIONS,
} from "@/lib/persona/questions";
import type {
  ChangeStyle,
  IntentionCategory,
  MotivationOrientation,
  QuizAnswers,
  TonePreference,
  ValueId,
} from "@/lib/persona/types";

type OnboardingStep =
  | "welcome"
  | "name"
  | "phone"
  | "category"
  | "intention"
  | "vision"
  | "orientation"
  | "style"
  | "past_pattern"
  | "first_doubt"
  | "inner_voice"
  | "values"
  | "tone"
  | "aligned"
  | "reveal";

const STEPS: OnboardingStep[] = [
  "welcome",
  "name",
  "phone",
  "category",
  "intention",
  "vision",
  "orientation",
  "style",
  "past_pattern",
  "first_doubt",
  "inner_voice",
  "values",
  "tone",
  "aligned",
  "reveal",
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");

  // Accumulated answers (persisted together at completion).
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IntentionCategory | null>(null);
  const [vision, setVision] = useState("");
  const [orientation, setOrientation] = useState<MotivationOrientation | null>(
    null,
  );
  const [style, setStyle] = useState<ChangeStyle | null>(null);
  const [pastPattern, setPastPattern] = useState<string | null>(null);
  const [firstDoubt, setFirstDoubt] = useState<string[]>([]);
  const [innerVoice, setInnerVoice] = useState<string | null>(null);
  const [coreValues, setCoreValues] = useState<ValueId[]>([]);
  const [tone, setTone] = useState<TonePreference | null>(null);
  const [alignedState, setAlignedState] = useState("");

  const stepIndex = STEPS.indexOf(currentStep);

  // Best-effort drop-off tracking on each step entry.
  useEffect(() => {
    void recordOnboardingStep(currentStep);
  }, [currentStep]);

  const goToNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) setCurrentStep(STEPS[nextIndex]);
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(STEPS[prevIndex]);
  };

  const answers: QuizAnswers | null =
    category && orientation && style && pastPattern && innerVoice && tone
      ? {
          intention_category: category,
          motivation_orientation: orientation,
          change_style: style,
          past_pattern: pastPattern,
          first_doubt: firstDoubt,
          inner_voice: innerVoice,
          core_values: coreValues,
          tone_preference: tone,
        }
      : null;

  return (
    <div className="space-y-8">
      <OnboardingProgress currentStep={stepIndex} totalSteps={STEPS.length} />

      <AnimatePresence mode="wait">
        {currentStep === "welcome" && (
          <WelcomeStep key="welcome" onNext={goToNext} />
        )}
        {currentStep === "name" && (
          <NameStep
            key="name"
            onNext={goToNext}
            onBack={goBack}
            onNameChange={setName}
          />
        )}
        {currentStep === "phone" && (
          <PhoneStep key="phone" onNext={goToNext} onBack={goBack} />
        )}
        {currentStep === "category" && (
          <CategoryStep
            key="category"
            selected={category}
            onSelect={setCategory}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "intention" && (
          <IntentionStep key="intention" onNext={goToNext} onBack={goBack} />
        )}
        {currentStep === "vision" && (
          <VisionStep
            key="vision"
            value={vision}
            onChange={setVision}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "orientation" && (
          <TapQuestionStep
            key="orientation"
            title="Which feels more true right now?"
            options={ORIENTATION_OPTIONS}
            mode="single"
            selected={orientation ? [orientation] : []}
            onSelect={(ids) => setOrientation(ids[0] as MotivationOrientation)}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "style" && (
          <TapQuestionStep
            key="style"
            title="Be honest — which is harder for you?"
            options={STYLE_OPTIONS}
            mode="single"
            selected={style ? [style] : []}
            onSelect={(ids) => setStyle(ids[0] as ChangeStyle)}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "past_pattern" && (
          <TapQuestionStep
            key="past_pattern"
            title="When you've gone after big things before, what usually happened?"
            options={PAST_PATTERN_OPTIONS}
            mode="single"
            selected={pastPattern ? [pastPattern] : []}
            onSelect={(ids) => setPastPattern(ids[0])}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "first_doubt" && (
          <TapQuestionStep
            key="first_doubt"
            title="When you imagine actually having this, what's the first whisper of doubt?"
            subtitle="Pick up to two."
            options={FIRST_DOUBT_OPTIONS}
            mode="multi"
            max={FIRST_DOUBT_MAX}
            selected={firstDoubt}
            onSelect={setFirstDoubt}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "inner_voice" && (
          <TapQuestionStep
            key="inner_voice"
            title="When something goes wrong, what does the voice in your head usually say?"
            options={INNER_VOICE_OPTIONS}
            mode="single"
            selected={innerVoice ? [innerVoice] : []}
            onSelect={(ids) => setInnerVoice(ids[0])}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "values" && (
          <ValuesStep
            key="values"
            selected={coreValues}
            onChange={setCoreValues}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "tone" && (
          <TapQuestionStep
            key="tone"
            title="When we text you, what helps most?"
            options={TONE_OPTIONS}
            mode="single"
            selected={tone ? [tone] : []}
            onSelect={(ids) => setTone(ids[0] as TonePreference)}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "aligned" && (
          <AlignedStateStep
            key="aligned"
            value={alignedState}
            onChange={setAlignedState}
            onNext={goToNext}
            onSkip={() => {
              setAlignedState("");
              goToNext();
            }}
            onBack={goBack}
          />
        )}
        {currentStep === "reveal" && answers && (
          <RevealStep
            key="reveal"
            profile={scoreProfile(answers)}
            answers={answers}
            name={name}
            vision={vision}
            alignedState={alignedState.trim() ? alignedState.trim() : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
