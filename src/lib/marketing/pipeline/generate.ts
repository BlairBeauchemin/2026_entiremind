import { createServiceRoleClient } from "../../supabase";
import type {
  BrandRow,
  BrandChannelRow,
  ContentPieceRow,
  ContentPieceStatus,
  MarketingCampaignRow,
} from "../types";
import { generateStrictJson, StrictJsonError } from "../ai";
import { AD_COPY_SYSTEM_PROMPT, buildAdCopyPrompt } from "../prompts/ad-copy";
import {
  ORGANIC_POST_SYSTEM_PROMPT,
  buildOrganicPostPrompt,
} from "../prompts/organic-post";
import {
  VIDEO_SCRIPT_SYSTEM_PROMPT,
  buildVideoScriptPrompt,
} from "../prompts/video-script";
import { buildImagePrompt } from "../prompts/image-prompt";
import { AdCopySchema, OrganicPostSchema, VideoScriptSchema } from "./schemas";
import { generateAndStoreMedia } from "../media";
import type { MediaAspectRatio } from "../media/types";

const VIDEO_FORMATS = ["video_ad", "reel", "short"] as const;

export interface GeneratePieceResult {
  success: boolean;
  status?: ContentPieceStatus;
  error?: string;
}

function aspectRatioForFormat(format: string): MediaAspectRatio {
  if (["reel", "short", "story"].includes(format)) return "9:16";
  if (format === "video_ad") return "4:5";
  return "1:1";
}

function isVideoFormat(format: string): boolean {
  return (VIDEO_FORMATS as readonly string[]).includes(format);
}

/**
 * Terminal status after generation.
 *
 * Ads ALWAYS go to pending_review — this rule is enforced in code and never
 * trusts channel publish_mode for target='ad'. Organic pieces skip review
 * only when their channel is explicitly set to auto_publish.
 */
export function terminalStatusFor(
  target: string,
  publishMode: string | null,
): Extract<ContentPieceStatus, "pending_review" | "scheduled"> {
  if (target === "ad") return "pending_review";
  return publishMode === "auto_publish" ? "scheduled" : "pending_review";
}

async function failPiece(pieceId: string, error: string, raw?: string): Promise<GeneratePieceResult> {
  const supabase = createServiceRoleClient();
  const update: Record<string, unknown> = { status: "failed", last_error: error };
  if (raw) {
    update.generation_context = { failed_raw_output: raw.slice(0, 4000) };
  }
  await supabase.from("content_pieces").update(update).eq("id", pieceId);
  return { success: false, status: "failed", error };
}

/**
 * Generate copy (and media, for ai_generated pieces) for a draft content
 * piece, then move it to its terminal pre-publish status.
 */
export async function generateContentPiece(pieceId: string): Promise<GeneratePieceResult> {
  const supabase = createServiceRoleClient();

  // Claim the piece — guards against double-processing across cron runs
  const { data: claimed, error: claimError } = await supabase
    .from("content_pieces")
    .update({ status: "generating" })
    .eq("id", pieceId)
    .eq("status", "draft")
    .select()
    .single();

  if (claimError || !claimed) {
    return { success: false, error: "Piece not found or not in draft status" };
  }

  const piece = claimed as ContentPieceRow;

  const { data: brandData } = await supabase
    .from("brands")
    .select("*")
    .eq("id", piece.brand_id)
    .single();
  if (!brandData) {
    return failPiece(pieceId, "Brand not found");
  }
  const brand = brandData as BrandRow;

  let campaign: MarketingCampaignRow | null = null;
  if (piece.campaign_id) {
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", piece.campaign_id)
      .maybeSingle();
    campaign = (data as MarketingCampaignRow) ?? null;
  }

  const { data: channelData } = await supabase
    .from("brand_channels")
    .select("*")
    .eq("brand_id", piece.brand_id)
    .eq("platform", piece.platform)
    .maybeSingle();
  const channel = (channelData as BrandChannelRow) ?? null;

  const generationContext: Record<string, unknown> = {
    ...piece.generation_context,
    generated_at: new Date().toISOString(),
  };

  try {
    const update: Record<string, unknown> = {};
    let imagePrompt: string | null = null;

    if (piece.production_mode === "founder_filmed" || isVideoFormat(piece.format)) {
      // Video script path (founder-filmed always needs a script; so do AI video formats)
      const script = await generateStrictJson(
        VIDEO_SCRIPT_SYSTEM_PROMPT,
        buildVideoScriptPrompt(
          brand,
          campaign,
          piece.angle,
          piece.platform,
          piece.format,
          piece.production_mode === "founder_filmed",
          piece.video_style,
        ),
        VideoScriptSchema,
      );
      update.script = script.script;
      update.headline = script.hook;
      update.caption = script.caption;
      update.hashtags = script.hashtags;
      generationContext.scenes = script.scenes;
      generationContext.video_prompt = script.video_prompt;
      generationContext.style_notes = script.style_notes;
      imagePrompt = script.video_prompt;
      if (piece.target === "ad") {
        // Ads still need CTA + primary text alongside the video script
        const adCopy = await generateStrictJson(
          AD_COPY_SYSTEM_PROMPT,
          buildAdCopyPrompt(brand, campaign, piece.angle),
          AdCopySchema,
        );
        update.body_copy = adCopy.body_copy;
        update.cta = adCopy.cta;
      }
    } else if (piece.target === "ad") {
      const adCopy = await generateStrictJson(
        AD_COPY_SYSTEM_PROMPT,
        buildAdCopyPrompt(brand, campaign, piece.angle),
        AdCopySchema,
      );
      update.headline = adCopy.headline;
      update.body_copy = adCopy.body_copy;
      update.cta = adCopy.cta;
      update.link_url = piece.link_url ?? brand.website_url;
      imagePrompt = adCopy.image_prompt;
    } else {
      const post = await generateStrictJson(
        ORGANIC_POST_SYSTEM_PROMPT,
        buildOrganicPostPrompt(brand, campaign, piece.angle, piece.platform, piece.format),
        OrganicPostSchema,
      );
      update.caption = post.caption;
      update.hashtags = post.hashtags;
      update.headline = post.hook;
      imagePrompt = post.image_prompt;
    }

    if (imagePrompt) {
      update.image_prompt = imagePrompt;
    }

    // founder_filmed: no media generation — wait for the founder's footage
    if (piece.production_mode === "founder_filmed") {
      update.status = "awaiting_footage";
      update.generation_context = generationContext;
      const { error } = await supabase.from("content_pieces").update(update).eq("id", pieceId);
      if (error) return failPiece(pieceId, error.message);
      return { success: true, status: "awaiting_footage" };
    }

    // ai_generated: produce media
    if (isVideoFormat(piece.format)) {
      // Veo is stubbed — record the attempt but let the piece reach review
      // so copy/script are still reviewable ("video pending" in the UI).
      const media = await generateAndStoreMedia(
        { id: piece.id, brand_id: piece.brand_id },
        brand.slug,
        buildImagePrompt(brand, imagePrompt ?? piece.angle ?? "Brand video"),
        "video",
        aspectRatioForFormat(piece.format),
      );
      if (!media.success) {
        generationContext.video_generation_error = media.error;
      }
    } else {
      const media = await generateAndStoreMedia(
        { id: piece.id, brand_id: piece.brand_id },
        brand.slug,
        buildImagePrompt(brand, imagePrompt ?? piece.angle ?? "Brand image"),
        "image",
        aspectRatioForFormat(piece.format),
      );
      if (!media.success) {
        return failPiece(pieceId, `Image generation failed: ${media.error}`);
      }
    }

    update.status = terminalStatusFor(piece.target, channel?.publish_mode ?? null);
    update.generation_context = generationContext;
    if (update.status === "scheduled" && !piece.scheduled_for) {
      update.scheduled_for = new Date().toISOString();
    }

    const { error } = await supabase.from("content_pieces").update(update).eq("id", pieceId);
    if (error) return failPiece(pieceId, error.message);

    return { success: true, status: update.status as ContentPieceStatus };
  } catch (error) {
    if (error instanceof StrictJsonError) {
      return failPiece(pieceId, error.message, error.raw);
    }
    return failPiece(pieceId, error instanceof Error ? error.message : "Generation failed");
  }
}

/**
 * Reset pieces stuck in 'generating' (e.g. a timed-out cron run) back to
 * draft so the next run can retry them.
 */
export async function reapStaleGenerating(olderThanMinutes = 60): Promise<number> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("content_pieces")
    .update({ status: "draft" })
    .eq("status", "generating")
    .lt("updated_at", cutoff)
    .select("id");
  return data?.length ?? 0;
}
