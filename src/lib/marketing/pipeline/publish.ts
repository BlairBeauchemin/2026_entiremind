import { createServiceRoleClient } from "../../supabase";
import type {
  BrandChannelRow,
  ContentPieceRow,
  ContentPieceStatus,
  MarketingCampaignRow,
  MediaAssetRow,
} from "../types";
import { getPublisher } from "../publishers";
import { loadEngineConfig } from "../config";

const VIDEO_FORMATS = ["video_ad", "reel", "short"];

export interface PublishPieceResult {
  success: boolean;
  status?: ContentPieceStatus;
  error?: string;
  placeholder?: boolean;
}

export interface PublishPieceOptions {
  /**
   * Allow publishing from 'approved' (founder's explicit publish-now).
   * The cron only takes 'scheduled' pieces whose time has come.
   */
  allowApproved?: boolean;
}

async function failPiece(pieceId: string, error: string): Promise<PublishPieceResult> {
  const supabase = createServiceRoleClient();
  await supabase
    .from("content_pieces")
    .update({ status: "failed", last_error: error })
    .eq("id", pieceId);
  return { success: false, status: "failed", error };
}

/**
 * Publish one piece: launch a Meta ad (target='ad') or push an organic
 * post via the platform's publisher adapter.
 */
export async function publishContentPiece(
  pieceId: string,
  options: PublishPieceOptions = {},
): Promise<PublishPieceResult> {
  const supabase = createServiceRoleClient();

  const claimableStatuses = options.allowApproved
    ? ["scheduled", "approved"]
    : ["scheduled"];

  // Claim the piece (guards against double-publish across runs)
  const { data: claimed } = await supabase
    .from("content_pieces")
    .update({ status: "publishing" })
    .eq("id", pieceId)
    .in("status", claimableStatuses)
    .select()
    .single();

  if (!claimed) {
    return { success: false, error: "Piece not found or not in a publishable status" };
  }
  const piece = claimed as ContentPieceRow;

  // HARD GUARD: a paid ad must have passed founder review, no matter what
  // any channel setting says. This is the last line of defense.
  if (piece.target === "ad" && !piece.reviewed_by) {
    await supabase
      .from("content_pieces")
      .update({ status: "pending_review", last_error: "Blocked: ad reached publish without review" })
      .eq("id", pieceId);
    return { success: false, error: "Ads cannot launch without founder review" };
  }

  const { data: channelData } = await supabase
    .from("brand_channels")
    .select("*")
    .eq("brand_id", piece.brand_id)
    .eq("platform", piece.platform)
    .maybeSingle();
  const channel = (channelData as BrandChannelRow) ?? null;
  if (!channel) {
    return failPiece(pieceId, `No ${piece.platform} channel configured for this brand`);
  }

  const { data: mediaData } = await supabase
    .from("media_assets")
    .select("*")
    .eq("content_piece_id", pieceId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });
  const media = (mediaData ?? []) as MediaAssetRow[];

  // Video formats need real footage — a script alone can't publish
  if (VIDEO_FORMATS.includes(piece.format) && !media.some((m) => m.kind === "video")) {
    await supabase
      .from("content_pieces")
      .update({
        status: piece.production_mode === "founder_filmed" ? "awaiting_footage" : "approved",
        last_error: "Video formats need a ready video asset before publishing",
      })
      .eq("id", pieceId);
    return { success: false, error: "Video formats need a ready video asset before publishing" };
  }

  const publisher = getPublisher(piece.platform);

  try {
    if (piece.target === "ad") {
      let campaign: MarketingCampaignRow | null = null;
      if (piece.campaign_id) {
        const { data } = await supabase
          .from("marketing_campaigns")
          .select("*")
          .eq("id", piece.campaign_id)
          .maybeSingle();
        campaign = (data as MarketingCampaignRow) ?? null;
      }

      if (!publisher.launchAd) {
        return failPiece(pieceId, `${piece.platform} does not support ad launches`);
      }

      const config = await loadEngineConfig();
      const result = await publisher.launchAd({
        channel,
        campaign,
        piece,
        media,
        launchPaused: config.ads_launch_paused,
      });

      if (!result.success) {
        return failPiece(pieceId, result.error ?? "Ad launch failed");
      }

      await supabase
        .from("content_pieces")
        .update({
          status: "launched",
          published_at: new Date().toISOString(),
          meta_adset_id: result.adSetId ?? null,
          meta_creative_id: result.creativeId ?? null,
          meta_ad_id: result.adId ?? null,
          external_post_id: result.adId ?? null,
          last_error: null,
        })
        .eq("id", pieceId);

      if (campaign && result.metaCampaignId && !campaign.meta_campaign_id) {
        await supabase
          .from("marketing_campaigns")
          .update({ meta_campaign_id: result.metaCampaignId, status: "active" })
          .eq("id", campaign.id);
      }

      return { success: true, status: "launched", placeholder: result.placeholder };
    }

    // Organic post
    const result = await publisher.publishPost({ channel, piece, media });
    if (!result.success) {
      return failPiece(pieceId, result.error ?? "Publish failed");
    }

    await supabase
      .from("content_pieces")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_post_id: result.externalPostId ?? null,
        last_error: null,
      })
      .eq("id", pieceId);

    return { success: true, status: "published", placeholder: result.placeholder };
  } catch (error) {
    return failPiece(pieceId, error instanceof Error ? error.message : "Publish failed");
  }
}
