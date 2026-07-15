import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/founder/marketing/experiments/[id]/ack
 * Mark a concluded experiment's recommendation as seen (idempotent).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: experiment } = await supabase
    .from("marketing_experiments")
    .select("id, status, acknowledged_at")
    .eq("id", id)
    .single();

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.status !== "concluded") {
    return NextResponse.json({ error: "Only concluded experiments can be acknowledged" }, { status: 409 });
  }

  if (!experiment.acknowledged_at) {
    const { error } = await supabase
      .from("marketing_experiments")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await logAudit(auth.userId, "ack_experiment", "experiment", id);
  }

  return NextResponse.json({ success: true });
}
