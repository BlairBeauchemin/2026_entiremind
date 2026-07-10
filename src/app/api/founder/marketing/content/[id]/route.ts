import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { EDITABLE_STATUSES } from "@/lib/marketing/types";

const UpdatePieceSchema = z.object({
  headline: z.string().nullable().optional(),
  body_copy: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  script: z.string().nullable().optional(),
  image_prompt: z.string().nullable().optional(),
  cta: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  link_url: z.string().nullable().optional(),
  angle: z.string().nullable().optional(),
  production_mode: z.enum(["ai_generated", "founder_filmed"]).optional(),
  daily_budget_cents: z.number().int().positive().nullable().optional(),
  targeting: z.record(z.string(), z.unknown()).nullable().optional(),
  scheduled_for: z.string().nullable().optional(),
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

  const parsed = UpdatePieceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: piece } = await supabase
    .from("content_pieces")
    .select("status")
    .eq("id", id)
    .single();

  if (!piece) {
    return NextResponse.json({ error: "Piece not found" }, { status: 404 });
  }
  if (!(EDITABLE_STATUSES as readonly string[]).includes(piece.status)) {
    return NextResponse.json(
      { error: `Cannot edit a piece with status ${piece.status}` },
      { status: 409 },
    );
  }

  const { data: updated, error } = await supabase
    .from("content_pieces")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ piece: updated });
}
