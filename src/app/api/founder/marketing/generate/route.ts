import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFounder, founderErrorStatus } from "@/lib/auth/founder";
import { planBrandContent } from "@/lib/marketing/pipeline/plan";
import { generateContentPiece } from "@/lib/marketing/pipeline/generate";
import { runTrendResearch } from "@/lib/marketing/trends";

export const maxDuration = 300;

const GenerateSchema = z.object({
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  mode: z.enum(["plan", "generate", "research"]),
  pieceId: z.string().uuid().optional(),
  count: z.number().int().min(1).max(20).optional(),
  brief: z.string().optional(),
});

/**
 * POST /api/founder/marketing/generate
 * On-demand agentic actions (the daily cron is the scheduled path):
 * - mode "research": run trend research now
 * - mode "plan": plan a week of content (campaign + draft pieces)
 * - mode "generate": generate one piece (pieceId) or all drafts for the brand
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: founderErrorStatus(auth.error) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { brandId, campaignId, mode, pieceId, count, brief } = parsed.data;

  if (mode === "research") {
    const result = await runTrendResearch(brandId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ snapshotId: result.snapshotId });
  }

  if (mode === "plan") {
    const result = await planBrandContent(brandId, {
      campaignId,
      count,
      brief,
      createdBy: auth.userId,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      campaignId: result.campaignId,
      pieceIds: result.pieceIds,
    });
  }

  // mode === "generate"
  if (pieceId) {
    const result = await generateContentPiece(pieceId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ status: result.status });
  }

  // Generate all drafts for the brand (bounded to keep within maxDuration)
  const { createServiceRoleClient } = await import("@/lib/supabase");
  const supabase = createServiceRoleClient();
  const { data: drafts } = await supabase
    .from("content_pieces")
    .select("id")
    .eq("brand_id", brandId)
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(10);

  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  for (const draft of drafts ?? []) {
    const result = await generateContentPiece(draft.id);
    results.push({ id: draft.id, success: result.success, error: result.error });
  }

  return NextResponse.json({ generated: results });
}
