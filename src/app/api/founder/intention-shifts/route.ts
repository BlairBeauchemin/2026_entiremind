import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";

async function requireFounder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "founder"].includes(profile.role ?? "")) {
    return { error: "Forbidden" as const };
  }
  return { userId: user.id };
}

/**
 * POST /api/founder/intention-shifts
 * Body: { id: string, action: "approve" | "dismiss" }
 *
 * Approve: archive the user's active intention, create a new one with the
 * proposed text, mark the suggestion as approved.
 * Dismiss: mark the suggestion as dismissed.
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
  const action = body.action === "approve" || body.action === "dismiss" ? body.action : null;
  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: suggestion, error: fetchError } = await supabase
    .from("intention_shift_suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { error: `Already ${suggestion.status}` },
      { status: 409 }
    );
  }

  if (action === "approve") {
    // Archive existing active intention(s)
    const { error: archiveError } = await supabase
      .from("intentions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", suggestion.user_id)
      .eq("status", "active");
    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    // Insert the new intention
    const { error: insertError } = await supabase.from("intentions").insert({
      user_id: suggestion.user_id,
      text: suggestion.proposed_intention,
      status: "active",
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase
    .from("intention_shift_suggestions")
    .update({
      status: action === "approve" ? "approved" : "dismissed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.userId,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
