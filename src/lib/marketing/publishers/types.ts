import type {
  BrandChannelRow,
  ContentPieceRow,
  MarketingCampaignRow,
  MarketingPlatform,
  MediaAssetRow,
} from "../types";

export interface PublishPostRequest {
  channel: BrandChannelRow;
  piece: ContentPieceRow;
  /** Ready assets with public_url populated. */
  media: MediaAssetRow[];
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  error?: string;
  /** True when returned by an unwired placeholder adapter. */
  placeholder?: boolean;
}

export interface LaunchAdRequest {
  channel: BrandChannelRow;
  /** meta_campaign_id may be null — the adapter creates the campaign. */
  campaign: MarketingCampaignRow | null;
  piece: ContentPieceRow;
  media: MediaAssetRow[];
  /** Create the final ad in PAUSED state (safety default). */
  launchPaused: boolean;
}

export interface LaunchAdResult {
  success: boolean;
  metaCampaignId?: string;
  adSetId?: string;
  creativeId?: string;
  adId?: string;
  error?: string;
  placeholder?: boolean;
}

export interface MetricsRequest {
  channel: BrandChannelRow;
  piece: ContentPieceRow;
  /** ISO date to fetch from. */
  since: string;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface MetricsResult {
  success: boolean;
  daily?: DailyMetric[];
  error?: string;
  placeholder?: boolean;
}

export interface PublisherAdapter {
  platform: MarketingPlatform;
  /** Whether real credentials are present in the environment. */
  isConfigured(): boolean;
  /** Publish an organic post. */
  publishPost(req: PublishPostRequest): Promise<PublishResult>;
  /** Launch a paid ad — meta_ads only. */
  launchAd?(req: LaunchAdRequest): Promise<LaunchAdResult>;
  /** Pull daily performance metrics for a published piece. */
  getMetrics(req: MetricsRequest): Promise<MetricsResult>;
}
