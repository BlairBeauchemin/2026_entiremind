import { randomUUID } from "crypto";
import { buildPlaceholderDailyMetrics } from "../../metrics/placeholder";
import type { PublisherAdapter, PublishPostRequest, PublishResult, MetricsRequest, MetricsResult } from "../types";

/**
 * PLACEHOLDER: YouTube publisher.
 *
 * Real publishing uses the YouTube Data API v3 (videos.insert with a
 * resumable upload; Shorts are ordinary uploads with vertical video and
 * #shorts). Requires an OAuth client + refresh token. Until credentials
 * are wired, publishPost returns a stub id so the pipeline stays
 * exercisable end-to-end.
 */
function isConfigured(): boolean {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID &&
      process.env.YOUTUBE_CLIENT_SECRET &&
      process.env.YOUTUBE_REFRESH_TOKEN,
  );
}

export const youtubeAdapter: PublisherAdapter = {
  platform: "youtube",
  isConfigured,

  async publishPost(req: PublishPostRequest): Promise<PublishResult> {
    if (!isConfigured()) {
      // PLACEHOLDER: log the would-be upload and return a stub id
      console.log(
        `[youtube placeholder] upload piece ${req.piece.id}: ${req.piece.headline?.slice(0, 80) ?? ""}`,
      );
      return { success: true, externalPostId: `stub_youtube_${randomUUID()}`, placeholder: true };
    }
    return { success: false, error: "YouTube publishing not yet implemented for live credentials" };
  },

  async getMetrics(req: MetricsRequest): Promise<MetricsResult> {
    if (!isConfigured()) {
      return {
        success: true,
        daily: buildPlaceholderDailyMetrics(req.piece, req.since, new Date().toISOString().slice(0, 10)),
        placeholder: true,
      };
    }
    return { success: false, error: "YouTube metrics not yet implemented for live credentials" };
  },
};
