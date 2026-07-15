/**
 * Marketing engine shared types.
 *
 * The enum unions live in src/lib/supabase.ts alongside the Database type so
 * table typings and library code can't drift apart; re-export them here so
 * marketing code has one import site.
 */

export type {
  MarketingPlatform,
  ContentTarget,
  ContentFormat,
  ProductionMode,
  ContentPieceStatus,
  MediaKind,
  MediaAssetStatus,
  TrendSource,
  CampaignType,
  CampaignStatus,
  PublishMode,
  VideoStyle,
  ExperimentVariable,
  ExperimentStatus,
  TrendMomentum,
  BrandRow,
  BrandChannelRow,
  TrendSnapshotRow,
  MarketingCampaignRow,
  ContentPieceRow,
  MediaAssetRow,
  ContentMetricRow,
  MarketingEngineConfigRow,
  MarketingExperimentRow,
} from "../supabase";

/** Statuses in which the founder may still edit creative fields. */
export const EDITABLE_STATUSES = [
  "draft",
  "awaiting_footage",
  "pending_review",
  "approved",
  "scheduled",
] as const;

/** Meta call-to-action enum values we allow the AI to pick from. */
export const ALLOWED_CTAS = [
  "SIGN_UP",
  "LEARN_MORE",
  "SUBSCRIBE",
  "GET_STARTED",
  "DOWNLOAD",
  "SHOP_NOW",
] as const;
