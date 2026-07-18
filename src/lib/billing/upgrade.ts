import { createServiceRoleClient } from "../supabase";
import { loadUserMemory } from "../ai/memory";

/**
 * Trial-end upgrade path (Part A of
 * docs/plans/2026-07-04-monetization-growth.md).
 *
 * When a trial expires, the daily loop is replaced by at most two upgrade
 * messages: one at expiry, one follow-up a week later, then quiet. The first
 * message is personalized from the user's memory blob — the pitch is the
 * relationship itself. Deliberately template-based (no LLM call): this is
 * the one message where a hallucinated detail would be fatal to trust.
 */

const SETTINGS_URL = "https://www.entiremind.com/dashboard/settings";

export const UPGRADE_FOLLOWUP_DAYS = 7;
export const UPGRADE_MAX_MESSAGES = 2;

export type UpgradeNudge = "send-first" | "send-followup" | "none";

/**
 * Decide whether an expired user is due an upgrade message.
 * Pure — `upgradeSentAts` are the timestamps of prior upgrade messages sent
 * since the trial ended, newest first.
 */
export function decideUpgradeNudge(params: {
  upgradeSentAts: string[];
  now?: Date;
}): UpgradeNudge {
  const { upgradeSentAts } = params;
  const now = params.now ?? new Date();

  if (upgradeSentAts.length === 0) return "send-first";
  if (upgradeSentAts.length >= UPGRADE_MAX_MESSAGES) return "none";

  const lastSent = new Date(upgradeSentAts[0]).getTime();
  const daysSince = (now.getTime() - lastSent) / 86_400_000;
  return daysSince >= UPGRADE_FOLLOWUP_DAYS ? "send-followup" : "none";
}

/**
 * Timestamps of upgrade messages sent to this user since their trial ended,
 * newest first.
 */
export async function getUpgradeMessagesSince(
  userId: string,
  trialEndsAt: string,
): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .eq("content_type", "upgrade")
    .gte("created_at", trialEndsAt)
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => m.created_at);
}

/**
 * The trial-end message, personalized from memory when available.
 * Falls back gracefully when the user has no memory blob. `link` is the
 * tokenized one-tap upgrade URL; callers pass null when the link can't be
 * issued (missing secret) and the settings URL is used instead.
 */
export function buildTrialEndMessage(
  name: string | null,
  memoryTheme: string | null,
  link: string | null = null,
): string {
  // Duration-agnostic on purpose: trial lengths differ (10-day standard,
  // 14-day grandfathered), and this message must never state a wrong number.
  const greeting = name ? `${name}, our` : "Our";
  const middle = memoryTheme
    ? `You've told me about ${memoryTheme}, and where you're headed — I'd like to keep walking with you.`
    : `I've been glad to walk these first days with you — I'd like to keep going.`;
  return (
    `${greeting} first days together are up. ${middle} ` +
    `Continue here: ${link ?? SETTINGS_URL}`
  );
}

/** The single follow-up, a week later. Softer; last word. */
export function buildUpgradeFollowupMessage(
  name: string | null,
  link: string | null = null,
): string {
  const greeting = name ? `${name} — no` : "No";
  return (
    `${greeting} pressure from me, just leaving the door open. ` +
    `Everything you shared is saved, and the daily practice picks right back up ` +
    `whenever you do: ${link ?? SETTINGS_URL}`
  );
}

/**
 * Pick the most usable memory theme for personalization: first theme that
 * isn't an internal scaffold line (seed memories store "working toward: ..."
 * entries that read poorly mid-sentence).
 */
export async function loadUpgradeTheme(userId: string): Promise<string | null> {
  const memory = await loadUserMemory(userId);
  if (!memory) return null;
  const theme = memory.themes.find(
    (t) => !t.includes(":") && t.trim().length > 0 && t.length <= 60,
  );
  return theme ?? null;
}
