import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { createSignedUpload } from "@/lib/marketing/media/storage";

const InitSchema = z.object({
  step: z.literal("init"),
  mimeType: z.string().regex(/^(image|video)\//),
});

const CompleteSchema = z.object({
  step: z.literal("complete"),
  assetId: z.string().uuid(),
});

const UploadSchema = z.discriminatedUnion("step", [InitSchema, CompleteSchema]);

/**
 * POST /api/founder/marketing/content/[id]/upload
 *
 * Two-step direct-to-storage upload for founder-filmed footage (videos
 * exceed Vercel's request body limit, so bytes never pass through here):
 *   1. { step: "init", mimeType } -> signed upload URL + pending asset row;
 *      the browser PUTs the file to signedUrl with the returned token.
 *   2. { step: "complete", assetId } -> asset marked ready, piece moves
 *      awaiting_footage -> pending_review.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: piece } = await supabase
    .from("content_pieces")
    .select("*, brands(slug)")
    .eq("id", id)
    .single();

  if (!piece) {
    return NextResponse.json({ error: "Piece not found" }, { status: 404 });
  }

  if (parsed.data.step === "init") {
    const kind = parsed.data.mimeType.startsWith("video/") ? "video" : "image";
    const brandSlug: string = piece.brands?.slug ?? "unknown";

    let signed;
    try {
      signed = await createSignedUpload(brandSlug, kind, parsed.data.mimeType);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to create upload URL" },
        { status: 500 },
      );
    }

    const { data: asset, error } = await supabase
      .from("media_assets")
      .insert({
        brand_id: piece.brand_id,
        content_piece_id: id,
        kind,
        generator: "manual",
        prompt: "",
        storage_path: signed.path,
        public_url: signed.publicUrl,
        mime_type: parsed.data.mimeType,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: error?.message ?? "Failed to create asset" }, { status: 500 });
    }

    return NextResponse.json({
      assetId: asset.id,
      signedUrl: signed.signedUrl,
      token: signed.token,
      path: signed.path,
    });
  }

  // step === "complete"
  const { data: asset } = await supabase
    .from("media_assets")
    .select("id, status, content_piece_id")
    .eq("id", parsed.data.assetId)
    .single();

  if (!asset || asset.content_piece_id !== id) {
    return NextResponse.json({ error: "Asset not found for this piece" }, { status: 404 });
  }

  const { error: assetError } = await supabase
    .from("media_assets")
    .update({ status: "ready" })
    .eq("id", asset.id);

  if (assetError) {
    return NextResponse.json({ error: assetError.message }, { status: 500 });
  }

  // Footage received: founder-filmed pieces move on to review
  if (piece.status === "awaiting_footage") {
    await supabase
      .from("content_pieces")
      .update({ status: "pending_review" })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
