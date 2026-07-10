import { createServiceRoleClient } from "../../supabase";
import type { BrandRow, ContentPieceRow } from "../types";
import { buildImagePrompt } from "../prompts/image-prompt";
import { generateAndStoreMedia } from "../media";
import type { MediaAspectRatio } from "../media/types";

const REGENERATABLE_STATUSES = ["pending_review", "approved", "draft", "scheduled"];

export interface RegenerateResult {
  success: boolean;
  assetId?: string;
  publicUrl?: string | null;
  error?: string;
}

/**
 * Re-run only the image step using the piece's current (possibly
 * founder-edited) image_prompt. Previous assets stay in media_assets as
 * history; the review UI shows the newest ready asset.
 */
export async function regenerateMedia(pieceId: string): Promise<RegenerateResult> {
  const supabase = createServiceRoleClient();

  const { data: pieceData } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", pieceId)
    .single();

  if (!pieceData) {
    return { success: false, error: "Piece not found" };
  }
  const piece = pieceData as ContentPieceRow;

  if (!REGENERATABLE_STATUSES.includes(piece.status)) {
    return { success: false, error: `Cannot regenerate media while status is ${piece.status}` };
  }
  if (!piece.image_prompt) {
    return { success: false, error: "Piece has no image_prompt to regenerate from" };
  }

  const { data: brandData } = await supabase
    .from("brands")
    .select("*")
    .eq("id", piece.brand_id)
    .single();
  if (!brandData) {
    return { success: false, error: "Brand not found" };
  }
  const brand = brandData as BrandRow;

  const aspectRatio: MediaAspectRatio = ["reel", "short", "story"].includes(piece.format)
    ? "9:16"
    : piece.format === "video_ad"
      ? "4:5"
      : "1:1";

  const result = await generateAndStoreMedia(
    { id: piece.id, brand_id: piece.brand_id },
    brand.slug,
    buildImagePrompt(brand, piece.image_prompt),
    "image",
    aspectRatio,
  );

  if (!result.success || !result.asset) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    assetId: result.asset.id,
    publicUrl: result.asset.public_url,
  };
}
