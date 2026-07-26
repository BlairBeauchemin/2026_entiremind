import type { SupabaseClient } from "@supabase/supabase-js";
import { siteConfig, absoluteUrl } from "@/config/site";

/**
 * Explicit topic-steer support.
 *
 * When an inbound reply carries an explicit directive ("can we focus on
 * manifestation?"), enrichment surfaces it as `directive`. We persist it as a
 * short-lived `active_steer` on `user_memory` that the daily-prompt builder
 * injects at top priority, and — the first time within a steer window — we nudge
 * the user (in the ack) that they can make it their *main* intention in the app.
 *
 * The steer never rewrites the intention itself; that stays a user action.
 */

/** How long an active steer keeps shaping prompts before it decays. */
export const STEER_TTL_DAYS = 10;

export interface SteerState {
  active_steer: string | null;
  steer_set_at: string | null;
  steer_nudged: boolean;
}

/**
 * Pure predicate: is a steer set at `setAt` still within its TTL as of `asOf`?
 * A null/empty timestamp is never active.
 */
export function isSteerActive(
  setAt: string | null | undefined,
  asOf: Date = new Date(),
  ttlDays: number = STEER_TTL_DAYS,
): boolean {
  if (!setAt) return false;
  const set = new Date(setAt).getTime();
  if (Number.isNaN(set)) return false;
  const ageDays = (asOf.getTime() - set) / (24 * 3_600_000);
  return ageDays >= 0 && ageDays <= ttlDays;
}

/**
 * The acknowledgement sent the first time a user states a new steer. Confirms
 * we heard the redirect and points them to change their main intention in-app —
 * we never rewrite the intention automatically.
 */
export function buildSteerAck(directive: string): string {
  const settingsUrl = absoluteUrl("/dashboard/settings");
  return `Got it — I'll steer toward ${directive}. If you want to make it your main intention, you can set it in the app: ${settingsUrl}`;
}

/**
 * Load a user's current steer columns. Returns null when the row (or the steer
 * columns) don't exist yet — callers treat that as "no active steer".
 */
export async function loadSteerState(
  supabase: SupabaseClient,
  userId: string,
): Promise<SteerState | null> {
  const { data, error } = await supabase
    .from("user_memory")
    .select("active_steer, steer_set_at, steer_nudged")
    .eq("user_id", userId)
    .maybeSingle();

  // A missing column (migration 027 not yet applied) surfaces as an error here —
  // degrade gracefully so the webhook still acks and stores the reply.
  if (error || !data) return null;
  return {
    active_steer: (data.active_steer as string | null) ?? null,
    steer_set_at: (data.steer_set_at as string | null) ?? null,
    steer_nudged: Boolean(data.steer_nudged),
  };
}

/**
 * Record a directive as the user's active steer, and decide whether to nudge.
 * Returns the nudge ack text when this is the first directive of a fresh steer
 * window (new/expired steer, or a different topic), else null (a normal ack is
 * used instead). Persists via upsert so a user without a memory row still gets
 * one (summary defaults to '{}').
 */
export async function applyDirective(
  supabase: SupabaseClient,
  userId: string,
  directive: string,
  asOf: Date = new Date(),
): Promise<string | null> {
  const state = await loadSteerState(supabase, userId);

  const stillActive = isSteerActive(state?.steer_set_at, asOf);
  const sameTopic = stillActive && state?.active_steer === directive;
  const isNewWindow = !sameTopic;
  const shouldNudge = isNewWindow || !state?.steer_nudged;

  const { error } = await supabase.from("user_memory").upsert(
    {
      user_id: userId,
      active_steer: directive,
      steer_set_at: asOf.toISOString(),
      // Mark nudged when we're about to nudge; otherwise keep prior state.
      steer_nudged: shouldNudge ? true : (state?.steer_nudged ?? false),
      updated_at: asOf.toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    // Missing columns or write failure — don't block the ack. Return null so
    // the user still gets a normal acknowledgement.
    console.error(`Failed to persist steer for user ${userId}:`, error);
    return null;
  }

  return shouldNudge ? buildSteerAck(directive) : null;
}

/**
 * Load the active steer text for prompt injection, or null when there's no
 * fresh steer (or the columns don't exist yet). Tolerant of the pre-migration
 * schema so the daily generator is safe to deploy first.
 */
export async function loadActiveSteer(
  supabase: SupabaseClient,
  userId: string,
  asOf: Date = new Date(),
): Promise<string | null> {
  const state = await loadSteerState(supabase, userId);
  if (!state?.active_steer) return null;
  return isSteerActive(state.steer_set_at, asOf) ? state.active_steer : null;
}

/**
 * Clear a user's steer columns. Called after weekly compaction folds the steer
 * into memory themes, so an interim override doesn't outlive its absorption.
 * No-ops safely if the columns don't exist yet.
 */
export async function clearSteer(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_memory")
    .update({
      active_steer: null,
      steer_set_at: null,
      steer_nudged: false,
    })
    .eq("user_id", userId);
  if (error) {
    console.error(`Failed to clear steer for user ${userId}:`, error);
  }
}

// Re-exported for callers that want the site name in steer copy without a
// second import.
export const STEER_SITE_NAME = siteConfig.name;
