"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FounderUserInsight {
  userId: string;
  userName: string | null;
  userEmail: string;
  memory: {
    themes?: string[];
    vision?: string | null;
    obstacles?: string | null;
    recent_emotional_state?: string;
    open_threads?: string[];
    last_breakthrough?: string | null;
    tone_notes?: string | null;
  } | null;
  memoryUpdatedAt: string | null;
  recentThemes: { theme: string; category: string; count: number }[];
  sentimentTrend: { positive: number; neutral: number; struggling: number };
  replyRateByType: Record<string, { sends: number; replies: number; rate: number }>;
}

interface Props {
  insights: FounderUserInsight[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FounderUserInsights({ insights }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (insights.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No insights yet. They&apos;ll appear after the weekly memory cron runs.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <UserCard
          key={insight.userId}
          insight={insight}
          expanded={expandedId === insight.userId}
          onToggle={() =>
            setExpandedId(expandedId === insight.userId ? null : insight.userId)
          }
        />
      ))}
    </div>
  );
}

function UserCard({
  insight,
  expanded,
  onToggle,
}: {
  insight: FounderUserInsight;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sentimentTotal = useMemo(() => {
    const s = insight.sentimentTrend;
    return s.positive + s.neutral + s.struggling;
  }, [insight.sentimentTrend]);

  return (
    <div className="bg-white/60 border border-white/60 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-navy truncate">
              {insight.userName ?? insight.userEmail}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-teal-900/40">
              memory updated {formatDate(insight.memoryUpdatedAt)}
            </div>
          </div>
          <SentimentBar trend={insight.sentimentTrend} total={sentimentTotal} />
        </div>
        <ChevronDown
          className={`w-4 h-4 text-teal-900/40 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 text-sm">
              <MemoryPanel memory={insight.memory} />
              <ThemeCloud themes={insight.recentThemes} />
              <ReplyRateTable rates={insight.replyRateByType} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SentimentBar({
  trend,
  total,
}: {
  trend: FounderUserInsight["sentimentTrend"];
  total: number;
}) {
  if (total === 0) {
    return <div className="text-[11px] text-teal-900/30 italic">no signal</div>;
  }
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="hidden sm:flex h-2 w-32 rounded-full overflow-hidden border border-white/80">
      <div className="bg-emerald-400/70" style={{ width: pct(trend.positive) }} />
      <div className="bg-teal-300/60" style={{ width: pct(trend.neutral) }} />
      <div className="bg-rose-400/60" style={{ width: pct(trend.struggling) }} />
    </div>
  );
}

function MemoryRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-teal-900/40">
        {label}
      </div>
      <div className="text-navy">{value}</div>
    </div>
  );
}

function MemoryPanel({ memory }: { memory: FounderUserInsight["memory"] }) {
  if (!memory) {
    return (
      <div className="text-xs italic text-teal-900/50">
        No memory blob yet for this user.
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-em-purple-300/10 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-em-purple-400">
        Memory
      </div>
      <MemoryRow label="Vision" value={memory.vision ?? null} />
      <MemoryRow label="Obstacles" value={memory.obstacles ?? null} />
      <MemoryRow
        label="Recent emotional state"
        value={memory.recent_emotional_state ?? null}
      />
      <MemoryRow label="Last breakthrough" value={memory.last_breakthrough ?? null} />
      <MemoryRow label="Tone notes" value={memory.tone_notes ?? null} />
      {memory.open_threads && memory.open_threads.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40">
            Open threads
          </div>
          <ul className="list-disc pl-5 text-navy">
            {memory.open_threads.map((thread, i) => (
              <li key={i}>{thread}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThemeCloud({
  themes,
}: {
  themes: FounderUserInsight["recentThemes"];
}) {
  if (themes.length === 0) {
    return (
      <div className="text-xs italic text-teal-900/50">
        No themes tagged yet (last 30 days).
      </div>
    );
  }
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-2">
        Recent themes
      </div>
      <div className="flex flex-wrap gap-1.5">
        {themes.map((t) => (
          <span
            key={t.theme}
            className="text-xs px-2 py-1 rounded-full bg-em-yellow-400/20 text-navy border border-em-yellow-400/40"
            title={`${t.category} · ${t.count}×`}
          >
            {t.theme}
            <span className="text-teal-900/50 ml-1">×{t.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ReplyRateTable({
  rates,
}: {
  rates: FounderUserInsight["replyRateByType"];
}) {
  const entries = Object.entries(rates).filter(([, v]) => v.sends > 0);
  if (entries.length === 0) {
    return (
      <div className="text-xs italic text-teal-900/50">
        Not enough sends yet for per-type stats.
      </div>
    );
  }
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-2">
        Reply rate by type (last 30 days)
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-teal-900/50">
            <th className="text-left font-normal py-1">Type</th>
            <th className="text-right font-normal py-1">Sends</th>
            <th className="text-right font-normal py-1">Replies</th>
            <th className="text-right font-normal py-1">Rate</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([type, stat]) => (
            <tr key={type} className="border-t border-white/60">
              <td className="py-1.5 text-navy">{type}</td>
              <td className="py-1.5 text-right text-navy">{stat.sends}</td>
              <td className="py-1.5 text-right text-navy">{stat.replies}</td>
              <td className="py-1.5 text-right text-navy">
                {Math.round(stat.rate * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
