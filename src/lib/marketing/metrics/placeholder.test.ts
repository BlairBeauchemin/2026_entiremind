import { describe, it, expect } from "vitest";
import { buildPlaceholderDailyMetrics } from "./placeholder";

const adPiece = {
  id: "11111111-1111-1111-1111-111111111111",
  target: "ad" as const,
  daily_budget_cents: 2000,
  published_at: "2026-07-01T10:00:00Z",
};

describe("buildPlaceholderDailyMetrics", () => {
  it("is deterministic — same inputs produce identical output", () => {
    const a = buildPlaceholderDailyMetrics(adPiece, "2026-07-01", "2026-07-10");
    const b = buildPlaceholderDailyMetrics(adPiece, "2026-07-01", "2026-07-10");
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
  });

  it("differs across pieces", () => {
    const other = { ...adPiece, id: "22222222-2222-2222-2222-222222222222" };
    const a = buildPlaceholderDailyMetrics(adPiece, "2026-07-01", "2026-07-05");
    const b = buildPlaceholderDailyMetrics(other, "2026-07-01", "2026-07-05");
    expect(a).not.toEqual(b);
  });

  it("clamps the window to the publish date", () => {
    const piece = { ...adPiece, published_at: "2026-07-05T00:00:00Z" };
    const days = buildPlaceholderDailyMetrics(piece, "2026-07-01", "2026-07-10");
    expect(days[0].date).toBe("2026-07-05");
    expect(days).toHaveLength(6);
  });

  it("returns empty when published after the window", () => {
    const piece = { ...adPiece, published_at: "2026-08-01T00:00:00Z" };
    expect(buildPlaceholderDailyMetrics(piece, "2026-07-01", "2026-07-10")).toEqual([]);
  });

  it("shapes ad vs organic data differently", () => {
    const ad = buildPlaceholderDailyMetrics(adPiece, "2026-07-01", "2026-07-01")[0];
    expect(ad.spendCents).toBeGreaterThan(0);
    expect(ad.clicks).toBeGreaterThan(0);
    expect(ad.views).toBe(0);

    const organic = buildPlaceholderDailyMetrics(
      { ...adPiece, target: "organic" as const },
      "2026-07-01",
      "2026-07-01",
    )[0];
    expect(organic.spendCents).toBe(0);
    expect(organic.views).toBeGreaterThan(0);
    expect(organic.likes).toBeGreaterThan(0);
  });

  it("keeps ad CTR within the plausible range", () => {
    for (const day of buildPlaceholderDailyMetrics(adPiece, "2026-07-01", "2026-07-30")) {
      const ctr = day.clicks / day.impressions;
      expect(ctr).toBeGreaterThan(0.004);
      expect(ctr).toBeLessThan(0.05);
    }
  });
});
