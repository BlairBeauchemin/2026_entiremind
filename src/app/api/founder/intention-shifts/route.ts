import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder } from "@/lib/founder/auth";

/**
 * POST /api/founder/intention-shifts
 * Body: { id: string, action: "dismiss" }
 *
 * Dismiss: clear a detected shift from the founder log.
 *
 * There is deliberately no "approve" action. Approving used to archive the
 * user's active intention and write a new one on their behalf — the intention
 * is the one thing in the product the user authored, and nobody else edits it,
 * founder included. Detection now texts the *user* a one-time nudge pointing
 * them at /dashboard/intentions (see src/lib/ai/memory.ts recordIntentionShift
 * and src/lib/intentions/shift-nudge.ts); this endpoint only tidies the log.
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    const status = auth.error === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: auth.error }, { status });
  }

  let body: { id?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const action = body.action === "dismiss" ? body.action : null;
  if (!id || !action) {
    return NextResponse.json(
      { error: "id and action: 'dismiss' required" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();

  const { data: suggestion, error: fetchError } = await supabase
    .from("intention_shift_suggestions")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !suggestion) {
    return NextResponse.json(
      { error: "Suggestion not found" },
      { status: 404 },
    );
  }

  if (suggestion.status === "dismissed") {
    return NextResponse.json({ error: "Already dismissed" }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("intention_shift_suggestions")
    .update({
      status: "dismissed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.userId,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
