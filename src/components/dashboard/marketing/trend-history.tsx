export interface TrendHistoryItem {
  id: string;
  source: string;
  deltaSummary: string | null;
  newTrends: string[];
  droppedTrends: string[];
  insightCount: number;
  createdAt: string;
}

interface TrendHistoryProps {
  items: TrendHistoryItem[];
}

/**
 * Timeline of trend snapshots: what appeared, what faded out, week to week.
 */
export function TrendHistory({ items }: TrendHistoryProps) {
  if (items.length <= 1) {
    return (
      <div className="text-sm text-muted-foreground italic">
        History appears after the second research run — each snapshot is compared to the last.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-4 space-y-2"
        >
          <div className="text-[11px] uppercase tracking-widest text-teal-900/40">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {item.source.replace(/_/g, " ")}
            {" · "}
            {item.insightCount} insights
          </div>
          {item.deltaSummary && (
            <p className="text-sm text-teal-900/80">{item.deltaSummary}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {item.newTrends.map((t) => (
              <span
                key={`new-${t}`}
                className="rounded-full bg-em-purple-300/30 text-navy px-2 py-0.5 text-[11px]"
              >
                + {t}
              </span>
            ))}
            {item.droppedTrends.map((t) => (
              <span
                key={`dropped-${t}`}
                className="rounded-full bg-teal-900/10 text-teal-900/50 px-2 py-0.5 text-[11px] line-through"
              >
                {t}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
