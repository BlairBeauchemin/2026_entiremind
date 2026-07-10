import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  objective: z.string().optional(),
  status: z
    .enum(["draft", "planning", "active", "paused", "completed", "archived"])
    .optional(),
  brief: z.string().nullable().optional(),
  total_budget_cents: z.number().int().positive().nullable().optional(),
  daily_budget_cents: z.number().int().positive().nullable().optional(),
  targeting: z.record(z.string(), z.unknown()).optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

export async function PATCH(
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

  const parsed = UpdateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: campaign, error } = await supabase
    .from("marketing_campaigns")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: error?.message ?? "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}
