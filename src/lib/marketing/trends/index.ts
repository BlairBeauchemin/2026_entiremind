import { createServiceRoleClient } from "../../supabase";
import type { BrandRow, TrendSnapshotRow } from "../types";
import { generateStrictJson } from "../ai";
import {
  TREND_RESEARCH_SYSTEM_PROMPT,
  buildTrendResearchPrompt,
} from "../prompts/trend-research";
import {
  RESEARCH_QUERIES_SYSTEM_PROMPT,
  buildResearchQueriesPrompt,
} from "../prompts/research-queries";
import { TrendResearchSchema, ResearchQueriesSchema } from "../pipeline/schemas";
import { computeSnapshotDelta } from "./delta";
import {
  executeResearchQueries,
  getConfiguredResearchTools,
  renderResearchItems,
  type ResearchItem,
  type ResearchQuery,
} from "../research";

export interface TrendResearchResult {
  success: boolean;
  snapshotId?: string;
  error?: string;
}

/**
 * Agentic trend research for a brand:
 *  1. The AI generates per-niche search queries.
 *  2. Queries execute against the configured in-platform research tools
 *     (YouTube real; TikTok/Instagram once their credentials land).
 *  3. The AI synthesizes the real findings + its own knowledge into a
 *     trend snapshot, compared against the previous one for momentum.
 * Falls back gracefully to knowledge-only when no research tool is
 * configured or the query step fails.
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
  const niches = brand.niches ?? [];

  const { data: previousData } = await supabase
    .from("trend_snapshots")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const previous = (previousData as TrendSnapshotRow) ?? null;

  // Step 1 + 2: in-platform research (skipped when no tool is configured)
  let researchItems: ResearchItem[] = [];
  let queries: ResearchQuery[] = [];
  if (getConfiguredResearchTools().length > 0) {
    try {
      const generated = await generateStrictJson(
        RESEARCH_QUERIES_SYSTEM_PROMPT,
        buildResearchQueriesPrompt(brand, niches),
        ResearchQueriesSchema,
        1500,
      );
      queries = generated.queries;
      researchItems = await executeResearchQueries(queries);
    } catch (error) {
      // Research is additive — synthesis still runs knowledge-only
      console.error("Research query step failed, continuing knowledge-only:", error);
    }
  }

  // Step 3: synthesis
  let research;
  try {
    research = await generateStrictJson(
      TREND_RESEARCH_SYSTEM_PROMPT,
      buildTrendResearchPrompt(brand, null, {
        niches,
        previousSnapshot: previous
          ? { createdAt: previous.created_at, insights: previous.insights }
          : null,
        platformFindings: researchItems.length > 0 ? renderResearchItems(researchItems) : null,
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
      niches,
      previous_snapshot_id: previous?.id ?? null,
      delta,
      raw:
        researchItems.length > 0
          ? { research_items: researchItems, queries }
          : null,
    })
    .select("id")
    .single();

  if (error || !snapshot) {
    return { success: false, error: error?.message ?? "Failed to save trend snapshot" };
  }

  return { success: true, snapshotId: snapshot.id };
}
