/**
 * Persona model types for Onboarding v2 (Archetype Discovery).
 *
 * Field naming mirrors the `user_profiles` table columns (snake_case),
 * consistent with the existing `UserMemorySummary` shape in src/lib/ai/memory.ts,
 * so the derived profile maps to the database without an intermediate layer.
 */

export const ARCHETYPES = [
  "visionary",
  "alchemist",
  "seeker",
  "phoenix",
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const MOTIVATION_ORIENTATIONS = ["toward", "away"] as const;
export type MotivationOrientation = (typeof MOTIVATION_ORIENTATIONS)[number];

export const CHANGE_STYLES = ["dreamer", "doer"] as const;
export type ChangeStyle = (typeof CHANGE_STYLES)[number];

/** Cognitive-distortion taxonomy (Burns), used as inner-critic patterns. */
export const DISTORTIONS = [
  "worthiness",
  "all_or_nothing",
  "catastrophizing",
  "should_statements",
  "mind_reading",
  "discounting_positive",
  "personalization",
] as const;
export type Distortion = (typeof DISTORTIONS)[number];

export const TONE_PREFERENCES = [
  "gentle",
  "direct",
  "socratic",
  "celebratory",
] as const;
export type TonePreference = (typeof TONE_PREFERENCES)[number];

/** Mirrors the `message_themes.category` enum (minus "other", which the free-text intention catches). */
export const INTENTION_CATEGORIES = [
  "career",
  "health",
  "relationships",
  "money",
  "creative",
  "identity",
  "family",
  "spiritual",
] as const;
export type IntentionCategory = (typeof INTENTION_CATEGORIES)[number];

export const VALUE_IDS = [
  "freedom",
  "growth",
  "connection",
  "peace",
  "adventure",
  "creativity",
  "security",
  "achievement",
  "service",
  "recognition",
] as const;
export type ValueId = (typeof VALUE_IDS)[number];

export type DistortionScores = Partial<Record<Distortion, number>>;

/**
 * The raw answers a user gives, stored verbatim in
 * `onboarding_responses.responses` so the profile can be re-derived if the
 * scoring map ever changes. Distortion-bearing screens (past_pattern,
 * first_doubt, inner_voice) reference option ids from questions.ts.
 */
export interface QuizAnswers {
  intention_category: IntentionCategory; // screen 4
  motivation_orientation: MotivationOrientation; // screen 7
  change_style: ChangeStyle; // screen 8
  past_pattern: string; // screen 9 — option id (single)
  first_doubt: string[]; // screen 10 — option ids (up to 2)
  inner_voice: string; // screen 11 — option id (single)
  core_values: ValueId[]; // screen 12 — pick 3
  tone_preference: TonePreference; // screen 13
}

/** Derived, deterministic profile. Pure output of scoreProfile(). */
export interface PersonaProfile {
  archetype: Archetype;
  motivation_orientation: MotivationOrientation;
  change_style: ChangeStyle;
  primary_distortion: Distortion | null;
  secondary_distortion: Distortion | null;
  distortion_scores: DistortionScores;
  core_values: ValueId[];
  tone_preference: TonePreference;
  intention_category: IntentionCategory;
}
