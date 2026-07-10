import { randomUUID } from "crypto";
import { createServiceRoleClient } from "../../supabase";
import type { MediaKind } from "../types";

export const MARKETING_MEDIA_BUCKET = "marketing-media";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function extensionForMime(mimeType: string): string {
  return EXT_BY_MIME[mimeType] ?? (mimeType.startsWith("video/") ? "mp4" : "png");
}

export function buildStoragePath(
  brandSlug: string,
  kind: MediaKind,
  mimeType: string,
): string {
  return `${brandSlug}/${kind}s/${randomUUID()}.${extensionForMime(mimeType)}`;
}

/**
 * Upload media bytes to the public marketing-media bucket.
 * The bucket is public on purpose: Meta/IG APIs must be able to fetch
 * creative URLs. Never store anything sensitive here.
 */
export async function uploadMediaAsset(
  brandSlug: string,
  bytes: Uint8Array,
  mimeType: string,
  kind: MediaKind,
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createServiceRoleClient();
  const path = buildStoragePath(brandSlug, kind, mimeType);

  const { error } = await supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

/**
 * Create a signed upload URL for direct-to-storage founder uploads.
 * Videos exceed Vercel's request body limit, so the browser PUTs the file
 * straight to Supabase Storage using this URL.
 */
export async function createSignedUpload(
  brandSlug: string,
  kind: MediaKind,
  mimeType: string,
): Promise<{ path: string; token: string; signedUrl: string; publicUrl: string }> {
  const supabase = createServiceRoleClient();
  const path = buildStoragePath(brandSlug, kind, mimeType);

  const { data, error } = await supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }

  const { data: pub } = supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
  };
}
