export interface MetricsSummaryRow {
  campaignName: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  conversions: number;
}

interface MetricsSummaryProps {
  rows: MetricsSummaryRow[];
}

export function MetricsSummary({ rows }: MetricsSummaryProps) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No performance data yet. Metrics arrive daily once content is live (placeholder data until
        platform credentials are wired).
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-teal-900/40 border-b border-em-purple-300/30">
            <th className="py-2 pr-4">Campaign</th>
            <th className="py-2 pr-4">Impressions</th>
            <th className="py-2 pr-4">Clicks</th>
            <th className="py-2 pr-4">CTR</th>
            <th className="py-2 pr-4">Spend</th>
            <th className="py-2">Conversions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : "0.00";
            return (
              <tr key={i} className="border-b border-em-purple-300/20">
                <td className="py-2 pr-4 text-navy font-medium">{row.campaignName}</td>
                <td className="py-2 pr-4 text-teal-900/70">{row.impressions.toLocaleString()}</td>
                <td className="py-2 pr-4 text-teal-900/70">{row.clicks.toLocaleString()}</td>
                <td className="py-2 pr-4 text-teal-900/70">{ctr}%</td>
                <td className="py-2 pr-4 text-teal-900/70">${(row.spendCents / 100).toFixed(2)}</td>
                <td className="py-2 text-teal-900/70">{row.conversions.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
