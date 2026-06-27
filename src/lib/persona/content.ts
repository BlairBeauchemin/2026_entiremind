/**
 * Templated reveal copy — instant, free, brand-controlled (no LLM at reveal time).
 *
 * Shared by the reveal screen, the dashboard persona card, and the welcome SMS.
 * All slots (name, intention category, top value) are filled deterministically.
 *
 * FOUNDER COPY REVIEW: every string below is v1 draft. The PRD requires the
 * founder to review all reveal/archetype/pattern copy before launch. Friendly
 * names must never read as clinical labels in any user-facing surface.
 */

import { CATEGORY_OPTIONS, VALUE_OPTIONS } from "./questions";
import type {
  Archetype,
  Distortion,
  IntentionCategory,
  PersonaProfile,
  TonePreference,
  ValueId,
} from "./types";

interface RevealSlots {
  name: string;
}

export interface RevealContent {
  archetype: { name: string; paragraph: string };
  innerCritic: { name: string; oneLiner: string; howWeRespond: string } | null;
  howItWorks: string[];
}

const ARCHETYPE_NAMES: Record<Archetype, string> = {
  visionary: "The Visionary",
  alchemist: "The Alchemist",
  seeker: "The Seeker",
  phoenix: "The Phoenix",
};

/** Paragraph templates. `{name}`, `{category}`, and `{value}` are filled in. */
const ARCHETYPE_PARAGRAPHS: Record<Archetype, string> = {
  visionary:
    "{name}, you see it before it exists. You can already picture {category} the way you want it — vivid, specific, real. Your work isn't dreaming; it's building the bridge between that vision and an ordinary Tuesday. And because you move toward {value}, every step forward gets to feel like coming home rather than running away.",
  alchemist:
    "{name}, you turn intention into motion. You don't wait to feel ready — you act, and you act constantly. Your work is trusting the process while it's still invisible, before {category} shows the proof. With {value} guiding you, you already have the one ingredient most people are missing: momentum.",
  seeker:
    "{name}, you know exactly what you're done with. That clarity is rare — most people can't name what they're leaving. Your work now is letting the next thing become as vivid as the old pain: making {category} something you move toward, not just away from. {value} is the compass for that turn.",
  phoenix:
    "{name}, you rebuild through action. When something ends, you don't sit in the ashes — you start moving. Your work is making sure you're building toward {category}, not only away from what was. Anchored in {value}, this next version of your life can be a choice, not just a recovery.",
};

const DISTORTION_CONTENT: Record<
  Distortion,
  { name: string; oneLiner: string; howWeRespond: string }
> = {
  worthiness: {
    name: "The Imposter Whisper",
    oneLiner:
      "It asks “who are you to want this?” — as if wanting needed credentials.",
    howWeRespond:
      "When we hear the Imposter Whisper in your messages, we'll remind you that wanting is allowed — no permission slip required.",
  },
  all_or_nothing: {
    name: "The All-or-Nothing Trap",
    oneLiner:
      "It says if it's not perfect, it doesn't count. So nothing ever gets to count.",
    howWeRespond:
      "When we hear the All-or-Nothing Trap in your messages, we'll remind you that done is a form of perfect.",
  },
  catastrophizing: {
    name: "The Other Shoe",
    oneLiner:
      "It's always waiting for things to fall apart — so you never fully arrive.",
    howWeRespond:
      "When we hear the Other Shoe in your messages, we'll help you stay in the moment that's actually happening.",
  },
  should_statements: {
    name: "The Drill Sergeant",
    oneLiner: "It runs you on “shoulds” and never says “well done.”",
    howWeRespond:
      "When we hear the Drill Sergeant in your messages, we'll make room for the well-done it keeps skipping.",
  },
  mind_reading: {
    name: "The Invisible Audience",
    oneLiner:
      "It's sure everyone is watching and judging. Almost no one is watching.",
    howWeRespond:
      "When we hear the Invisible Audience in your messages, we'll gently bring the focus back to what you want.",
  },
  discounting_positive: {
    name: "The Luck Story",
    oneLiner:
      "Every win was a fluke; every loss was proof. Convenient math, isn't it?",
    howWeRespond:
      "When we hear the Luck Story in your messages, we'll help you give yourself the credit it keeps writing off.",
  },
  personalization: {
    name: "The Selfless Cage",
    oneLiner: "It says your wants come last. It calls that kindness.",
    howWeRespond:
      "When we hear the Selfless Cage in your messages, we'll remind you that your wants count too.",
  },
};

const TONE_HOW_IT_WORKS: Record<TonePreference, string> = {
  gentle: "Each morning, a short text meets you with gentle encouragement.",
  direct: "Each morning, a short text meets you with straight-up honesty.",
  socratic:
    "Each morning, a short text meets you with a question worth sitting with.",
  celebratory:
    "Each morning, a short text meets you celebrating how far you've come.",
};

function categoryPhrase(category: IntentionCategory): string {
  const phrases: Record<IntentionCategory, string> = {
    career: "your work",
    health: "your health",
    relationships: "your relationships",
    money: "your abundance",
    creative: "your creative life",
    identity: "who you're becoming",
    family: "your family and home",
    spiritual: "your spiritual growth",
  };
  return (
    phrases[category] ??
    CATEGORY_OPTIONS.find((c) => c.id === category)?.label ??
    "your life"
  );
}

function valueLabel(value: ValueId): string {
  return VALUE_OPTIONS.find((v) => v.id === value)?.label ?? value;
}

function fillParagraph(
  template: string,
  slots: { name: string; category: string; value: string },
): string {
  return template
    .replaceAll("{name}", slots.name)
    .replaceAll("{category}", slots.category)
    .replaceAll("{value}", slots.value);
}

export function buildRevealContent(
  profile: PersonaProfile,
  { name }: RevealSlots,
): RevealContent {
  const safeName = name.trim() || "Friend";
  const topValue = profile.core_values[0];

  const paragraph = fillParagraph(ARCHETYPE_PARAGRAPHS[profile.archetype], {
    name: safeName,
    category: categoryPhrase(profile.intention_category),
    value: topValue
      ? valueLabel(topValue).toLowerCase()
      : "what matters most to you",
  });

  const innerCritic = profile.primary_distortion
    ? DISTORTION_CONTENT[profile.primary_distortion]
    : null;

  return {
    archetype: { name: ARCHETYPE_NAMES[profile.archetype], paragraph },
    innerCritic,
    howItWorks: [
      TONE_HOW_IT_WORKS[profile.tone_preference],
      "Reply any time, in your own words — it's a journal that answers back.",
      "The more you share, the more it learns how you move and adapts to you.",
    ],
  };
}

/** Short archetype line for the welcome SMS (e.g., "Visionary energy. We see it."). */
export function buildWelcomeArchetypeLine(profile: PersonaProfile): string {
  const bare = ARCHETYPE_NAMES[profile.archetype].replace(/^The\s+/, "");
  return `${bare} energy. We see it. Your first prompt lands tomorrow morning.`;
}

export { ARCHETYPE_NAMES, DISTORTION_CONTENT };
