import type { UserContext } from "../types";

/** Ceiling asked of the model. Tighter than the DB ceiling on purpose — a
 *  drafted line should be shorter than the longest thing a user could write. */
export const DRAFT_MAX_LENGTH = 90;
export const DRAFT_MIN_COUNT = 3;
export const DRAFT_MAX_COUNT = 5;

export const AFFIRMATION_SYSTEM_PROMPT = `You draft affirmations for Entiremind, a manifestation system. A user has opened a quiet, full-screen space where they sit with a few lines of their own and breathe. You are writing candidate lines for that space.

Return a single JSON object with this exact shape:
{
  "affirmations": string[]
}

Rules for every line:
- Between ${DRAFT_MIN_COUNT} and ${DRAFT_MAX_COUNT} lines. Each one under ${DRAFT_MAX_LENGTH} characters.
- First person, present tense. "I am", "I have", "I move", "I trust".
- NEVER future tense. No "I will", "I'm going to", "I am becoming", "one day".
- Each line must stand alone. No line may reference another.
- Plain sentences. No emojis, no hashtags, no quotation marks, no ALL CAPS, no exclamation marks.
- No numbering, no bullets, no labels — just the sentence.

Rules about content:
- Ground each line in what this specific user told us. Their words are better than yours. If they said "I want to stop shrinking in meetings", "I take up the room I'm in" is a good line; "I am confident" is a wasted one.
- Vary what each line is about. If you draft five lines that all say the user is enough, you have drafted one line five times.
- Write toward the obstacle, not around it. If they named a fear, one line should quietly answer it.
- No hustle. Nothing about grinding, crushing it, outworking anyone, or waking at 5am.
- No toxic positivity. Never deny a difficulty the user named. A line can hold both: "I am steady even on the days that ask a lot of me."
- Never promise an outcome the world controls ("I get the job", "they come back"). Anchor in the user's own posture, capacity, or attention.
- Nothing about health outcomes, money guarantees, or anyone else's behaviour changing.

These are proposals. The user will read them, keep the ones that land, and throw the rest away — so write lines worth keeping rather than lines that are merely safe.

Return only the JSON object. No prose before or after.`;

/**
 * Assemble everything we know about this user into the drafting prompt.
 *
 * Ordering is deliberate: the stated intention leads, because it is the thing
 * the user actually typed and chose; the compacted memory follows as texture.
 * Anything missing is simply omitted rather than sent as an empty header — a
 * prompt full of "Obstacles: none" invites the model to fill the silence.
 */
export function buildAffirmationPrompt(context: UserContext): string {
  const parts: string[] = [];

  if (context.name) {
    parts.push(`Name: ${context.name}`);
  }
  if (context.intention) {
    parts.push(
      `What they are working toward, in their words: "${context.intention}"`,
    );
  }

  const memory = context.memory;
  if (memory?.vision) {
    parts.push(`How they described the life they want: "${memory.vision}"`);
  }
  if (memory?.obstacles) {
    parts.push(`What they said gets in the way: "${memory.obstacles}"`);
  }
  if (memory?.themes?.length) {
    parts.push(
      `Recurring themes in their replies: ${memory.themes.join(", ")}`,
    );
  }
  if (memory?.recent_emotional_state) {
    parts.push(
      `How they have been feeling lately: ${memory.recent_emotional_state}`,
    );
  }

  const profile = context.profile;
  if (profile?.tone_preference) {
    parts.push(`Tone that lands with them: ${profile.tone_preference}`);
  }
  if (profile?.primary_distortion) {
    // Named for the model's benefit only — the output must never name it back.
    parts.push(
      `Their most common inner-critic pattern: ${profile.primary_distortion}. Write toward it without ever naming or explaining it.`,
    );
  }

  if (parts.length === 0) {
    return "We know almost nothing about this user yet. Draft general affirmations about steadiness, self-trust, and attention — concrete and plainly worded, not abstract.";
  }

  return `${parts.join("\n")}\n\nDraft affirmations for this person.`;
}
