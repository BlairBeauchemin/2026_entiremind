"use client";

export interface TrendInsightView {
  trend: string;
  niche?: string;
  momentum?: "new" | "rising" | "steady" | "fading";
  relevance: string;
  suggested_angle: string;
  hooks: string[];
  formats: string[];
  suggested_video_styles?: string[];
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

const MOMENTUM_TONES: Record<string, string> = {
  new: "bg-em-purple-300/40 text-navy",
  rising: "bg-emerald-100 text-emerald-800",
  steady: "bg-teal-900/10 text-teal-900/70",
  fading: "bg-amber-100 text-amber-800",
};

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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-navy">{insight.trend}</span>
              {insight.momentum && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${MOMENTUM_TONES[insight.momentum] ?? MOMENTUM_TONES.steady}`}
                >
                  {insight.momentum}
                </span>
              )}
              {insight.niche && insight.niche !== "general" && (
                <span className="rounded-full bg-teal-900/10 text-teal-900/60 px-2 py-0.5 text-[10px]">
                  {insight.niche}
                </span>
              )}
            </div>
            <div className="text-xs text-teal-900/60">{insight.relevance}</div>
            <div className="text-xs text-em-purple-400 italic">{insight.suggested_angle}</div>
            {insight.hooks.length > 0 && (
              <ul className="text-xs text-teal-900/70 list-disc list-inside">
                {insight.hooks.slice(0, 2).map((hook, j) => (
                  <li key={j}>{hook}</li>
                ))}
              </ul>
            )}
            {insight.suggested_video_styles && insight.suggested_video_styles.length > 0 && (
              <div className="text-[11px] text-teal-900/50">
                Video styles: {insight.suggested_video_styles.join(", ").replace(/_/g, " ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
