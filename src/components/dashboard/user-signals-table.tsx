"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Loader2, Quote } from "lucide-react";

interface UserSignal {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalMessagesSent: number;
  totalReplies: number;
  replyRate: number | null;
  avgReplyTimeMinutes: number | null;
  consecutiveSilences: number;
  engagementScore: number;
  lastReplyAt: string | null;
}

interface UserSignalsTableProps {
  signals: UserSignal[];
  /** Users who already have a non-dismissed testimonial row (ask disabled). */
  testimonialUserIds?: string[];
}

function formatTime(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getEngagementColor(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function getEngagementIcon(score: number) {
  if (score >= 60) return <TrendingUp className="w-3 h-3" />;
  if (score >= 40) return <Minus className="w-3 h-3" />;
  return <TrendingDown className="w-3 h-3" />;
}

export function UserSignalsTable({
  signals,
  testimonialUserIds = [],
}: UserSignalsTableProps) {
  const [askedIds, setAskedIds] = useState<Set<string>>(
    new Set(testimonialUserIds),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  async function requestTestimonial(userId: string) {
    setPendingId(userId);
    setAskError(null);
    try {
      const res = await fetch("/api/founder/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAskError(body.error || `Request failed (${res.status})`);
        return;
      }
      setAskedIds((prev) => new Set(prev).add(userId));
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  if (signals.length === 0) {
    return (
      <div className="rounded-sm border border-rule bg-surface p-8 text-center">
        <p className="text-muted">No user signals yet.</p>
        <p className="text-sm text-muted mt-2">
          Signal data will appear here once users receive messages and start
          responding.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-rule bg-surface overflow-hidden">
      {askError && (
        <div className="text-sm text-red-600 bg-red-50 border-b border-red-200 p-2 px-4">
          {askError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule bg-surface">
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Engagement
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Messages
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Replies
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Reply Rate
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Avg Reply Time
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Silences
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Last Reply
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Testimonial
              </th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, index) => (
              <motion.tr
                key={signal.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="border-b border-rule hover:bg-cobalt-wash transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-ink block">
                      {signal.userName || "Unknown"}
                    </span>
                    <span className="text-xs text-muted">
                      {signal.userEmail}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(
                      signal.engagementScore,
                    )}`}
                  >
                    {getEngagementIcon(signal.engagementScore)}
                    {signal.engagementScore.toFixed(0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-ink">
                    {signal.totalMessagesSent}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-ink">
                    {signal.totalReplies}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-ink">
                    {signal.replyRate !== null
                      ? `${signal.replyRate.toFixed(0)}%`
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-ink">
                    {signal.avgReplyTimeMinutes !== null
                      ? `${signal.avgReplyTimeMinutes} min`
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm ${
                      signal.consecutiveSilences >= 3
                        ? "text-red-600 font-medium"
                        : "text-ink"
                    }`}
                  >
                    {signal.consecutiveSilences}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted whitespace-nowrap">
                    {formatTime(signal.lastReplyAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {askedIds.has(signal.userId) ? (
                    <span className="text-xs text-muted whitespace-nowrap">
                      Asked
                    </span>
                  ) : (
                    <button
                      onClick={() => requestTestimonial(signal.userId)}
                      disabled={pendingId === signal.userId}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink border border-rule px-2.5 py-1 rounded-full hover:bg-cobalt hover:text-linen transition-colors disabled:opacity-50 whitespace-nowrap"
                      title="Send a testimonial request SMS to this user"
                    >
                      {pendingId === signal.userId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Quote className="w-3 h-3" />
                      )}
                      Ask
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
