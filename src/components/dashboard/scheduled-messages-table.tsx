"use client";

import { useState } from "react";
import { X, Loader2, Clock, CheckCircle, XCircle, Ban, Send } from "lucide-react";
import { motion } from "framer-motion";

interface ScheduledMessage {
  id: string;
  toPhone: string;
  text: string;
  scheduledFor: string;
  status: string;
  createdAt: string;
}

interface ScheduledMessagesTableProps {
  messages: ScheduledMessage[];
  onCancelled?: () => void;
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: <Clock className="w-3 h-3" />,
    },
    sent: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    failed: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <XCircle className="w-3 h-3" />,
    },
    cancelled: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      icon: <Ban className="w-3 h-3" />,
    },
  };

  const style = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.icon}
      {status}
    </span>
  );
}

export function ScheduledMessagesTable({
  messages,
  onCancelled,
}: ScheduledMessagesTableProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setError(null);

    try {
      const res = await fetch("/api/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to cancel message");
        return;
      }

      onCancelled?.();
    } catch {
      setError("Failed to cancel message");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSendNow = async (id: string) => {
    setSendingId(id);
    setError(null);

    try {
      const res = await fetch("/api/schedule/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      onCancelled?.(); // Refresh the list
    } catch {
      setError("Failed to send message");
    } finally {
      setSendingId(null);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-teal-900/10 bg-white/60 p-8 text-center">
        <p className="text-teal-900/50">No scheduled messages.</p>
        <p className="text-sm text-teal-900/40 mt-2">
          Schedule a message using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-teal-900/10 bg-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-teal-900/10 bg-teal-900/5">
                <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                  Scheduled For
                </th>
                <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                  Phone
                </th>
                <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3 min-w-[300px]">
                  Message
                </th>
                <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-teal-900/50 uppercase tracking-wider px-4 py-3">
                  Actions
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
                  className="border-b border-teal-900/5 hover:bg-teal-900/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-navy whitespace-nowrap">
                      {formatTime(msg.scheduledFor)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-teal-900/60 font-mono">
                      {truncatePhone(msg.toPhone)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-navy line-clamp-2">{msg.text}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={msg.status} />
                  </td>
                  <td className="px-4 py-3">
                    {msg.status === "pending" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSendNow(msg.id)}
                          disabled={sendingId === msg.id || cancellingId === msg.id}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          title="Send now"
                        >
                          {sendingId === msg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCancel(msg.id)}
                          disabled={cancellingId === msg.id || sendingId === msg.id}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Cancel message"
                        >
                          {cancellingId === msg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
