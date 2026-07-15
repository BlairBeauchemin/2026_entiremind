import { createServiceRoleClient } from "../../supabase";
import type { BrandRow, TrendSnapshotRow } from "../types";
import { generateStrictJson } from "../ai";
import {
  TREND_RESEARCH_SYSTEM_PROMPT,
  buildTrendResearchPrompt,
} from "../prompts/trend-research";
import { TrendResearchSchema } from "../pipeline/schemas";
import { computeSnapshotDelta } from "./delta";
import type { TrendItem, TrendSourceAdapter } from "./types";
import { googleTrendsSource } from "./providers/google-trends";
import { tiktokTrendsSource } from "./providers/tiktok-trends";

export type { TrendItem, TrendSourceAdapter } from "./types";

// External data sources merge into the AI synthesis when wired
const EXTERNAL_SOURCES: TrendSourceAdapter[] = [googleTrendsSource, tiktokTrendsSource];

export interface TrendResearchResult {
  success: boolean;
  snapshotId?: string;
  error?: string;
}

/**
 * Run trend research for a brand: pull any configured external sources,
 * synthesize with an AI research pass over the brand's followed niches
 * (comparing against the previous snapshot for momentum + delta), and
 * persist a trend_snapshots row that campaign planning consumes.
 */
export async function runTrendResearch(brandId: string): Promise<TrendResearchResult> {
  const supabase = createServiceRoleClient();

  const { data: brandData } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();
  if (!brandData) {
    return { success: false, error: "Brand not found" };
  }
  const brand = brandData as BrandRow;

  const { data: previousData } = await supabase
    .from("trend_snapshots")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const previous = (previousData as TrendSnapshotRow) ?? null;

  const externalItems: TrendItem[] = [];
  for (const source of EXTERNAL_SOURCES) {
    if (!source.isConfigured()) continue;
    try {
      externalItems.push(...(await source.fetchTrends(brand)));
    } catch (error) {
      console.error(`Trend source ${source.source} failed:`, error);
    }
  }

  const extraContext =
    externalItems.length > 0
      ? externalItems.map((t) => `- ${t.trend}: ${t.relevance}`).join("\n")
      : null;

  let research;
  try {
    research = await generateStrictJson(
      TREND_RESEARCH_SYSTEM_PROMPT,
      buildTrendResearchPrompt(brand, extraContext, {
        niches: brand.niches ?? [],
        previousSnapshot: previous
          ? { createdAt: previous.created_at, insights: previous.insights }
          : null,
      }),
      TrendResearchSchema,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Trend research failed",
    };
  }

  const delta = computeSnapshotDelta(
    previous ? (previous.insights as Array<{ trend: string }>) : null,
    research.insights,
    research.delta_summary,
  );

  const { data: snapshot, error } = await supabase
    .from("trend_snapshots")
    .insert({
      brand_id: brandId,
      source: "ai_research",
      summary: research.summary,
      insights: research.insights,
      niches: brand.niches ?? [],
      previous_snapshot_id: previous?.id ?? null,
      delta,
      raw: externalItems.length > 0 ? { external_items: externalItems } : null,
    })
    .select("id")
    .single();

  if (error || !snapshot) {
    return { success: false, error: error?.message ?? "Failed to save trend snapshot" };
  }

  return { success: true, snapshotId: snapshot.id };
}
