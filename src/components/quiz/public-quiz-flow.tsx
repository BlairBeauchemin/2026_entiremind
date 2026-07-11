"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { CategoryStep } from "@/components/onboarding/steps/category-step";
import { TapQuestionStep } from "@/components/onboarding/steps/tap-question-step";
import { ValuesStep } from "@/components/onboarding/steps/values-step";
import { PartialReveal } from "./partial-reveal";
import { QuizGate } from "./quiz-gate";
import { FullReveal } from "./full-reveal";
import { scoreProfile } from "@/lib/persona/score";
import { analytics } from "@/lib/analytics";
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

/**
 * Public, no-auth archetype quiz (/quiz).
 *
 * Same eight tap screens as the authed ArchetypeFlow — identical step
 * components and questions.ts config, scored client-side by the same pure
 * scoreProfile(). What differs is the ending, designed around "partial value
 * before contact capture" (docs/design-philosophy.md):
 *
 *   taps → partial reveal (archetype name + hook — the feel-seen moment)
 *        → email gate (honest exchange: full reading for an email)
 *        → full reveal (the same reading onboarding users get) + share
 *
 * Answers persist to sessionStorage so a refresh doesn't lose progress.
 * Nothing here ever touches auth or user tables — leads only.
 */
const STEPS = [
  "category",
  "orientation",
  "style",
  "past_pattern",
  "first_doubt",
  "inner_voice",
  "values",
  "tone",
  "partial_reveal",
  "gate",
  "full_reveal",
] as const;

type QuizStep = (typeof STEPS)[number];

const STORAGE_KEY = "entiremind-public-quiz-v1";

interface StoredState {
  step: QuizStep;
  category: IntentionCategory | null;
  orientation: MotivationOrientation | null;
  style: ChangeStyle | null;
  pastPattern: string | null;
  firstDoubt: string[];
  innerVoice: string | null;
  coreValues: ValueId[];
  tone: TonePreference | null;
  /** Set once the gate has been submitted (so refresh keeps the full reveal). */
  unlockedName: string | null;
}

function loadStored(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    return null;
  }
}

export function PublicQuizFlow({ src }: { src: string | null }) {
  const router = useRouter();
  const stored = useMemo(loadStored, []);

  const [currentStep, setCurrentStep] = useState<QuizStep>(
    stored?.step ?? "category",
  );
  const [category, setCategory] = useState<IntentionCategory | null>(
    stored?.category ?? null,
  );
  const [orientation, setOrientation] = useState<MotivationOrientation | null>(
    stored?.orientation ?? null,
  );
  const [style, setStyle] = useState<ChangeStyle | null>(stored?.style ?? null);
  const [pastPattern, setPastPattern] = useState<string | null>(
    stored?.pastPattern ?? null,
  );
  const [firstDoubt, setFirstDoubt] = useState<string[]>(
    stored?.firstDoubt ?? [],
  );
  const [innerVoice, setInnerVoice] = useState<string | null>(
    stored?.innerVoice ?? null,
  );
  const [coreValues, setCoreValues] = useState<ValueId[]>(
    stored?.coreValues ?? [],
  );
  const [tone, setTone] = useState<TonePreference | null>(stored?.tone ?? null);
  const [unlockedName, setUnlockedName] = useState<string | null>(
    stored?.unlockedName ?? null,
  );

  const stepIndex = STEPS.indexOf(currentStep);

  // Fire quiz_start once per attempt (fresh sessions only).
  useEffect(() => {
    if (!stored) analytics.quizStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress on every change.
  useEffect(() => {
    try {
      const state: StoredState = {
        step: currentStep,
        category,
        orientation,
        style,
        pastPattern,
        firstDoubt,
        innerVoice,
        coreValues,
        tone,
        unlockedName,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode / storage full — the quiz still works, just won't survive refresh.
    }
  }, [
    currentStep,
    category,
    orientation,
    style,
    pastPattern,
    firstDoubt,
    innerVoice,
    coreValues,
    tone,
    unlockedName,
  ]);

  const goToNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) {
      analytics.quizStep(currentStep, stepIndex + 1);
      setCurrentStep(next);
    }
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setCurrentStep(prev);
  };

  const backFromFirst = () => router.push("/");

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

  const profile = answers ? scoreProfile(answers) : null;

  // Show the tap progress bar only through the question screens — the reveal
  // arc is a payoff, not a form.
  const showProgress = stepIndex < STEPS.indexOf("partial_reveal");

  return (
    <div className="space-y-8">
      {showProgress && (
        <OnboardingProgress currentStep={stepIndex} totalSteps={8} />
      )}

      <AnimatePresence mode="wait">
        {currentStep === "category" && (
          <CategoryStep
            key="category"
            selected={category}
            onSelect={setCategory}
            onNext={goToNext}
            onBack={backFromFirst}
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
            title="If a daily text could meet you anywhere, what helps most?"
            options={TONE_OPTIONS}
            mode="single"
            selected={tone ? [tone] : []}
            onSelect={(ids) => setTone(ids[0] as TonePreference)}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "partial_reveal" && profile && (
          <PartialReveal
            key="partial_reveal"
            profile={profile}
            onUnlock={goToNext}
          />
        )}
        {currentStep === "gate" && profile && answers && (
          <QuizGate
            key="gate"
            profile={profile}
            answers={answers}
            src={src}
            onUnlocked={(name) => {
              setUnlockedName(name);
              setCurrentStep("full_reveal");
            }}
            onBack={goBack}
          />
        )}
        {currentStep === "full_reveal" && profile && (
          <FullReveal
            key="full_reveal"
            profile={profile}
            name={unlockedName ?? ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
