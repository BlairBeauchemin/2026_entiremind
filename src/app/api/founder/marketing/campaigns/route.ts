import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const CreateCampaignSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1),
  objective: z.string().optional(),
  campaign_type: z.enum(["paid_ads", "organic", "mixed"]).optional(),
  brief: z.string().nullable().optional(),
  total_budget_cents: z.number().int().positive().nullable().optional(),
  daily_budget_cents: z.number().int().positive().nullable().optional(),
  targeting: z.record(z.string(), z.unknown()).optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data });
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

  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: campaign, error } = await supabase
    .from("marketing_campaigns")
    .insert({ ...parsed.data, created_by: auth.userId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaign }, { status: 201 });
}
