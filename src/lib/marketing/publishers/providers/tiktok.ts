import { randomUUID } from "crypto";
import { buildPlaceholderDailyMetrics } from "../../metrics/placeholder";
import type { PublisherAdapter, PublishPostRequest, PublishResult, MetricsRequest, MetricsResult } from "../types";

/**
 * PLACEHOLDER: TikTok publisher.
 *
 * Real organic publishing uses the TikTok Content Posting API
 * (POST /v2/post/publish/video/init/ then chunked upload + publish);
 * paid uses the TikTok Business API. Both require an approved TikTok
 * developer app. Until credentials are wired, publishPost returns a stub
 * id so the pipeline stays exercisable end-to-end.
 */
function isConfigured(): boolean {
  return Boolean(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_ADVERTISER_ID);
}

export const tiktokAdapter: PublisherAdapter = {
  platform: "tiktok",
  isConfigured,

  async publishPost(req: PublishPostRequest): Promise<PublishResult> {
    if (!isConfigured()) {
      // PLACEHOLDER: log the would-be publish and return a stub id
      console.log(
        `[tiktok placeholder] publish piece ${req.piece.id}: ${req.piece.caption?.slice(0, 80) ?? ""}`,
      );
      return { success: true, externalPostId: `stub_tiktok_${randomUUID()}`, placeholder: true };
    }
    return { success: false, error: "TikTok publishing not yet implemented for live credentials" };
  },

  async getMetrics(req: MetricsRequest): Promise<MetricsResult> {
    if (!isConfigured()) {
      return {
        success: true,
        daily: buildPlaceholderDailyMetrics(req.piece, req.since, new Date().toISOString().slice(0, 10)),
        placeholder: true,
      };
    }
    return { success: false, error: "TikTok metrics not yet implemented for live credentials" };
  },
};
