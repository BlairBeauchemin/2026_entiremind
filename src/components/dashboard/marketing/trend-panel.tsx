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
        No trend research yet. Run it from the campaign section or wait for the Monday planning cron.
      </div>
    );
  }

  return (
    <div className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-teal-900/40">
          Source: {snapshot.source.replace(/_/g, " ")} ·{" "}
          {new Date(snapshot.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-sm text-teal-900/80">{snapshot.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {snapshot.insights.map((insight, i) => (
          <div key={i} className="rounded-xl bg-em-purple-300/10 border border-em-purple-300/30 p-3 space-y-1">
            <div className="text-sm font-medium text-navy">{insight.trend}</div>
            <div className="text-xs text-teal-900/60">{insight.relevance}</div>
            <div className="text-xs text-em-purple-400 italic">{insight.suggested_angle}</div>
            {insight.hooks.length > 0 && (
              <ul className="text-xs text-teal-900/70 list-disc list-inside">
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
