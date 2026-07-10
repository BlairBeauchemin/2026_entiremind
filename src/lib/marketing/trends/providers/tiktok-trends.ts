import type { TrendSourceAdapter } from "../types";

/**
 * PLACEHOLDER: TikTok Creative Center source.
 * The real implementation scrapes/queries TikTok Creative Center's trending
 * hashtags and sounds for the brand's niche (requires a TikTok Business
 * account for API access). Returns no items until wired.
 */
export const tiktokTrendsSource: TrendSourceAdapter = {
  source: "tiktok_creative_center",
  isConfigured: () => false,
  async fetchTrends() {
    return [];
  },
};
