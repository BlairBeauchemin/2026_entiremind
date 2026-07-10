import { createServiceRoleClient } from "../supabase";

/**
 * Entitlement — the single place plan logic lives
 * (Part A of docs/plans/2026-07-04-monetization-growth.md).
 *
 * - "paid":    an active paid plan. past_due counts — Stripe is retrying and
 *              cutting a paying user off mid-retry maximizes churn.
 * - "trial":   inside the free-trial window (10 days from onboarding
 *              completion; existing users grandfathered by migration 019).
 * - "expired": trial over, no paid plan. The daily loop stops; inbound is
 *              still heard and acked; the upgrade path takes over.
 */

export type Entitlement = "paid" | "trial" | "expired";

export const TRIAL_DAYS = 10;

export interface EntitlementInputs {
  plan: string;
  status: string;
  trial_ends_at: string | null;
}

const PAID_PLANS = new Set(["monthly", "yearly"]);
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export function computeEntitlement(
  sub: EntitlementInputs | null,
  now: Date = new Date(),
): Entitlement {
  if (sub && PAID_PLANS.has(sub.plan) && PAID_STATUSES.has(sub.status)) {
    return "paid";
  }

  // No subscription row at all (pre-trigger legacy account): treat as trial
  // rather than cutting anyone off on a data gap.
  if (!sub) return "trial";

  if (sub.trial_ends_at && new Date(sub.trial_ends_at).getTime() > now.getTime()) {
    return "trial";
  }

  // Free plan with no trial_ends_at set (shouldn't happen after migration
  // 019 backfill + onboarding writes, but fail toward generosity).
  if (!sub.trial_ends_at) return "trial";

  return "expired";
}

export interface LoadedEntitlement {
  entitlement: Entitlement;
  trialEndsAt: string | null;
}

/**
 * Load a user's entitlement (service-role). Founders/admins are always
 * "paid" — they should never hit their own paywall.
 */
export async function loadEntitlement(
  userId: string,
): Promise<LoadedEntitlement> {
  const supabase = createServiceRoleClient();

  const [{ data: sub }, { data: user }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("users").select("role").eq("id", userId).maybeSingle(),
  ]);

  if (["admin", "founder"].includes(user?.role ?? "")) {
    return { entitlement: "paid", trialEndsAt: null };
  }

  return {
    entitlement: computeEntitlement(sub ?? null),
    trialEndsAt: sub?.trial_ends_at ?? null,
  };
}
