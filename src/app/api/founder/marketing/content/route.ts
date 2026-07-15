import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { VIDEO_STYLES } from "@/lib/marketing/video-styles";

const CreatePieceSchema = z.object({
  brand_id: z.string().uuid(),
  campaign_id: z.string().uuid().nullable().optional(),
  target: z.enum(["ad", "organic"]),
  platform: z.enum(["meta_ads", "instagram", "tiktok", "youtube"]),
  format: z.enum(["image_ad", "video_ad", "carousel_ad", "post", "reel", "story", "short"]),
  production_mode: z.enum(["ai_generated", "founder_filmed"]).optional(),
  video_style: z.enum(VIDEO_STYLES).nullable().optional(),
  headline: z.string().nullable().optional(),
  body_copy: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  script: z.string().nullable().optional(),
  image_prompt: z.string().nullable().optional(),
  cta: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  link_url: z.string().nullable().optional(),
  angle: z.string().nullable().optional(),
  daily_budget_cents: z.number().int().positive().nullable().optional(),
  scheduled_for: z.string().nullable().optional(),
  /** "manual" pieces skip AI generation entirely. */
  mode: z.enum(["manual", "ai"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  const status = searchParams.get("status");
  const target = searchParams.get("target");

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("content_pieces")
    .select("*, media_assets(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (brandId) query = query.eq("brand_id", brandId);
  if (status) query = query.eq("status", status);
  if (target) query = query.eq("target", target);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pieces: data });
}

export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatePieceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { mode, ...fields } = parsed.data;

  if (fields.target === "ad" && fields.platform !== "meta_ads") {
    return NextResponse.json({ error: "Ad pieces must use the meta_ads platform" }, { status: 400 });
  }
  if (fields.target === "organic" && fields.platform === "meta_ads") {
    return NextResponse.json({ error: "Organic pieces cannot use meta_ads" }, { status: 400 });
  }

  // Manual pieces skip AI: hand-written founder_filmed content waits for
  // footage; everything else goes straight to review. AI pieces start as
  // draft for the generation cron to pick up.
  const status =
    mode === "manual"
      ? fields.production_mode === "founder_filmed"
        ? "awaiting_footage"
        : "pending_review"
      : "draft";

  const supabase = createServiceRoleClient();
  const { data: piece, error } = await supabase
    .from("content_pieces")
    .insert({
      ...fields,
      status,
      generation_context: { created_manually: mode === "manual", created_by: auth.userId },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ piece }, { status: 201 });
}
