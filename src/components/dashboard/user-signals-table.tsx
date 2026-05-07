"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export function UserSignalsTable({ signals }: UserSignalsTableProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-teal-900/10 bg-white/60 p-8 text-center">
        <p className="text-teal-900/50">No user signals yet.</p>
        <p className="text-sm text-teal-900/40 mt-2">
          Signal data will appear here once users receive messages and start responding.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-900/10 bg-white/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-teal-900/10 bg-teal-900/5">
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Engagement
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Messages
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Replies
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Reply Rate
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Avg Reply Time
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Silences
              </th>
              <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                Last Reply
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
                className="border-b border-teal-900/5 hover:bg-teal-900/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-navy block">
                      {signal.userName || "Unknown"}
                    </span>
                    <span className="text-xs text-teal-900/50">
                      {signal.userEmail}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(
                      signal.engagementScore
                    )}`}
                  >
                    {getEngagementIcon(signal.engagementScore)}
                    {signal.engagementScore.toFixed(0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-navy">
                    {signal.totalMessagesSent}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-navy">{signal.totalReplies}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-navy">
                    {signal.replyRate !== null
                      ? `${signal.replyRate.toFixed(0)}%`
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-navy">
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
                        : "text-navy"
                    }`}
                  >
                    {signal.consecutiveSilences}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-teal-900/60 whitespace-nowrap">
                    {formatTime(signal.lastReplyAt)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
