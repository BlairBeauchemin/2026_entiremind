/**
 * Pure aggregation helpers for the founder analytics page. All inputs are
 * plain rows; no Supabase access here so everything is unit-testable.
 */

export type AnalyticsDimension = "angle" | "video_style" | "format" | "platform" | "target";

export interface AnalyticsPiece {
  id: string;
  angle: string | null;
  video_style: string | null;
  format: string;
  platform: string;
  target: string;
}

export interface AnalyticsMetric {
  content_piece_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  conversions: number;
  likes: number;
  comments: number;
  shares: number;
  raw: Record<string, unknown> | null;
}

export interface DimensionRow {
  key: string;
  pieces: number;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
  engagements: number;
  ctr: number;
  engagementRate: number;
}

const NONE_KEY = "(none)";

export function aggregateByDimension(
  pieces: AnalyticsPiece[],
  metrics: AnalyticsMetric[],
  dimension: AnalyticsDimension,
): DimensionRow[] {
  const keyByPiece = new Map<string, string>();
  for (const piece of pieces) {
    keyByPiece.set(piece.id, piece[dimension] ?? NONE_KEY);
  }

  const rows = new Map<string, DimensionRow & { pieceIds: Set<string> }>();
  for (const metric of metrics) {
    const key = keyByPiece.get(metric.content_piece_id);
    if (key === undefined) continue;
    const row = rows.get(key) ?? {
      key,
      pieces: 0,
      pieceIds: new Set<string>(),
      impressions: 0,
      clicks: 0,
      spendCents: 0,
      conversions: 0,
      engagements: 0,
      ctr: 0,
      engagementRate: 0,
    };
    row.pieceIds.add(metric.content_piece_id);
    row.impressions += metric.impressions;
    row.clicks += metric.clicks;
    row.spendCents += metric.spend_cents;
    row.conversions += metric.conversions;
    row.engagements += metric.likes + metric.comments + metric.shares;
    rows.set(key, row);
  }

  return Array.from(rows.values())
    .map(({ pieceIds, ...row }) => ({
      ...row,
      pieces: pieceIds.size,
      ctr: row.impressions > 0 ? row.clicks / row.impressions : 0,
      engagementRate: row.impressions > 0 ? row.engagements / row.impressions : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

export interface DailyPoint {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
}

/** Zero-filled daily series for the last `days` days ending today. */
export function buildDailySeries(
  metrics: Array<Pick<AnalyticsMetric, "metric_date" | "impressions" | "clicks" | "spend_cents">>,
  days: number,
  today: Date = new Date(),
): DailyPoint[] {
  const byDate = new Map<string, DailyPoint>();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    byDate.set(date, { date, impressions: 0, clicks: 0, spendCents: 0 });
  }

  for (const metric of metrics) {
    const point = byDate.get(metric.metric_date);
    if (!point) continue;
    point.impressions += metric.impressions;
    point.clicks += metric.clicks;
    point.spendCents += metric.spend_cents;
  }

  return Array.from(byDate.values());
}

export function hasPlaceholderData(
  metrics: Array<{ raw: Record<string, unknown> | null }>,
): boolean {
  return metrics.some((m) => m.raw?.placeholder === true);
}
