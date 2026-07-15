import type { DailyMetric } from "../publishers/types";

/**
 * Deterministic placeholder daily metrics for unwired platform adapters.
 * Seeded by FNV-1a hash of pieceId+date, so the same piece always reports
 * the same history — the analytics/experiments loop works end-to-end
 * before real credentials exist. Rows built from this data are flagged
 * raw: { placeholder: true } and replaced once a real adapter reports.
 */

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlaceholderPiece {
  id: string;
  target: "ad" | "organic";
  daily_budget_cents: number | null;
  published_at: string | null;
}

function eachDate(sinceISODate: string, untilISODate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${sinceISODate}T00:00:00Z`);
  const until = new Date(`${untilISODate}T00:00:00Z`);
  while (cursor <= until) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function buildPlaceholderDailyMetrics(
  piece: PlaceholderPiece,
  sinceISODate: string,
  untilISODate: string,
): DailyMetric[] {
  // Clamp the window to the piece's live period
  const publishedDate = piece.published_at?.slice(0, 10) ?? sinceISODate;
  const start = publishedDate > sinceISODate ? publishedDate : sinceISODate;
  if (start > untilISODate) return [];

  return eachDate(start, untilISODate).map((date) => {
    const rand = mulberry32(fnv1a(`${piece.id}:${date}`));

    if (piece.target === "ad") {
      const impressions = Math.floor(300 + rand() * 1200);
      const ctr = 0.008 + rand() * 0.017; // 0.8% - 2.5%
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const budget = piece.daily_budget_cents ?? 2000;
      const spendCents = Math.round(budget * (0.85 + rand() * 0.3));
      const conversions = Math.round(clicks * (0.02 + rand() * 0.04));
      return {
        date,
        impressions,
        clicks,
        spendCents,
        conversions,
        likes: Math.round(impressions * 0.002 * rand() * 10),
        comments: Math.round(rand() * 3),
        shares: Math.round(rand() * 2),
        views: 0,
      };
    }

    const views = Math.floor(200 + rand() * 3800);
    const likes = Math.round(views * (0.02 + rand() * 0.06));
    return {
      date,
      impressions: views,
      clicks: Math.round(views * 0.01 * rand() * 3),
      spendCents: 0,
      conversions: 0,
      likes,
      comments: Math.round(likes * (0.05 + rand() * 0.1)),
      shares: Math.round(likes * (0.03 + rand() * 0.08)),
      views,
    };
  });
}
