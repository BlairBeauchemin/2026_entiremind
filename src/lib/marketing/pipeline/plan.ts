import { createServiceRoleClient } from "../../supabase";
import type { BrandRow, MarketingCampaignRow, TrendSnapshotRow } from "../types";
import { generateStrictJson } from "../ai";
import { loadEngineConfig } from "../config";
import {
  CAMPAIGN_PLAN_SYSTEM_PROMPT,
  buildCampaignPlanPrompt,
} from "../prompts/campaign-plan";
import { CampaignPlanSchema } from "./schemas";

export interface PlanBrandContentOptions {
  campaignId?: string;
  count?: number;
  brief?: string | null;
  createdBy?: string | null;
}

export interface PlanBrandContentResult {
  success: boolean;
  campaignId?: string;
  pieceIds?: string[];
  error?: string;
}

/**
 * Summarize recent per-piece metrics so the planner can learn from what
 * worked. Returns null when there is nothing published yet.
 */
async function buildPerformanceNotes(brandId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("content_metrics")
    .select("platform, impressions, clicks, spend_cents, conversions, content_piece_id")
    .eq("brand_id", brandId)
    .order("metric_date", { ascending: false })
    .limit(200);

  if (!data || data.length === 0) return null;

  const byPlatform = new Map<string, { impressions: number; clicks: number; spend: number; conversions: number }>();
  for (const row of data) {
    const agg = byPlatform.get(row.platform) ?? { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    agg.impressions += row.impressions;
    agg.clicks += row.clicks;
    agg.spend += row.spend_cents;
    agg.conversions += row.conversions;
    byPlatform.set(row.platform, agg);
  }

  const lines: string[] = [];
  for (const [platform, agg] of byPlatform) {
    const ctr = agg.impressions > 0 ? ((agg.clicks / agg.impressions) * 100).toFixed(2) : "0";
    lines.push(
      `${platform}: ${agg.impressions} impressions, ${agg.clicks} clicks (CTR ${ctr}%), $${(agg.spend / 100).toFixed(2)} spend, ${agg.conversions} conversions`,
    );
  }
  return lines.join("\n");
}

/**
 * Plan a week of content for a brand: one AI call produces a campaign
 * strategy plus draft content_pieces rows that the generation cron drains.
 */
export async function planBrandContent(
  brandId: string,
  opts: PlanBrandContentOptions = {},
): Promise<PlanBrandContentResult> {
  const supabase = createServiceRoleClient();
  const config = await loadEngineConfig();

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();

  if (brandError || !brand) {
    return { success: false, error: "Brand not found" };
  }

  const { data: snapshot } = await supabase
    .from("trend_snapshots")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let existingCampaign: MarketingCampaignRow | null = null;
  if (opts.campaignId) {
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", opts.campaignId)
      .single();
    existingCampaign = (data as MarketingCampaignRow) ?? null;
    if (!existingCampaign) {
      return { success: false, error: "Campaign not found" };
    }
  }

  const count = opts.count ?? config.weekly_pieces_per_brand;
  const performanceNotes = await buildPerformanceNotes(brandId);

  let plan;
  try {
    plan = await generateStrictJson(
      CAMPAIGN_PLAN_SYSTEM_PROMPT,
      buildCampaignPlanPrompt(brand as BrandRow, (snapshot as TrendSnapshotRow) ?? null, {
        count,
        videoEnabled: config.video_enabled,
        performanceNotes,
        brief: opts.brief ?? existingCampaign?.brief ?? null,
      }),
      CampaignPlanSchema,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Campaign planning failed",
    };
  }

  // Enforce invariants the model must not be trusted with
  const pieces = plan.pieces.filter((p) => {
    if (p.target === "ad" && p.platform !== "meta_ads") return false;
    if (p.target === "organic" && p.platform === "meta_ads") return false;
    if (
      p.production_mode === "founder_filmed" &&
      !["reel", "short", "video_ad"].includes(p.format)
    ) {
      return false;
    }
    if (
      p.production_mode === "ai_generated" &&
      !config.video_enabled &&
      ["video_ad", "reel", "short"].includes(p.format)
    ) {
      return false;
    }
    return true;
  });

  let campaignId = existingCampaign?.id;
  if (!campaignId) {
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .insert({
        brand_id: brandId,
        name: plan.campaign.name,
        objective: plan.campaign.objective,
        campaign_type: "mixed",
        status: "planning",
        strategy: plan.campaign.strategy,
        trend_snapshot_id: snapshot?.id ?? null,
        brief: opts.brief ?? null,
        created_by: opts.createdBy ?? null,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message ?? "Failed to create campaign" };
    }
    campaignId = campaign.id as string;
  } else {
    await supabase
      .from("marketing_campaigns")
      .update({ strategy: plan.campaign.strategy, status: "planning" })
      .eq("id", campaignId);
  }

  const now = Date.now();
  const rows = pieces.map((p) => ({
    brand_id: brandId,
    campaign_id: campaignId,
    target: p.target,
    platform: p.platform,
    format: p.format,
    production_mode: p.production_mode,
    status: "draft" as const,
    angle: p.angle,
    headline: p.headline_hint || null,
    daily_budget_cents: p.target === "ad" ? config.default_daily_budget_cents : null,
    scheduled_for: new Date(now + p.scheduled_offset_days * 24 * 60 * 60 * 1000).toISOString(),
    generation_context: {
      planned_at: new Date().toISOString(),
      trend_snapshot_id: snapshot?.id ?? null,
      headline_hint: p.headline_hint,
    },
  }));

  if (rows.length === 0) {
    return { success: false, error: "Planner produced no valid pieces" };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("content_pieces")
    .insert(rows)
    .select("id");

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return {
    success: true,
    campaignId,
    pieceIds: (inserted ?? []).map((r: { id: string }) => r.id),
  };
}
