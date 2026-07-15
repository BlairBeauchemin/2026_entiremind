import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { planBrandContent } from "@/lib/marketing/pipeline/plan";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

const FollowUpSchema = z.object({
  count: z.number().int().min(2).max(20).optional(),
});

/**
 * POST /api/founder/marketing/experiments/[id]/follow-up
 * "Double down": plan the next experiment seeded with the concluded
 * experiment's winner. Founder-initiated only — conclusions never
 * self-propagate.
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

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FollowUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: experiment } = await supabase
    .from("marketing_experiments")
    .select("*")
    .eq("id", id)
    .single();

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.status !== "concluded" || !experiment.winner_piece_id) {
    return NextResponse.json(
      { error: "Follow-ups require a concluded experiment with a winner" },
      { status: 409 },
    );
  }

  const { data: winner } = await supabase
    .from("content_pieces")
    .select("angle, headline, video_style, variant_label, format, platform, target")
    .eq("id", experiment.winner_piece_id)
    .single();

  if (!winner) {
    return NextResponse.json({ error: "Winner piece not found" }, { status: 404 });
  }

  const brief = [
    `Previous experiment "${experiment.name}" tested the variable "${experiment.variable}".`,
    `The winner (variant ${winner.variant_label ?? "?"}) was: angle="${winner.angle ?? ""}", hook="${winner.headline ?? ""}"${winner.video_style ? `, video_style="${winner.video_style}"` : ""} (${winner.target} on ${winner.platform}, ${winner.format}).`,
    `Double down: plan the next experiment holding the winning ${experiment.variable} fixed and testing the next most informative variable.`,
  ].join(" ");

  const result = await planBrandContent(experiment.brand_id, {
    campaignId: experiment.campaign_id ?? undefined,
    count: parsed.data.count,
    brief,
    createdBy: auth.userId,
    parentExperimentId: experiment.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await logAudit(auth.userId, "plan_follow_up", "experiment", id, {
    campaign_id: result.campaignId,
    new_experiment_ids: result.experimentIds,
  });

  return NextResponse.json({
    campaignId: result.campaignId,
    pieceIds: result.pieceIds,
    experimentIds: result.experimentIds,
  });
}
