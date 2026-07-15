import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";

const UpdateExperimentSchema = z.object({
  status: z.literal("cancelled"),
});

/**
 * PATCH /api/founder/marketing/experiments/[id]
 * Escape hatch: cancel an experiment whose variants never went live (or
 * that's no longer worth running). Only cancellation is allowed — the
 * lifecycle otherwise advances via the metrics cron.
 */
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

  const parsed = UpdateExperimentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: experiment } = await supabase
    .from("marketing_experiments")
    .select("status")
    .eq("id", id)
    .single();

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (!["planned", "running"].includes(experiment.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a ${experiment.status} experiment` },
      { status: 409 },
    );
  }

  const { data: updated, error } = await supabase
    .from("marketing_experiments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ experiment: updated });
}
