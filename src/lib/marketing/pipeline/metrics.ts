import { createServiceRoleClient } from "../../supabase";
import type { BrandChannelRow, ContentPieceRow } from "../types";
import { getPublisher } from "../publishers";

const LOOKBACK_DAYS = 30;

export interface CollectMetricsResult {
  processed: number;
  updated: number;
  failed: number;
  errors: Array<{ pieceId: string; error: string }>;
}

/**
 * Pull daily metrics for every piece published/launched in the last 30 days
 * and upsert into content_metrics on (content_piece_id, metric_date).
 */
export async function collectMetrics(): Promise<CollectMetricsResult> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("*")
    .in("status", ["published", "launched"])
    .gte("published_at", since);

  const result: CollectMetricsResult = { processed: 0, updated: 0, failed: 0, errors: [] };

  for (const pieceRow of (pieces ?? []) as ContentPieceRow[]) {
    result.processed++;
    try {
      const { data: channelData } = await supabase
        .from("brand_channels")
        .select("*")
        .eq("brand_id", pieceRow.brand_id)
        .eq("platform", pieceRow.platform)
        .maybeSingle();
      const channel = (channelData as BrandChannelRow) ?? null;
      if (!channel) continue;

      const publisher = getPublisher(pieceRow.platform);
      const metrics = await publisher.getMetrics({
        channel,
        piece: pieceRow,
        since: since.slice(0, 10),
      });

      if (!metrics.success) {
        result.failed++;
        if (metrics.error) result.errors.push({ pieceId: pieceRow.id, error: metrics.error });
        continue;
      }

      for (const day of metrics.daily ?? []) {
        const { error } = await supabase.from("content_metrics").upsert(
          {
            content_piece_id: pieceRow.id,
            brand_id: pieceRow.brand_id,
            platform: pieceRow.platform,
            metric_date: day.date,
            impressions: day.impressions,
            clicks: day.clicks,
            spend_cents: day.spendCents,
            conversions: day.conversions,
            likes: day.likes,
            comments: day.comments,
            shares: day.shares,
            views: day.views,
          },
          { onConflict: "content_piece_id,metric_date" },
        );
        if (!error) result.updated++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        pieceId: pieceRow.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
