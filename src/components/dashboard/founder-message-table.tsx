"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface FounderMessage {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  status: string;
  createdAt: string;
  fromNumber: string;
  toNumber: string;
  userName: string;
  userPhone: string;
}

interface FounderMessageTableProps {
  messages: FounderMessage[];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function truncatePhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `...${phone.slice(-4)}`;
}

export function FounderMessageTable({ messages }: FounderMessageTableProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-sm border border-rule bg-surface p-8 text-center">
        <p className="text-muted">No messages yet.</p>
        <p className="text-sm text-muted mt-2">
          Messages will appear here once users start interacting via SMS.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-rule bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule bg-surface">
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Direction
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Phone
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3 min-w-[300px]">
                Message
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg, index) => (
              <motion.tr
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="border-b border-rule hover:bg-cobalt-wash transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      msg.direction === "inbound"
                        ? "bg-lavender/30 text-purple-700"
                        : "bg-gold/30 text-amber-700"
                    }`}
                  >
                    {msg.direction === "inbound" ? (
                      <ArrowDownLeft className="w-3 h-3" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    {msg.direction === "inbound" ? "In" : "Out"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-ink">
                    {msg.userName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted font-mono">
                    {truncatePhone(msg.userPhone)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-ink line-clamp-2">{msg.text}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      msg.status === "delivered" || msg.status === "received"
                        ? "bg-green-100 text-green-700"
                        : msg.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : msg.status === "sent"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-cobalt-wash text-muted"
                    }`}
                  >
                    {msg.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted whitespace-nowrap">
                    {formatTime(msg.createdAt)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {messages.length >= 100 && (
        <div className="px-4 py-3 border-t border-rule bg-surface text-center">
          <p className="text-xs text-muted">Showing latest 100 messages</p>
        </div>
      )}
    </div>
  );
}
