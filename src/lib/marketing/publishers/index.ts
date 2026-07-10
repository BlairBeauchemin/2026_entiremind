import type { MarketingPlatform } from "../types";
import type { PublisherAdapter } from "./types";
import { metaAdsAdapter, instagramAdapter } from "./providers/meta";
import { tiktokAdapter } from "./providers/tiktok";
import { youtubeAdapter } from "./providers/youtube";

export type {
  PublisherAdapter,
  PublishPostRequest,
  PublishResult,
  LaunchAdRequest,
  LaunchAdResult,
  MetricsRequest,
  MetricsResult,
  DailyMetric,
} from "./types";

// Unlike the env-selected SMS/AI providers, all platforms coexist —
// the registry is keyed by platform.
const PUBLISHERS: Record<MarketingPlatform, PublisherAdapter> = {
  meta_ads: metaAdsAdapter,
  instagram: instagramAdapter,
  tiktok: tiktokAdapter,
  youtube: youtubeAdapter,
};

export function getPublisher(platform: MarketingPlatform): PublisherAdapter {
  return PUBLISHERS[platform];
}
