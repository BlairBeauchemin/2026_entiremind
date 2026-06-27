/**
 * Renders a derived PersonaProfile into a compact (~80 token) guidance block
 * for the daily-prompt model. Pure and deterministic, so it caches alongside
 * the memory block. Internal model guidance only — never user-facing — but it
 * still avoids clinical labels so the model never echoes them back.
 */

import { ARCHETYPE_NAMES } from "./content";
import { VALUE_OPTIONS } from "./questions";
import type {
  Archetype,
  Distortion,
  MotivationOrientation,
  PersonaProfile,
  TonePreference,
  ValueId,
} from "./types";

const ARCHETYPE_HINT: Record<Archetype, string> = {
  visionary: "sees it before it exists; follow-through is their growth edge",
  alchemist:
    "acts constantly; trusting the process is their growth edge — honor the effort",
  seeker:
    "knows what they're leaving; making the next thing vivid is their growth edge",
  phoenix:
    "rebuilds through action; building toward (not just away) is their growth edge — honor the effort",
};

const ORIENTATION_LINE: Record<MotivationOrientation, string> = {
  toward: "Moving toward what they want (not away from pain) — frame forward",
  away: "Moving away from something they're done with — honor the leaving, then point them forward",
};

/** Plain-language, non-clinical hints for the model's internal guidance. */
const DISTORTION_HINT: Record<Distortion, string> = {
  worthiness: "a worthiness doubt — “who am I to want this?”",
  all_or_nothing: "all-or-nothing thinking",
  catastrophizing: "bracing for the other shoe to drop",
  should_statements: "harsh “should” self-talk",
  mind_reading: "assuming others are watching and judging",
  discounting_positive: "writing off their wins as luck",
  personalization: "putting their own wants last",
};

const TONE_PHRASE: Record<TonePreference, string> = {
  gentle: "gentle encouragement",
  direct: "straight-up honesty",
  socratic: "questions that make them think",
  celebratory: "celebrating small wins",
};

function valueLabel(value: ValueId): string {
  return (
    VALUE_OPTIONS.find((v) => v.id === value)?.label ?? value
  ).toLowerCase();
}

/** Plain-language tone phrase, reused by the memory seed. */
export function tonePromptPhrase(tone: TonePreference): string {
  return TONE_PHRASE[tone];
}

/** Plain-language, non-clinical inner-critic hint, reused by the memory seed. */
export function distortionPromptHint(distortion: Distortion): string {
  return DISTORTION_HINT[distortion];
}

export function renderProfileForPrompt(profile: PersonaProfile): string {
  const lines: string[] = ["About this user:"];

  lines.push(
    `- Archetype: ${ARCHETYPE_NAMES[profile.archetype]} (${ARCHETYPE_HINT[profile.archetype]})`,
  );
  lines.push(`- ${ORIENTATION_LINE[profile.motivation_orientation]}`);

  if (profile.primary_distortion) {
    lines.push(
      `- Inner critic pattern: ${DISTORTION_HINT[profile.primary_distortion]}. ` +
        `Gently counter it when it shows up. Never name it clinically; never say “cognitive distortion”.`,
    );
  } else {
    lines.push(
      "- No strong inner-critic pattern surfaced — they carry baseline confidence. You can be a bit more challenge-oriented.",
    );
  }

  if (profile.core_values.length > 0) {
    lines.push(`- Values: ${profile.core_values.map(valueLabel).join(", ")}`);
  }

  lines.push(`- Tone preference: ${TONE_PHRASE[profile.tone_preference]}`);

  return lines.join("\n");
}
