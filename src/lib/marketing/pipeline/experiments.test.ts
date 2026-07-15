import { describe, it, expect } from "vitest";
import {
  evaluateExperiment,
  normalizePlannedExperiments,
  type VariantMetrics,
} from "./experiments";
import type { PlannedPiece } from "./schemas";

function adVariant(overrides: Partial<VariantMetrics>): VariantMetrics {
  return {
    pieceId: "p1",
    variantLabel: "A",
    target: "ad",
    impressions: 2000,
    clicks: 20,
    conversions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    ...overrides,
  };
}

describe("evaluateExperiment", () => {
  it("picks the ad variant with the highest CTR", () => {
    const result = evaluateExperiment(
      [
        adVariant({ pieceId: "a", impressions: 2000, clicks: 20 }), // 1.0%
        adVariant({ pieceId: "b", variantLabel: "B", impressions: 2000, clicks: 50 }), // 2.5%
      ],
      1000,
    );
    expect(result.decided).toBe(true);
    if (result.decided) {
      expect(result.winnerPieceId).toBe("b");
      expect(result.metric).toBe("ctr");
    }
  });

  it("stays undecided until every variant clears the threshold", () => {
    const result = evaluateExperiment(
      [
        adVariant({ pieceId: "a", impressions: 2000, clicks: 40 }),
        adVariant({ pieceId: "b", variantLabel: "B", impressions: 500, clicks: 30 }),
      ],
      1000,
    );
    expect(result).toEqual({ decided: false, reason: "below_threshold" });
  });

  it("breaks CTR ties on conversions", () => {
    const result = evaluateExperiment(
      [
        adVariant({ pieceId: "a", impressions: 1000, clicks: 10, conversions: 1 }),
        adVariant({ pieceId: "b", variantLabel: "B", impressions: 1000, clicks: 10, conversions: 5 }),
      ],
      1000,
    );
    expect(result.decided).toBe(true);
    if (result.decided) expect(result.winnerPieceId).toBe("b");
  });

  it("stays undecided on an exact tie", () => {
    const result = evaluateExperiment(
      [
        adVariant({ pieceId: "a", impressions: 1000, clicks: 10, conversions: 2 }),
        adVariant({ pieceId: "b", variantLabel: "B", impressions: 1000, clicks: 10, conversions: 2 }),
      ],
      1000,
    );
    expect(result).toEqual({ decided: false, reason: "tie" });
  });

  it("uses engagement rate for organic variants", () => {
    const result = evaluateExperiment(
      [
        adVariant({ pieceId: "a", target: "organic", impressions: 1000, clicks: 0, likes: 10 }),
        adVariant({
          pieceId: "b",
          variantLabel: "B",
          target: "organic",
          impressions: 1000,
          clicks: 0,
          likes: 40,
          comments: 10,
        }),
      ],
      1000,
    );
    expect(result.decided).toBe(true);
    if (result.decided) {
      expect(result.winnerPieceId).toBe("b");
      expect(result.metric).toBe("engagement_rate");
    }
  });

  it("needs at least two variants", () => {
    const result = evaluateExperiment([adVariant({})], 1000);
    expect(result).toEqual({ decided: false, reason: "insufficient_variants" });
  });
});

function plannedPiece(overrides: Partial<PlannedPiece>): PlannedPiece {
  return {
    target: "ad",
    platform: "meta_ads",
    format: "image_ad",
    production_mode: "ai_generated",
    video_style: null,
    angle: "angle one",
    headline_hint: "hint one",
    scheduled_offset_days: 0,
    experiment_name: null,
    variant_label: null,
    ...overrides,
  };
}

describe("normalizePlannedExperiments", () => {
  const hookExperiment = {
    name: "Hook test",
    hypothesis: "Pain hooks beat aspiration hooks",
    variable: "hook" as const,
    min_impressions: 1000,
  };

  it("drops experiments with fewer than two variants and unlinks their pieces", () => {
    const result = normalizePlannedExperiments({
      experiments: [hookExperiment],
      pieces: [plannedPiece({ experiment_name: "Hook test", variant_label: "A" })],
    });
    expect(result.experiments).toEqual([]);
    expect(result.pieces[0].experiment_name).toBeNull();
    expect(result.pieces[0].variant_label).toBeNull();
  });

  it("unlinks pieces referencing unknown experiments", () => {
    const result = normalizePlannedExperiments({
      experiments: [],
      pieces: [plannedPiece({ experiment_name: "Ghost", variant_label: "A" })],
    });
    expect(result.pieces[0].experiment_name).toBeNull();
  });

  it("holds the angle constant for non-angle experiments", () => {
    const result = normalizePlannedExperiments({
      experiments: [hookExperiment],
      pieces: [
        plannedPiece({ experiment_name: "Hook test", variant_label: "A", angle: "angle one" }),
        plannedPiece({
          experiment_name: "Hook test",
          variant_label: "B",
          angle: "angle DRIFTED",
          headline_hint: "hint two",
        }),
      ],
    });
    expect(result.experiments).toHaveLength(1);
    const variants = result.pieces.filter((p) => p.experiment_name === "Hook test");
    expect(variants.map((v) => v.angle)).toEqual(["angle one", "angle one"]);
    // hooks stay distinct — that's the tested variable
    expect(variants.map((v) => v.headline_hint)).toEqual(["hint one", "hint two"]);
  });

  it("dedupes styles in a video_style experiment", () => {
    const styleExperiment = {
      name: "Style test",
      hypothesis: "Talking head beats b-roll",
      variable: "video_style" as const,
      min_impressions: 1000,
    };
    const result = normalizePlannedExperiments({
      experiments: [styleExperiment],
      pieces: [
        plannedPiece({
          experiment_name: "Style test",
          variant_label: "A",
          format: "reel",
          platform: "instagram",
          target: "organic",
          video_style: "talking_head",
        }),
        plannedPiece({
          experiment_name: "Style test",
          variant_label: "B",
          format: "reel",
          platform: "instagram",
          target: "organic",
          video_style: "talking_head",
        }),
        plannedPiece({
          experiment_name: "Style test",
          variant_label: "C",
          format: "reel",
          platform: "instagram",
          target: "organic",
          video_style: "b_roll_voiceover",
        }),
      ],
    });
    const variants = result.pieces.filter((p) => p.experiment_name === "Style test");
    expect(variants).toHaveLength(2);
    expect(new Set(variants.map((v) => v.video_style)).size).toBe(2);
  });

  it("reassigns missing or duplicate variant labels", () => {
    const result = normalizePlannedExperiments({
      experiments: [hookExperiment],
      pieces: [
        plannedPiece({ experiment_name: "Hook test", variant_label: "A" }),
        plannedPiece({ experiment_name: "Hook test", variant_label: "A" }),
        plannedPiece({ experiment_name: "Hook test", variant_label: null }),
      ],
    });
    const labels = result.pieces
      .filter((p) => p.experiment_name === "Hook test")
      .map((p) => p.variant_label);
    expect(new Set(labels).size).toBe(3);
  });
});
