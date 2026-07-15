import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const UpdateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  product_summary: z.string().optional(),
  brand_voice: z.string().optional(),
  target_audience: z.string().optional(),
  visual_style: z.string().optional(),
  website_url: z.string().url().nullable().optional(),
  niches: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  status: z.enum(["active", "paused"]).optional(),
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

  const parsed = UpdateBrandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: brand, error } = await supabase
    .from("brands")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !brand) {
    return NextResponse.json({ error: error?.message ?? "Brand not found" }, { status: 404 });
  }
  return NextResponse.json({ brand });
}
