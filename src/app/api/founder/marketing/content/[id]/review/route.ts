import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { logAudit } from "@/lib/audit";

const ReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
  scheduledFor: z.string().optional(),
});

/**
 * POST /api/founder/marketing/content/[id]/review
 * Approve or reject a pending_review piece. Approving with scheduledFor
 * moves it straight to scheduled for the publish cron.
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

  const parsed = ReviewSchema.safeParse(body);
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
  if (piece.status !== "pending_review") {
    return NextResponse.json({ error: `Already ${piece.status}` }, { status: 409 });
  }

  const { action, note, scheduledFor } = parsed.data;
  const status = action === "reject" ? "rejected" : scheduledFor ? "scheduled" : "approved";

  const { data: updated, error } = await supabase
    .from("content_pieces")
    .update({
      status,
      review_note: note ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.userId,
      ...(scheduledFor ? { scheduled_for: scheduledFor } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(auth.userId, "review_content", "content_piece", id, {
    action,
    status,
  });

  return NextResponse.json({ piece: updated });
}
