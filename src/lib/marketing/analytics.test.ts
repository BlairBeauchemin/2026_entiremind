import { describe, it, expect } from "vitest";
import {
  aggregateByDimension,
  buildDailySeries,
  hasPlaceholderData,
  type AnalyticsMetric,
  type AnalyticsPiece,
} from "./analytics";

const pieces: AnalyticsPiece[] = [
  { id: "p1", angle: "pain relief", video_style: "talking_head", format: "reel", platform: "instagram", target: "organic" },
  { id: "p2", angle: "aspiration", video_style: null, format: "image_ad", platform: "meta_ads", target: "ad" },
  { id: "p3", angle: null, video_style: null, format: "post", platform: "instagram", target: "organic" },
];

function metric(overrides: Partial<AnalyticsMetric>): AnalyticsMetric {
  return {
    content_piece_id: "p1",
    metric_date: "2026-07-10",
    impressions: 1000,
    clicks: 20,
    spend_cents: 0,
    conversions: 0,
    likes: 30,
    comments: 5,
    shares: 5,
    raw: null,
    ...overrides,
  };
}

describe("aggregateByDimension", () => {
  it("groups metrics by dimension and computes rates", () => {
    const rows = aggregateByDimension(
      pieces,
      [
        metric({ content_piece_id: "p1", impressions: 1000, clicks: 20 }),
        metric({ content_piece_id: "p1", metric_date: "2026-07-11", impressions: 1000, clicks: 30 }),
        metric({ content_piece_id: "p2", impressions: 500, clicks: 25, spend_cents: 1000 }),
      ],
      "target",
    );
    expect(rows).toHaveLength(2);
    const organic = rows.find((r) => r.key === "organic")!;
    expect(organic.impressions).toBe(2000);
    expect(organic.ctr).toBeCloseTo(50 / 2000);
    expect(organic.pieces).toBe(1);
    const ad = rows.find((r) => r.key === "ad")!;
    expect(ad.spendCents).toBe(1000);
  });

  it("buckets null dimension values as (none) and sorts by impressions", () => {
    const rows = aggregateByDimension(
      pieces,
      [
        metric({ content_piece_id: "p3", impressions: 5000 }),
        metric({ content_piece_id: "p1", impressions: 100 }),
      ],
      "angle",
    );
    expect(rows[0].key).toBe("(none)");
    expect(rows[0].impressions).toBe(5000);
    expect(rows[1].key).toBe("pain relief");
  });

  it("ignores metrics for unknown pieces", () => {
    const rows = aggregateByDimension(pieces, [metric({ content_piece_id: "ghost" })], "format");
    expect(rows).toEqual([]);
  });
});

describe("buildDailySeries", () => {
  it("zero-fills the full window and sums per day", () => {
    const today = new Date("2026-07-10T12:00:00Z");
    const series = buildDailySeries(
      [
        metric({ metric_date: "2026-07-09", impressions: 100, clicks: 5 }),
        metric({ metric_date: "2026-07-09", impressions: 50, clicks: 1 }),
        metric({ metric_date: "2026-06-01", impressions: 999 }), // outside window
      ],
      7,
      today,
    );
    expect(series).toHaveLength(7);
    expect(series[0].date).toBe("2026-07-04");
    expect(series[6].date).toBe("2026-07-10");
    const day = series.find((p) => p.date === "2026-07-09")!;
    expect(day.impressions).toBe(150);
    expect(day.clicks).toBe(6);
    expect(series.filter((p) => p.impressions === 0)).toHaveLength(6);
  });
});

describe("hasPlaceholderData", () => {
  it("detects placeholder rows", () => {
    expect(hasPlaceholderData([metric({ raw: { placeholder: true } })])).toBe(true);
    expect(hasPlaceholderData([metric({ raw: null }), metric({ raw: {} })])).toBe(false);
  });
});
