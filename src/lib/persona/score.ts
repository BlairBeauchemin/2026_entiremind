/**
 * Pure, deterministic scoring of quiz answers into a PersonaProfile.
 *
 * Used by both the client (to render the reveal instantly) and the server
 * (authoritative persistence) — same function, so the two can never drift.
 * No LLM calls, no side effects.
 */

import {
  ARCHETYPE_MAP,
  DISTORTION_PRIORITY,
  FIRST_DOUBT_OPTIONS,
  INNER_VOICE_OPTIONS,
  PAST_PATTERN_OPTIONS,
  SECONDARY_MIN_SCORE,
  type ScoredOption,
} from "./questions";
import type {
  Distortion,
  DistortionScores,
  PersonaProfile,
  QuizAnswers,
} from "./types";

const VALUES_KEEP = 3;

function optionById(
  options: ScoredOption[],
  id: string,
): ScoredOption | undefined {
  return options.find((o) => o.id === id);
}

function applyWeights(
  scores: DistortionScores,
  option: ScoredOption | undefined,
): void {
  if (!option?.weights) return;
  for (const [distortion, weight] of Object.entries(option.weights)) {
    const key = distortion as Distortion;
    scores[key] = (scores[key] ?? 0) + (weight ?? 0);
  }
}

/** The single distortion an inner-voice option points to, if any. */
function innerVoiceDistortion(innerVoiceId: string): Distortion | null {
  const option = optionById(INNER_VOICE_OPTIONS, innerVoiceId);
  if (!option?.weights) return null;
  return (Object.keys(option.weights) as Distortion[])[0] ?? null;
}

function highestScoring(entries: Array<[Distortion, number]>): Distortion[] {
  const max = Math.max(...entries.map(([, v]) => v));
  return entries.filter(([, v]) => v === max).map(([d]) => d);
}

function resolvePrimary(
  scores: DistortionScores,
  innerVoice: Distortion | null,
): Distortion | null {
  const entries = Object.entries(scores) as Array<[Distortion, number]>;
  if (entries.length === 0) return null;

  const tied = highestScoring(entries);
  if (tied.length === 1) return tied[0];

  // Tie-break 1: the inner-voice answer, when it's among the tied top.
  if (innerVoice && tied.includes(innerVoice)) return innerVoice;
  // Tie-break 2: fixed priority order from the PRD.
  return DISTORTION_PRIORITY.find((d) => tied.includes(d)) ?? tied[0];
}

function resolveSecondary(
  scores: DistortionScores,
  primary: Distortion | null,
): Distortion | null {
  if (!primary) return null;
  const candidates = (
    Object.entries(scores) as Array<[Distortion, number]>
  ).filter(([d, v]) => d !== primary && v >= SECONDARY_MIN_SCORE);
  if (candidates.length === 0) return null;

  const tied = highestScoring(candidates);
  if (tied.length === 1) return tied[0];
  return DISTORTION_PRIORITY.find((d) => tied.includes(d)) ?? tied[0];
}

export function scoreProfile(answers: QuizAnswers): PersonaProfile {
  const scores: DistortionScores = {};
  applyWeights(scores, optionById(PAST_PATTERN_OPTIONS, answers.past_pattern));
  for (const id of answers.first_doubt) {
    applyWeights(scores, optionById(FIRST_DOUBT_OPTIONS, id));
  }
  applyWeights(scores, optionById(INNER_VOICE_OPTIONS, answers.inner_voice));

  const primary = resolvePrimary(
    scores,
    innerVoiceDistortion(answers.inner_voice),
  );
  const secondary = resolveSecondary(scores, primary);

  return {
    archetype:
      ARCHETYPE_MAP[answers.motivation_orientation][answers.change_style],
    motivation_orientation: answers.motivation_orientation,
    change_style: answers.change_style,
    primary_distortion: primary,
    secondary_distortion: secondary,
    distortion_scores: scores,
    core_values: answers.core_values.slice(0, VALUES_KEEP),
    tone_preference: answers.tone_preference,
    intention_category: answers.intention_category,
  };
}
