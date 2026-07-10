import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const UpdateChannelSchema = z.object({
  publish_mode: z.enum(["require_approval", "auto_publish"]).optional(),
  connected: z.boolean().optional(),
  external_account_id: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
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

  const parsed = UpdateChannelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: channel } = await supabase
    .from("brand_channels")
    .select("platform")
    .eq("id", id)
    .single();

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Paid ads always require approval — auto_publish is never valid for meta_ads
  if (channel.platform === "meta_ads" && parsed.data.publish_mode === "auto_publish") {
    return NextResponse.json(
      { error: "Paid ads always require approval and cannot be set to auto_publish" },
      { status: 400 },
    );
  }

  const { data: updated, error } = await supabase
    .from("brand_channels")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ channel: updated });
}
