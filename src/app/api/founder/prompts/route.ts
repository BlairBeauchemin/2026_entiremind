import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/founder/auth";

/**
 * GET /api/founder/prompts — list prompt versions, newest first.
 */
export async function GET() {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("system_prompts")
    .select("id, name, body, notes, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ prompts: data ?? [] });
}

/**
 * POST /api/founder/prompts — create a new version.
 * Body: { name, body, notes? }
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!name || !body) {
    return NextResponse.json(
      { error: "name and body are required" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("system_prompts")
    .insert({
      name,
      body,
      notes: typeof payload.notes === "string" ? payload.notes : null,
      created_by: auth.userId,
    })
    .select("id, name, body, notes, is_active, created_at, updated_at")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ prompt: data });
}

/**
 * PATCH /api/founder/prompts
 * Body: { id, action: 'activate' | 'deactivate' } or { id, action: 'update', name?, body?, notes? }
 *
 * Activate flips production generation to this version on the next send —
 * the UI confirms before calling. Editing is allowed only for versions that
 * are not active (activated history should stay immutable for A/B integrity;
 * sim_days snapshots protect past runs regardless).
 */
export async function PATCH(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id : null;
  const action =
    payload.action === "activate" ||
    payload.action === "deactivate" ||
    payload.action === "update"
      ? payload.action
      : null;
  if (!id || !action) {
    return NextResponse.json(
      { error: "id and action required" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("system_prompts")
    .select("id, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  if (action === "activate") {
    const { error: clearError } = await supabase
      .from("system_prompts")
      .update({ is_active: false })
      .eq("is_active", true);
    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
    const { error: setError } = await supabase
      .from("system_prompts")
      .update({ is_active: true })
      .eq("id", id);
    if (setError) {
      return NextResponse.json({ error: setError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "deactivate") {
    // Back to the built-in default constant.
    const { error } = await supabase
      .from("system_prompts")
      .update({ is_active: false })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // action === "update"
  if (existing.is_active) {
    return NextResponse.json(
      { error: "Cannot edit the active version — save as a new version" },
      { status: 409 },
    );
  }
  const updates: Record<string, string> = {};
  if (typeof payload.name === "string" && payload.name.trim()) {
    updates.name = payload.name.trim();
  }
  if (typeof payload.body === "string" && payload.body.trim()) {
    updates.body = payload.body.trim();
  }
  if (typeof payload.notes === "string") {
    updates.notes = payload.notes;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const { error } = await supabase
    .from("system_prompts")
    .update(updates)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
