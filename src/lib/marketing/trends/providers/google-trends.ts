import type { TrendSourceAdapter } from "../types";

/**
 * PLACEHOLDER: Google Trends source.
 * There is no official Google Trends API; the real implementation would use
 * the unofficial daily-trends endpoints or a paid provider (e.g. Glimpse),
 * filtered by the brand's niche keywords. Returns no items until wired.
 */
export const googleTrendsSource: TrendSourceAdapter = {
  source: "google_trends",
  isConfigured: () => false,
  async fetchTrends() {
    return [];
  },
};
