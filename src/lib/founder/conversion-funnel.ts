/**
 * Leads → signups → onboarded → paid conversion funnel for the founder
 * dashboard, with per-source breakdown (landing_page / quiz / share-*).
 *
 * Matching is by lowercased email — leads have no FK to users. Pure logic
 * lives in computeConversionFunnel (unit-tested); buildConversionFunnel is
 * the thin service-role loader, in-TS joins matching the founder page's
 * existing helpers (fine at current scale).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface FunnelLeadRow {
  email: string | null;
  source: string | null;
}

export interface FunnelUserRow {
  id: string;
  email: string | null;
  onboarding_completed: boolean | null;
}

export interface FunnelSubscriptionRow {
  user_id: string;
  status: string | null;
  plan: string | null;
}

export interface SourceFunnel {
  source: string;
  leads: number;
  signups: number;
  onboarded: number;
  paid: number;
}

export interface ConversionFunnel {
  totals: SourceFunnel;
  bySource: SourceFunnel[];
}

const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);
const PAID_PLANS = new Set(["monthly", "yearly"]);

/** Collapse share-{slug} sources into one bucket alongside the named ones. */
function bucketSource(source: string | null): string {
  if (!source) return "unknown";
  if (source.startsWith("share-")) return source; // keep per-archetype detail
  return source;
}

export function computeConversionFunnel(
  leads: FunnelLeadRow[],
  users: FunnelUserRow[],
  subscriptions: FunnelSubscriptionRow[],
): ConversionFunnel {
  const usersByEmail = new Map<string, FunnelUserRow>();
  for (const user of users) {
    if (user.email) usersByEmail.set(user.email.toLowerCase().trim(), user);
  }

  const paidUserIds = new Set(
    subscriptions
      .filter(
        (sub) =>
          PAID_STATUSES.has(sub.status ?? "") && PAID_PLANS.has(sub.plan ?? ""),
      )
      .map((sub) => sub.user_id),
  );

  const bySource = new Map<string, SourceFunnel>();
  const totals: SourceFunnel = {
    source: "all",
    leads: 0,
    signups: 0,
    onboarded: 0,
    paid: 0,
  };

  for (const lead of leads) {
    if (!lead.email) continue;
    const bucket = bucketSource(lead.source);
    const row = bySource.get(bucket) ?? {
      source: bucket,
      leads: 0,
      signups: 0,
      onboarded: 0,
      paid: 0,
    };

    row.leads++;
    totals.leads++;

    const user = usersByEmail.get(lead.email.toLowerCase().trim());
    if (user) {
      row.signups++;
      totals.signups++;
      if (user.onboarding_completed) {
        row.onboarded++;
        totals.onboarded++;
      }
      if (paidUserIds.has(user.id)) {
        row.paid++;
        totals.paid++;
      }
    }

    bySource.set(bucket, row);
  }

  return {
    totals,
    bySource: [...bySource.values()].sort((a, b) => b.leads - a.leads),
  };
}

export async function buildConversionFunnel(
  supabase: SupabaseClient,
): Promise<ConversionFunnel> {
  const [{ data: leads }, { data: users }, { data: subscriptions }] =
    await Promise.all([
      supabase.from("leads").select("email, source"),
      supabase.from("users").select("id, email, onboarding_completed"),
      supabase.from("subscriptions").select("user_id, status, plan"),
    ]);

  return computeConversionFunnel(
    (leads as FunnelLeadRow[] | null) ?? [],
    (users as FunnelUserRow[] | null) ?? [],
    (subscriptions as FunnelSubscriptionRow[] | null) ?? [],
  );
}
