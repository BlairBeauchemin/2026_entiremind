"use client";

export interface TrendInsightView {
  trend: string;
  relevance: string;
  suggested_angle: string;
  hooks: string[];
  formats: string[];
}

export interface TrendSnapshotView {
  id: string;
  source: string;
  summary: string;
  insights: TrendInsightView[];
  createdAt: string;
}

interface TrendPanelProps {
  snapshot: TrendSnapshotView | null;
}

export function TrendPanel({ snapshot }: TrendPanelProps) {
  if (!snapshot) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No trend research yet. Run it from the campaign section or wait for the
        Monday planning cron.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-rule rounded-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-muted">
          Source: {snapshot.source.replace(/_/g, " ")} ·{" "}
          {new Date(snapshot.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-sm text-ink">{snapshot.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {snapshot.insights.map((insight, i) => (
          <div
            key={i}
            className="rounded-sm bg-cobalt-wash border border-rule p-3 space-y-1"
          >
            <div className="text-sm font-medium text-ink">{insight.trend}</div>
            <div className="text-xs text-muted">{insight.relevance}</div>
            <div className="text-xs text-cobalt italic">
              {insight.suggested_angle}
            </div>
            {insight.hooks.length > 0 && (
              <ul className="text-xs text-muted list-disc list-inside">
                {insight.hooks.slice(0, 2).map((hook, j) => (
                  <li key={j}>{hook}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
