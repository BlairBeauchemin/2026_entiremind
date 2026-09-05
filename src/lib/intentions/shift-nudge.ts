import { absoluteUrl } from "@/config/site";

/**
 * Intention-shift nudges.
 *
 * The weekly memory pass can notice that what someone actually talks about has
 * drifted away from the intention they set. When it does, we tell *them* — and
 * that is all we do.
 *
 * The intention is never rewritten by the system, and never by the founder on
 * the user's behalf. It is the one thing in the product the user authored, and
 * quietly editing it would fail the trusted-friend test in
 * docs/design-philosophy.md. This is the same rule `src/lib/ai/steer.ts` states
 * for explicit topic steers ("the steer never rewrites the intention itself"),
 * applied to the detection path.
 *
 * Sent at most once per detected shift — see `hasBeenNudged`. A weekly
 * "are you sure about your goal?" text would be nagging, which the brand
 * promise rules out outright.
 */

/** Where the nudge sends people to make the change themselves. */
export const INTENTION_EDIT_PATH = "/dashboard/intentions";

/**
 * The nudge copy. Template-based on purpose: this message makes a claim about
 * someone's life, so it should be plain and identical every time rather than
 * freshly improvised by a model.
 *
 * It observes and offers. It must never imply we changed anything, and never
 * tell the user what their intention should be.
 */
export function buildIntentionShiftNudge(
  proposedIntention: string,
  name: string | null = null,
): string {
  const greeting = name ? `${name}, ` : "";
  const url = absoluteUrl(INTENTION_EDIT_PATH);
  return (
    `${greeting}I've noticed you keep coming back to ${trimFocus(proposedIntention)}. ` +
    `Your intention is still what you set at the start — if you'd like it to be ` +
    `this instead, you can change it here: ${url}`
  );
}

/**
 * The model returns a proposed intention as a full sentence ("I want to build a
 * sustainable creative practice"). The nudge reads it mid-sentence, so strip the
 * leading first-person framing and any trailing period.
 */
export function trimFocus(proposedIntention: string): string {
  return proposedIntention
    .trim()
    .replace(/^i\s+(want|would like|intend|hope|wish)\s+to\s+/i, "")
    .replace(/^i\s+am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .replace(/^(to|my intention is to)\s+/i, "")
    .replace(/[.!]+$/, "")
    .trim();
}
