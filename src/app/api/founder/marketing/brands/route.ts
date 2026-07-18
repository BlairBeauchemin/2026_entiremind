import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const PLATFORMS = ["meta_ads", "instagram", "tiktok", "youtube"] as const;

const CreateBrandSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "slug must be lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  product_summary: z.string().optional(),
  brand_voice: z.string().optional(),
  target_audience: z.string().optional(),
  visual_style: z.string().optional(),
  website_url: z.string().url().optional(),
});

export async function GET() {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  const supabase = createServiceRoleClient();
  // brand_channels columns listed explicitly: `credentials` holds provider
  // API secrets and must never reach the browser.
  const { data, error } = await supabase
    .from("brands")
    .select(
      "*, brand_channels(id, brand_id, platform, publish_mode, connected, external_account_id, config, created_at, updated_at)",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brands: data });
}

export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: brand, error } = await supabase
    .from("brands")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Every brand gets its four channel rows up front (disconnected)
  const { error: channelError } = await supabase
    .from("brand_channels")
    .insert(PLATFORMS.map((platform) => ({ brand_id: brand.id, platform })));
  if (channelError) {
    console.error("Failed to create brand channels:", channelError);
  }

  return NextResponse.json({ brand }, { status: 201 });
}
