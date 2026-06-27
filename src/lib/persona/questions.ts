/**
 * Single source of truth for the archetype-discovery quiz.
 *
 * The UI renders options from this config and the scoring logic (score.ts)
 * consumes the same config — so copy edits never touch scoring logic, and
 * client/server scoring can never drift.
 *
 * Scoring weights are transcribed verbatim from the PRD
 * (docs/prds/2026-06-11-onboarding-v2.md, screens 9–11).
 *
 * NOTE FOR FOUNDER COPY REVIEW: the PRD's screen 11 ("Inner voice") lists five
 * options that each score a distortion, with no neutral choice — which makes the
 * "no inner-critic pattern" reveal path (primary_distortion = null) unreachable
 * even though the PRD explicitly describes it. We added a confident option
 * (`no_pattern`) to screen 11, mirroring the confident options already present on
 * screens 9 (`usually_get_there`) and 10 (`no_doubt`). Review/replace this copy
 * before launch.
 */

import type {
  ChangeStyle,
  Distortion,
  IntentionCategory,
  MotivationOrientation,
  TonePreference,
  ValueId,
} from "./types";

/** Bump when the scoring map or option set changes; stored alongside raw answers. */
export const QUIZ_VERSION = 1;

export interface ScoredOption {
  id: string;
  label: string;
  /** Distortion weights this option contributes. */
  weights?: Partial<Record<Distortion, number>>;
  /** High-confidence / no-distortion choice (stored as signal; contributes no score). */
  confident?: boolean;
  /** Cannot be combined with other selections (screen 10 "no doubt comes up"). */
  exclusive?: boolean;
}

// Screen 4 — Dream category. Maps 1:1 to message_themes category enum.
export interface CategoryOption {
  id: IntentionCategory;
  label: string;
}
export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "career", label: "Career & work" },
  { id: "health", label: "Health & body" },
  { id: "relationships", label: "Love & relationships" },
  { id: "money", label: "Money & abundance" },
  { id: "creative", label: "Creative expression" },
  { id: "identity", label: "Who I'm becoming" },
  { id: "family", label: "Family & home" },
  { id: "spiritual", label: "Spiritual growth" },
];

// Screen 7 — Motivation orientation.
export interface OrientationOption {
  id: MotivationOrientation;
  label: string;
}
export const ORIENTATION_OPTIONS: OrientationOption[] = [
  { id: "toward", label: "I'm reaching toward something I can almost see" },
  { id: "away", label: "I'm ready to leave something behind" },
];

// Screen 8 — Change style.
export interface StyleOption {
  id: ChangeStyle;
  label: string;
}
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "dreamer",
    label: "The doing. I can picture it vividly; following through is the work",
  },
  {
    id: "doer",
    label:
      "The believing. I take action constantly; trusting it will work is the work",
  },
];

// Screen 9 — Past pattern (single select).
export const PAST_PATTERN_OPTIONS: ScoredOption[] = [
  {
    id: "lose_steam",
    label: "I start strong, then lose steam",
    weights: { all_or_nothing: 1 },
  },
  {
    id: "perfect_moment",
    label: "I wait for the perfect moment, and it never quite comes",
    weights: { all_or_nothing: 1, catastrophizing: 1 },
  },
  {
    id: "talk_myself_out",
    label: "I get close, then talk myself out of it",
    weights: { worthiness: 1 },
  },
  {
    id: "never_tried",
    label: "Honestly, I've never let myself really try",
    weights: { worthiness: 1, catastrophizing: 1 },
  },
  {
    id: "usually_get_there",
    label: "I usually get there — I'm here for what's next",
    confident: true,
  },
];

// Screen 10 — First doubt (pick up to FIRST_DOUBT_MAX).
export const FIRST_DOUBT_MAX = 2;
export const FIRST_DOUBT_OPTIONS: ScoredOption[] = [
  {
    id: "who_am_i",
    label: "Who am I to want this?",
    weights: { worthiness: 2 },
  },
  {
    id: "too_late",
    label: "It's probably too late for me",
    weights: { catastrophizing: 2 },
  },
  {
    id: "not_perfect",
    label: "If I can't do it perfectly, why start?",
    weights: { all_or_nothing: 2 },
  },
  {
    id: "judge_me",
    label: "People will judge me for trying",
    weights: { mind_reading: 2 },
  },
  {
    id: "lose_it",
    label: "Even if I get it, I'll lose it",
    weights: { catastrophizing: 2 },
  },
  {
    id: "selfish",
    label: "Wanting more feels selfish",
    weights: { personalization: 2 },
  },
  {
    id: "no_doubt",
    label: "Honestly? No doubt comes up",
    confident: true,
    exclusive: true,
  },
];

// Screen 11 — Inner voice (single select). See founder-copy note at top of file re: `no_pattern`.
export const INNER_VOICE_OPTIONS: ScoredOption[] = [
  {
    id: "always_do_this",
    label: "You always do this.",
    weights: { all_or_nothing: 2 },
  },
  {
    id: "tried_harder",
    label: "You should have tried harder.",
    weights: { should_statements: 2 },
  },
  {
    id: "never_work",
    label: "See? It was never going to work.",
    weights: { catastrophizing: 2 },
  },
  {
    id: "saw_coming",
    label: "Everyone saw that coming.",
    weights: { mind_reading: 2 },
  },
  {
    id: "mostly_luck",
    label: "Even when it works, it's mostly luck.",
    weights: { discounting_positive: 2 },
  },
  {
    id: "no_pattern",
    label: "Honestly, it doesn't pile on like that.",
    confident: true,
  },
];

// Screen 12 — Values (pick VALUES_PICK).
export const VALUES_PICK = 3;
export interface ValueOption {
  id: ValueId;
  label: string;
}
export const VALUE_OPTIONS: ValueOption[] = [
  { id: "freedom", label: "Freedom" },
  { id: "growth", label: "Growth" },
  { id: "connection", label: "Connection" },
  { id: "peace", label: "Peace" },
  { id: "adventure", label: "Adventure" },
  { id: "creativity", label: "Creativity" },
  { id: "security", label: "Security" },
  { id: "achievement", label: "Achievement" },
  { id: "service", label: "Service" },
  { id: "recognition", label: "Recognition" },
];

// Screen 13 — Tone preference.
export interface ToneOption {
  id: TonePreference;
  label: string;
}
export const TONE_OPTIONS: ToneOption[] = [
  { id: "gentle", label: "Gentle encouragement" },
  { id: "direct", label: "Straight-up honesty" },
  { id: "socratic", label: "Questions that make me think" },
  { id: "celebratory", label: "Celebrating the small wins" },
];

/**
 * Archetype = motivation orientation × change style.
 */
export const ARCHETYPE_MAP: Record<
  MotivationOrientation,
  Record<ChangeStyle, "visionary" | "alchemist" | "seeker" | "phoenix">
> = {
  toward: { dreamer: "visionary", doer: "alchemist" },
  away: { dreamer: "seeker", doer: "phoenix" },
};

/**
 * Fixed tie-break priority for the primary distortion, applied only after the
 * score tie and the inner-voice answer both fail to resolve (PRD §"The persona model").
 */
export const DISTORTION_PRIORITY: Distortion[] = [
  "worthiness",
  "all_or_nothing",
  "catastrophizing",
  "should_statements",
  "mind_reading",
  "discounting_positive",
  "personalization",
];

/** A distortion must reach this score to qualify as the secondary pattern. */
export const SECONDARY_MIN_SCORE = 2;
