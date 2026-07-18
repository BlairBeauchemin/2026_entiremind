/**
 * Public-quiz share copy, keyed by archetype. Sits alongside ARCHETYPE_PUBLIC
 * (content.ts) which owns the shareable /archetype/[slug] page copy — this
 * module owns the quiz-specific moments: the partial-reveal hook shown before
 * the email gate, and the pre-written share text.
 *
 * FOUNDER COPY REVIEW: v1 draft, same review rule as content.ts. Everything
 * here is public surface — never include inner-critic/distortion content.
 */
import type { Archetype } from "./types";
import { ARCHETYPE_PUBLIC } from "./content";
import { absoluteUrl } from "@/config/site";

export interface QuizShareContent {
  /** One-line partial-reveal hook — the "feel seen" moment before the gate. */
  hookLine: string;
  /** Pre-written share text (share sheet / clipboard). */
  shareText: string;
}

export const QUIZ_SHARE: Record<Archetype, QuizShareContent> = {
  visionary: {
    hookLine:
      "You see it before it exists — and that changes how everything else should work.",
    shareText:
      "I'm The Visionary — I see it before it exists. Find your manifestation archetype:",
  },
  alchemist: {
    hookLine:
      "You turn intention into motion — most people are still waiting to feel ready.",
    shareText:
      "I'm The Alchemist — I turn intention into motion. Find your manifestation archetype:",
  },
  seeker: {
    hookLine:
      "You know exactly what you're done with — that clarity is rarer than you think.",
    shareText:
      "I'm The Seeker — I know exactly what I'm done with. Find your manifestation archetype:",
  },
  phoenix: {
    hookLine:
      "You rebuild through action — endings don't diminish you, they fuel you.",
    shareText:
      "I'm The Phoenix — I rebuild through action. Find your manifestation archetype:",
  },
};

/** Public share URL for an archetype (the existing /archetype/[slug] pages). */
export function archetypeShareUrl(archetype: Archetype): string {
  return absoluteUrl(`/archetype/${archetype}`);
}

/** Display name shortcut, e.g. "The Visionary". */
export function archetypeDisplayName(archetype: Archetype): string {
  return ARCHETYPE_PUBLIC[archetype].name;
}
