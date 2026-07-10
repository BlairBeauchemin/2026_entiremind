import { createServiceRoleClient } from "../../supabase";
import type { MediaKind, MediaAssetRow } from "../types";
import type { MediaGeneratorAdapter, MediaAspectRatio, GeneratingProvider } from "./types";
import { geminiAdapter } from "./providers/gemini";
import { veoAdapter } from "./providers/veo";
import { uploadMediaAsset } from "./storage";
import { loadEngineConfig } from "../config";

export type { MediaGeneratorAdapter, MediaGenerationRequest, MediaGenerationResult } from "./types";

function resolveProvider(name: string): MediaGeneratorAdapter {
  switch (name as GeneratingProvider) {
    case "veo":
      return veoAdapter;
    case "gemini":
    default:
      return geminiAdapter;
  }
}

/**
 * Pick the generator for a media kind: config singleton first, env override
 * second (IMAGE_PROVIDER / VIDEO_PROVIDER), library default last.
 */
export async function getMediaGenerator(kind: MediaKind): Promise<MediaGeneratorAdapter> {
  const config = await loadEngineConfig();
  const configured =
    kind === "video"
      ? process.env.VIDEO_PROVIDER || config.video_provider
      : process.env.IMAGE_PROVIDER || config.image_provider;
  return resolveProvider(configured);
}

export interface GenerateAndStoreResult {
  success: boolean;
  asset?: MediaAssetRow;
  error?: string;
}

/**
 * Full media generation flow for a content piece: create the media_assets
 * row (status generating), generate, upload to storage, mark ready/failed.
 */
export async function generateAndStoreMedia(
  piece: { id: string; brand_id: string },
  brandSlug: string,
  prompt: string,
  kind: MediaKind,
  aspectRatio?: MediaAspectRatio,
): Promise<GenerateAndStoreResult> {
  const supabase = createServiceRoleClient();
  const generator = await getMediaGenerator(kind);

  const { data: asset, error: insertError } = await supabase
    .from("media_assets")
    .insert({
      brand_id: piece.brand_id,
      content_piece_id: piece.id,
      kind,
      generator: generator.generator,
      prompt,
      status: "generating",
    })
    .select()
    .single();

  if (insertError || !asset) {
    return { success: false, error: insertError?.message ?? "Failed to create media asset row" };
  }

  const result = await generator.generate({ prompt, kind, aspectRatio });

  if (!result.success || !result.data) {
    await supabase
      .from("media_assets")
      .update({ status: "failed", error: result.error ?? "Generation failed", model: result.model })
      .eq("id", asset.id);
    return { success: false, error: result.error ?? "Generation failed" };
  }

  try {
    const { path, publicUrl } = await uploadMediaAsset(
      brandSlug,
      result.data,
      result.mimeType ?? "image/png",
      kind,
    );

    const { data: updated, error: updateError } = await supabase
      .from("media_assets")
      .update({
        status: "ready",
        storage_path: path,
        public_url: publicUrl,
        mime_type: result.mimeType ?? "image/png",
        model: result.model,
      })
      .eq("id", asset.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, asset: updated as MediaAssetRow };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    await supabase
      .from("media_assets")
      .update({ status: "failed", error: message })
      .eq("id", asset.id);
    return { success: false, error: message };
  }
}
