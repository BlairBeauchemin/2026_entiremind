import type { DimensionRow } from "@/lib/marketing/analytics";

interface DimensionBreakdownProps {
  title: string;
  rows: DimensionRow[];
  /** Show engagement rate instead of CTR (organic dimensions). */
  showEngagement?: boolean;
}

/**
 * Percent-width CSS bars per dimension value (same approach as
 * founder-onboarding-funnel.tsx) — no chart library.
 */
export function DimensionBreakdown({ title, rows, showEngagement = false }: DimensionBreakdownProps) {
  if (rows.length === 0) {
    return null;
  }
  const max = Math.max(1, ...rows.map((r) => r.impressions));

  return (
    <div className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-medium text-navy">{title}</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-navy font-medium truncate max-w-[60%]">
                {row.key.replace(/_/g, " ")}
              </span>
              <span className="text-teal-900/60">
                {row.impressions.toLocaleString()} imp ·{" "}
                {showEngagement
                  ? `${(row.engagementRate * 100).toFixed(2)}% eng`
                  : `${(row.ctr * 100).toFixed(2)}% CTR`}
                {row.spendCents > 0 ? ` · $${(row.spendCents / 100).toFixed(2)}` : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-teal-900/5">
              <div
                className="h-2 rounded-full bg-em-purple-300/80"
                style={{ width: `${Math.max(2, (row.impressions / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
