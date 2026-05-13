import type { UserContext, ContentType } from "./types";
import { renderMemoryForPrompt } from "./memory";

/**
 * System prompt for message generation
 */
export const SYSTEM_PROMPT = `You are a thoughtful guide for Entiremind, an SMS-based manifestation and reflection system. Your role is to send brief, warm morning messages that help users align their thoughts and intentions.

Guidelines:
- Keep messages under 160 characters (SMS limit)
- Be warm and genuine, but not cheesy or overly enthusiastic
- Never use emojis
- End with a gentle question or invitation to reflect
- If you know the user's name, use it naturally (once, at the beginning)
- If you know their intention, subtly reference it without being repetitive
- Vary your tone and approach day to day
- Focus on what's possible, not what's lacking

Avoid:
- Productivity language ("crush it", "goals", "hustle")
- Corporate phrases ("circle back", "touch base")
- Excessive positivity ("amazing!", "incredible!")
- Cliches about manifestation or the law of attraction
- Questions that feel like homework`;

/**
 * Get a content-type-specific prompt addition
 */
export function getContentTypePrompt(contentType: ContentType): string {
  switch (contentType) {
    case "reflection":
      return "Generate a morning reflection prompt that invites introspection about their current state or intentions.";
    case "check-in":
      return "Generate a simple check-in question about how they're feeling or what's on their mind today.";
    case "action":
      return "Generate a gentle prompt that invites them to notice or do one small thing today related to their intention.";
    case "gratitude":
      return "Generate a prompt that invites reflection on something they're grateful for or something that's going well.";
    case "quote":
      return "Generate an original, short reflection or observation (not a famous quote) that might resonate with them.";
    default:
      return "Generate a warm morning message.";
  }
}

/**
 * Build the user prompt for message generation
 */
export function buildUserPrompt(context: UserContext, contentType: ContentType): string {
  const parts: string[] = [];

  // Add content type instruction
  parts.push(getContentTypePrompt(contentType));

  // Add user context
  if (context.name) {
    parts.push(`The user's name is ${context.name}.`);
  }

  if (context.intention) {
    parts.push(`Their stated intention is: "${context.intention}"`);
  }

  // Inject the compacted memory blob (refreshed weekly)
  if (context.memory) {
    parts.push(renderMemoryForPrompt(context.memory));
    parts.push(
      "Let the memory inform tone and direction, but do not quote it back to the user. Pick at most one thread to lean on; do not list themes."
    );
  }

  // Add engagement context for personalization
  if (context.consecutiveSilences >= 3) {
    parts.push("They haven't replied in a while. Keep it light and low-pressure.");
  } else if (context.engagementScore > 70) {
    parts.push("They've been engaged. You can go a bit deeper.");
  }

  parts.push("Remember: under 160 characters, no emojis, warm but not cheesy.");

  return parts.join("\n\n");
}

/**
 * Select a content type based on user engagement and randomness
 * Phase 1: Simple rotation with slight weighting
 */
export function selectContentType(context: UserContext): ContentType {
  const types: ContentType[] = ["reflection", "check-in", "action", "gratitude"];

  // Slight preference for simpler content if engagement is low
  if (context.consecutiveSilences >= 3) {
    // When disengaged, favor check-ins (lighter touch)
    return Math.random() < 0.5 ? "check-in" : types[Math.floor(Math.random() * types.length)];
  }

  // Otherwise, random selection
  return types[Math.floor(Math.random() * types.length)];
}
