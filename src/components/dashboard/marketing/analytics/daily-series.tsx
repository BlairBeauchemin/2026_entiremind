import type { DailyPoint } from "@/lib/marketing/analytics";

interface DailySeriesProps {
  points: DailyPoint[];
}

/**
 * Inline SVG column chart of daily impressions with clicks overlaid.
 * Presentational only — no client JS.
 */
export function DailySeries({ points }: DailySeriesProps) {
  const max = Math.max(1, ...points.map((p) => p.impressions));
  const width = 600;
  const height = 160;
  const barGap = 2;
  const barWidth = Math.max(2, width / points.length - barGap);

  const totalImpressions = points.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = points.reduce((sum, p) => sum + p.clicks, 0);
  const totalSpend = points.reduce((sum, p) => sum + p.spendCents, 0);

  return (
    <div className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-teal-900/40">Impressions</div>
          <div className="text-navy font-medium">{totalImpressions.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-teal-900/40">Clicks</div>
          <div className="text-navy font-medium">{totalClicks.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-teal-900/40">Spend</div>
          <div className="text-navy font-medium">${(totalSpend / 100).toFixed(2)}</div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-40"
        role="img"
        aria-label="Daily impressions over the last 30 days"
      >
        {points.map((point, i) => {
          const h = Math.round((point.impressions / max) * (height - 20));
          const clickH = Math.round((point.clicks / max) * (height - 20));
          const x = i * (barWidth + barGap);
          return (
            <g key={point.date}>
              <rect
                x={x}
                y={height - h}
                width={barWidth}
                height={h}
                rx={1.5}
                className="fill-em-purple-300/70"
              >
                <title>{`${point.date}: ${point.impressions.toLocaleString()} impressions, ${point.clicks.toLocaleString()} clicks`}</title>
              </rect>
              {clickH > 0 && (
                <rect
                  x={x}
                  y={height - clickH}
                  width={barWidth}
                  height={clickH}
                  rx={1.5}
                  className="fill-navy/80"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-teal-900/40">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
