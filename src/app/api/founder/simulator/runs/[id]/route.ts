import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounderAndTestRun } from "@/lib/simulator/guard";

/**
 * GET /api/founder/simulator/runs/[id]
 * Full run state: run row + day-by-day ledger (with debug payloads) +
 * current engagement snapshot. The conversation timeline payload.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await requireFounderAndTestRun(id);
  if ("response" in gate) return gate.response;

  const supabase = createServiceRoleClient();

  const [{ data: run }, { data: days }, { data: signals }, { data: memory }] =
    await Promise.all([
      supabase.from("sim_runs").select("*").eq("id", id).single(),
      supabase
        .from("sim_days")
        .select("*")
        .eq("run_id", id)
        .order("day_number", { ascending: true }),
      supabase
        .from("user_signals")
        .select(
          "engagement_score, reply_rate, consecutive_silences, total_replies, total_messages_sent",
        )
        .eq("user_id", gate.userId)
        .maybeSingle(),
      supabase
        .from("user_memory")
        .select("summary, updated_at")
        .eq("user_id", gate.userId)
        .maybeSingle(),
    ]);

  return NextResponse.json({
    run,
    days: days ?? [],
    signals: signals ?? null,
    memory: memory ?? null,
  });
}
