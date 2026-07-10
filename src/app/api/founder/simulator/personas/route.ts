import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/founder/auth";
import { createTestPersona, deleteTestPersona } from "@/lib/simulator/personas";
import { REPLY_STYLES, type ReplyStyle } from "@/lib/simulator/types";
import type { QuizAnswers } from "@/lib/persona/types";

/**
 * GET /api/founder/simulator/personas
 * List test personas with their runs and engagement snapshot.
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

  const { data: personas, error } = await supabase
    .from("users")
    .select("id, name, created_at")
    .eq("is_test", true)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (personas ?? []).map((p) => p.id);
  const [{ data: runs }, { data: signals }, { data: intentions }] =
    await Promise.all([
      ids.length
        ? supabase
            .from("sim_runs")
            .select(
              "id, user_id, status, start_date, current_day, total_days, pinned_prompt_id, persona_brief, reply_style, created_at",
            )
            .in("user_id", ids)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("user_signals")
            .select(
              "user_id, engagement_score, reply_rate, consecutive_silences, total_replies",
            )
            .in("user_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("intentions")
            .select("user_id, text")
            .in("user_id", ids)
            .eq("status", "active")
        : Promise.resolve({ data: [] }),
    ]);

  return NextResponse.json({
    personas: (personas ?? []).map((p) => ({
      ...p,
      intention:
        (intentions ?? []).find((i) => i.user_id === p.id)?.text ?? null,
      signals: (signals ?? []).find((s) => s.user_id === p.id) ?? null,
      runs: (runs ?? []).filter((r) => r.user_id === p.id),
    })),
  });
}

/**
 * POST /api/founder/simulator/personas
 * Create a test persona (same data shapes as real onboarding, is_test, no phone).
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const personaBrief =
    typeof body.personaBrief === "string" ? body.personaBrief.trim() : "";
  const intention =
    typeof body.intention === "string" ? body.intention.trim() : "";
  const replyStyle = REPLY_STYLES.includes(body.replyStyle as ReplyStyle)
    ? (body.replyStyle as ReplyStyle)
    : null;
  const answers = body.answers as QuizAnswers | undefined;

  if (!name || !personaBrief || !intention || !replyStyle || !answers) {
    return NextResponse.json(
      {
        error:
          "name, personaBrief, intention, replyStyle, and answers are required",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createTestPersona({
      name,
      personaBrief,
      replyStyle,
      intention,
      vision: typeof body.vision === "string" ? body.vision.trim() : null,
      alignedState:
        typeof body.alignedState === "string" ? body.alignedState.trim() : null,
      answers,
      pinnedPromptId:
        typeof body.pinnedPromptId === "string" ? body.pinnedPromptId : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/founder/simulator/personas
 * Body: { userId } — delete a test persona (cascades everything).
 */
export async function DELETE(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: founderErrorStatus(auth.error) },
    );
  }

  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    await deleteTestPersona(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
