/**
 * Build the welcome SMS body. Pure (no SDK) so it can be unit-tested in
 * isolation. When an archetype line is supplied (Onboarding v2), it replaces
 * the generic enrollment sentence; the carrier-compliance tail is always kept.
 */
export function buildWelcomeMessage(
  userName: string,
  archetypeLine?: string,
): string {
  const name = userName.trim() || "friend";
  const body =
    archetypeLine?.trim() || "You're enrolled in daily reflection prompts.";
  const compliance =
    "Up to 2 msgs/day. Msg & data rates may apply. Reply HELP for help or STOP to cancel.";
  return `Welcome to Entiremind, ${name}! ${body} ${compliance}`;
}
