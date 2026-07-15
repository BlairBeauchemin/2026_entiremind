import { createServiceRoleClient } from "../../supabase";
import type { ContentPieceRow, MarketingExperimentRow } from "../types";
import type { PlannedExperiment, PlannedPiece } from "./schemas";

// ============================================================
// Plan normalization (pure — all trust in the model lives here)
// ============================================================

export interface NormalizedPlan {
  /** Experiments that survived normalization. */
  experiments: PlannedExperiment[];
  /** All pieces; experiment linkage stripped from invalid groups. */
  pieces: PlannedPiece[];
}

/**
 * The planner model may emit orphan experiment names, one-variant
 * experiments, or variants that drift on the controlled variable. Fix all
 * of that deterministically:
 * - drop experiments with fewer than 2 surviving variant pieces
 * - strip experiment linkage from pieces referencing unknown experiments
 * - enforce the controlled variable: for any variable other than "angle",
 *   all variants share variant A's angle; for "video_style", variants must
 *   have distinct styles (later duplicates are unlinked from the experiment)
 * - ensure distinct variant labels (A, B, C... reassigned when missing/dup)
 */
export function normalizePlannedExperiments(plan: {
  experiments: PlannedExperiment[];
  pieces: PlannedPiece[];
}): NormalizedPlan {
  const experimentsByName = new Map(plan.experiments.map((e) => [e.name, e]));
  const groups = new Map<string, PlannedPiece[]>();

  const pieces = plan.pieces.map((p) => ({ ...p }));

  for (const piece of pieces) {
    if (!piece.experiment_name) continue;
    if (!experimentsByName.has(piece.experiment_name)) {
      piece.experiment_name = null;
      piece.variant_label = null;
      continue;
    }
    const group = groups.get(piece.experiment_name) ?? [];
    group.push(piece);
    groups.set(piece.experiment_name, group);
  }

  const survivingExperiments: PlannedExperiment[] = [];

  for (const experiment of plan.experiments) {
    const group = groups.get(experiment.name) ?? [];

    if (experiment.variable === "video_style") {
      // Variants must test distinct styles — unlink later duplicates
      const seen = new Set<string>();
      for (const piece of group) {
        const style = piece.video_style ?? "";
        if (seen.has(style)) {
          piece.experiment_name = null;
          piece.variant_label = null;
        } else {
          seen.add(style);
        }
      }
    }

    const variants = group.filter((p) => p.experiment_name === experiment.name);

    if (variants.length < 2) {
      for (const piece of variants) {
        piece.experiment_name = null;
        piece.variant_label = null;
      }
      continue;
    }

    // Hold everything except the tested variable constant
    if (experiment.variable !== "angle") {
      const anchor = variants[0].angle;
      for (const piece of variants) piece.angle = anchor;
    }
    if (["format", "audience", "cta"].includes(experiment.variable)) {
      const anchorHint = variants[0].headline_hint;
      for (const piece of variants) piece.headline_hint = anchorHint;
    }

    // Distinct labels A, B, C...
    const seenLabels = new Set<string>();
    variants.forEach((piece, i) => {
      let label = (piece.variant_label ?? "").trim().toUpperCase();
      if (!label || seenLabels.has(label)) {
        label = String.fromCharCode(65 + i); // A, B, C...
      }
      seenLabels.add(label);
      piece.variant_label = label;
    });

    survivingExperiments.push(experiment);
  }

  return { experiments: survivingExperiments, pieces };
}

// ============================================================
// Evaluation (pure)
// ============================================================

export interface VariantMetrics {
  pieceId: string;
  variantLabel: string | null;
  target: "ad" | "organic";
  impressions: number;
  clicks: number;
  conversions: number;
  likes: number;
  comments: number;
  shares: number;
}

export type ExperimentEvaluation =
  | { decided: false; reason: "insufficient_variants" | "below_threshold" | "tie" }
  | {
      decided: true;
      winnerPieceId: string;
      metric: "ctr" | "conversions" | "engagement_rate";
      scores: Record<string, number>;
    };

/**
 * Pick a winner once EVERY variant clears the impressions threshold.
 * Ads: CTR (tie-break: total conversions). Organic: engagement rate
 * (likes+comments+shares over impressions). Exact ties stay undecided —
 * a coin flip is not a finding.
 */
export function evaluateExperiment(
  variants: VariantMetrics[],
  minImpressions: number,
): ExperimentEvaluation {
  if (variants.length < 2) {
    return { decided: false, reason: "insufficient_variants" };
  }
  if (variants.some((v) => v.impressions < minImpressions)) {
    return { decided: false, reason: "below_threshold" };
  }

  const isAd = variants[0].target === "ad";
  const metric = isAd ? "ctr" : "engagement_rate";

  const scores: Record<string, number> = {};
  for (const v of variants) {
    scores[v.pieceId] = isAd
      ? v.clicks / v.impressions
      : (v.likes + v.comments + v.shares) / v.impressions;
  }

  const sorted = [...variants].sort((a, b) => {
    const scoreDiff = scores[b.pieceId] - scores[a.pieceId];
    if (scoreDiff !== 0) return scoreDiff;
    return b.conversions - a.conversions;
  });

  const [first, second] = sorted;
  if (
    scores[first.pieceId] === scores[second.pieceId] &&
    first.conversions === second.conversions
  ) {
    return { decided: false, reason: "tie" };
  }

  return { decided: true, winnerPieceId: first.pieceId, metric, scores };
}

// ============================================================
// Cron-side lifecycle
// ============================================================

const LIVE_STATUSES = ["published", "launched"];

export interface EvaluateRunResult {
  checked: number;
  started: number;
  concluded: number;
  errors: Array<{ experimentId: string; error: string }>;
}

/**
 * Advance experiment lifecycles from the daily metrics cron:
 * planned -> running when >=2 variants are live; running -> concluded when
 * evaluateExperiment decides. NEVER publishes or promotes anything —
 * conclusions are recommendations the founder acts on.
 */
export async function evaluateRunningExperiments(): Promise<EvaluateRunResult> {
  const supabase = createServiceRoleClient();
  const result: EvaluateRunResult = { checked: 0, started: 0, concluded: 0, errors: [] };

  const { data: experimentRows } = await supabase
    .from("marketing_experiments")
    .select("*")
    .in("status", ["planned", "running"]);

  for (const experiment of (experimentRows ?? []) as MarketingExperimentRow[]) {
    result.checked++;
    try {
      const { data: pieceRows } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("experiment_id", experiment.id);
      const piecesAll = (pieceRows ?? []) as ContentPieceRow[];
      const live = piecesAll.filter((p) => LIVE_STATUSES.includes(p.status));

      if (experiment.status === "planned") {
        if (live.length >= 2) {
          await supabase
            .from("marketing_experiments")
            .update({ status: "running" })
            .eq("id", experiment.id)
            .eq("status", "planned");
          result.started++;
        }
        continue;
      }

      // running: aggregate metrics per live variant
      if (live.length < 2) continue;

      const { data: metricRows } = await supabase
        .from("content_metrics")
        .select("content_piece_id, impressions, clicks, conversions, likes, comments, shares")
        .in("content_piece_id", live.map((p) => p.id));

      const totals = new Map<string, VariantMetrics>();
      for (const piece of live) {
        totals.set(piece.id, {
          pieceId: piece.id,
          variantLabel: piece.variant_label,
          target: piece.target,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        });
      }
      for (const m of (metricRows ?? []) as Array<{
        content_piece_id: string;
        impressions: number;
        clicks: number;
        conversions: number;
        likes: number;
        comments: number;
        shares: number;
      }>) {
        const t = totals.get(m.content_piece_id);
        if (!t) continue;
        t.impressions += m.impressions;
        t.clicks += m.clicks;
        t.conversions += m.conversions;
        t.likes += m.likes;
        t.comments += m.comments;
        t.shares += m.shares;
      }

      const evaluation = evaluateExperiment(
        Array.from(totals.values()),
        experiment.min_impressions,
      );
      if (!evaluation.decided) continue;

      const winner = live.find((p) => p.id === evaluation.winnerPieceId);
      const winnerScore = evaluation.scores[evaluation.winnerPieceId];
      const conclusion = `Variant ${winner?.variant_label ?? "?"} won on ${evaluation.metric.replace(/_/g, " ")} (${(winnerScore * 100).toFixed(2)}%) with all variants past ${experiment.min_impressions} impressions.`;

      await supabase
        .from("marketing_experiments")
        .update({
          status: "concluded",
          winner_piece_id: evaluation.winnerPieceId,
          conclusion,
          concluded_at: new Date().toISOString(),
        })
        .eq("id", experiment.id)
        .eq("status", "running");
      result.concluded++;
    } catch (error) {
      result.errors.push({
        experimentId: experiment.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
