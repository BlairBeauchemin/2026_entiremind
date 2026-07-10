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

const CONTENT_TYPES = ["reflection", "check-in", "action", "gratitude"];
const DISTORTIONS = [
  "worthiness",
  "all_or_nothing",
  "catastrophizing",
  "should_statements",
  "mind_reading",
  "discounting_positive",
  "personalization",
];
const SENTIMENTS = ["positive", "neutral", "struggling"];
const TONES = ["gentle", "direct", "socratic", "celebratory"];
const CATEGORIES = [
  "career",
  "health",
  "relationships",
  "money",
  "creative",
  "identity",
  "family",
  "spiritual",
];

function cleanArray(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === "string" && allowed.includes(v),
  );
}

/** Build the editable field set from a request body, dropping unknowns. */
function editableFields(body: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  if (typeof body.name === "string") fields.name = body.name.trim();
  if (typeof body.principle === "string")
    fields.principle = body.principle.trim();
  if (typeof body.prompt_recipe === "string")
    fields.prompt_recipe = body.prompt_recipe.trim();
  if ("content_types" in body)
    fields.content_types = cleanArray(body.content_types, CONTENT_TYPES);
  if ("target_distortions" in body)
    fields.target_distortions = cleanArray(
      body.target_distortions,
      DISTORTIONS,
    );
  if ("target_sentiments" in body)
    fields.target_sentiments = cleanArray(body.target_sentiments, SENTIMENTS);
  if ("tone_compatibility" in body)
    fields.tone_compatibility = cleanArray(body.tone_compatibility, TONES);
  if ("intention_categories" in body)
    fields.intention_categories = cleanArray(
      body.intention_categories,
      CATEGORIES,
    );
  if (typeof body.gentle === "boolean") fields.gentle = body.gentle;
  if (typeof body.priority === "number")
    fields.priority = Math.trunc(body.priority);
  if (typeof body.source_title === "string")
    fields.source_title = body.source_title.trim() || null;
  if (typeof body.source_author === "string")
    fields.source_author = body.source_author.trim() || null;
  return fields;
}

/**
 * POST /api/founder/techniques
 * Body: { action: "create" | "update" | "activate" | "retire", id?, ...fields }
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    const status = auth.error === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: auth.error }, { status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  const supabase = createServiceRoleClient();

  if (action === "create") {
    const fields = editableFields(body);
    if (!fields.name || !fields.principle || !fields.prompt_recipe) {
      return NextResponse.json(
        { error: "name, principle, and prompt_recipe are required" },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from("techniques")
      .insert({ ...fields, status: "draft" })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: data.id });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (action === "update") {
    const fields = editableFields(body);
    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: "no editable fields" },
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from("techniques")
      .update(fields)
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "activate" || action === "retire") {
    const status = action === "activate" ? "active" : "retired";
    const { error } = await supabase
      .from("techniques")
      .update({ status })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, status });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
