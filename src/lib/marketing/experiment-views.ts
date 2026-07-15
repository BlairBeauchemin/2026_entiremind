import { createServiceRoleClient } from "../supabase";
import type { ContentPieceRow, MarketingExperimentRow } from "./types";
import type { ExperimentView } from "@/components/dashboard/marketing/experiment-list";

/**
 * Build the founder-facing experiment view models: experiments + their
 * variant pieces + aggregated metric totals per variant.
 */
export async function buildExperimentViews(brandId: string): Promise<ExperimentView[]> {
  const supabase = createServiceRoleClient();

  const { data: experimentRows } = await supabase
    .from("marketing_experiments")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(20);
  const experiments = (experimentRows ?? []) as MarketingExperimentRow[];
  if (experiments.length === 0) return [];

  const { data: pieceRows } = await supabase
    .from("content_pieces")
    .select("*")
    .in("experiment_id", experiments.map((e) => e.id));
  const pieces = (pieceRows ?? []) as ContentPieceRow[];

  const { data: metricRows } = pieces.length
    ? await supabase
        .from("content_metrics")
        .select("content_piece_id, impressions, clicks, conversions, likes, comments, shares, raw")
        .in("content_piece_id", pieces.map((p) => p.id))
    : { data: [] };

  const totalsByPiece = new Map<
    string,
    { impressions: number; clicks: number; conversions: number; engagements: number; placeholder: boolean }
  >();
  for (const m of (metricRows ?? []) as Array<{
    content_piece_id: string;
    impressions: number;
    clicks: number;
    conversions: number;
    likes: number;
    comments: number;
    shares: number;
    raw: Record<string, unknown> | null;
  }>) {
    const t = totalsByPiece.get(m.content_piece_id) ?? {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      engagements: 0,
      placeholder: false,
    };
    t.impressions += m.impressions;
    t.clicks += m.clicks;
    t.conversions += m.conversions;
    t.engagements += m.likes + m.comments + m.shares;
    if (m.raw?.placeholder === true) t.placeholder = true;
    totalsByPiece.set(m.content_piece_id, t);
  }

  return experiments.map((experiment) => {
    const variants = pieces
      .filter((p) => p.experiment_id === experiment.id)
      .sort((a, b) => (a.variant_label ?? "").localeCompare(b.variant_label ?? ""))
      .map((p) => {
        const totals = totalsByPiece.get(p.id);
        return {
          pieceId: p.id,
          variantLabel: p.variant_label,
          status: p.status,
          summary: p.headline ?? p.angle ?? p.caption?.slice(0, 60) ?? "Untitled",
          videoStyle: p.video_style,
          impressions: totals?.impressions ?? 0,
          clicks: totals?.clicks ?? 0,
          conversions: totals?.conversions ?? 0,
          engagements: totals?.engagements ?? 0,
        };
      });

    return {
      id: experiment.id,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      variable: experiment.variable,
      status: experiment.status,
      minImpressions: experiment.min_impressions,
      winnerPieceId: experiment.winner_piece_id,
      conclusion: experiment.conclusion,
      acknowledged: experiment.acknowledged_at !== null,
      hasPlaceholderData: variants.some((v) => totalsByPiece.get(v.pieceId)?.placeholder),
      createdAt: experiment.created_at,
      variants,
    };
  });
}
