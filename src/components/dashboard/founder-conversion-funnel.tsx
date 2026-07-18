/**
 * Acquisition funnel for the founder dashboard: leads → signups → onboarded
 * → paid, overall and per source (landing_page / quiz / share-{archetype}).
 * Presentational only — the server computes the numbers.
 */
import type {
  ConversionFunnel,
  SourceFunnel,
} from "@/lib/founder/conversion-funnel";

const STAGES: { key: keyof Omit<SourceFunnel, "source">; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "signups", label: "Signups" },
  { key: "onboarded", label: "Onboarded" },
  { key: "paid", label: "Paid" },
];

const SOURCE_LABELS: Record<string, string> = {
  landing_page: "Landing page",
  quiz: "Quiz",
  unknown: "Unknown",
};

function sourceLabel(source: string): string {
  if (source.startsWith("share-")) {
    const slug = source.slice("share-".length);
    return `Share — ${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  }
  return SOURCE_LABELS[source] ?? source;
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export function FounderConversionFunnel({
  funnel,
}: {
  funnel: ConversionFunnel;
}) {
  if (funnel.totals.leads === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No leads captured yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overall funnel bars */}
      <ul className="space-y-1.5">
        {STAGES.map(({ key, label }) => {
          const count = funnel.totals[key];
          const share = funnel.totals.leads
            ? Math.round((count / funnel.totals.leads) * 100)
            : 0;
          return (
            <li
              key={key}
              className="flex items-center gap-3 bg-white/60 border border-white/60 rounded-xl px-4 py-2.5"
            >
              <div className="w-28 shrink-0 text-sm text-navy">{label}</div>
              <div className="flex-1 h-3 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-em-yellow-400/70"
                  style={{ width: `${Math.min(share, 100)}%` }}
                />
              </div>
              <div className="w-10 shrink-0 text-right text-sm text-navy tabular-nums">
                {count}
              </div>
              <div className="w-12 shrink-0 text-right text-xs text-teal-900/50 tabular-nums">
                {share}%
              </div>
            </li>
          );
        })}
      </ul>

      {/* Per-source breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-teal-900/50">
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 pr-4 font-medium text-right">Leads</th>
              <th className="py-2 pr-4 font-medium text-right">Signups</th>
              <th className="py-2 pr-4 font-medium text-right">Onboarded</th>
              <th className="py-2 pr-4 font-medium text-right">Paid</th>
              <th className="py-2 font-medium text-right">Lead → paid</th>
            </tr>
          </thead>
          <tbody>
            {funnel.bySource.map((row) => (
              <tr
                key={row.source}
                className="border-t border-white/60 text-navy"
              >
                <td className="py-2 pr-4">{sourceLabel(row.source)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.leads}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.signups}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.onboarded}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.paid}
                </td>
                <td className="py-2 text-right tabular-nums text-teal-900/60">
                  {pct(row.paid, row.leads)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
