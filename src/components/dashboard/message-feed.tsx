"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - target.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toLocaleDateString("en-US");
    const existing = groups.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      groups.set(key, [msg]);
    }
  }
  return groups;
}

interface MessageFeedProps {
  messages: Message[];
}

export function MessageFeed({ messages }: MessageFeedProps) {
  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const groups = groupByDate(sorted);
  let globalIndex = 0;

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl text-navy font-medium">Messages</h2>

      {Array.from(groups.entries()).map(([dateKey, msgs]) => (
        <div key={dateKey} className="space-y-5">
          {/* Date divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-teal-900/10" />
            <span className="text-[11px] text-teal-900/40 font-medium uppercase tracking-widest">
              {formatDateLabel(msgs[0].createdAt)}
            </span>
            <div className="h-px flex-1 bg-teal-900/10" />
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-5">
            {msgs.map((msg) => {
              const idx = globalIndex++;
              return <MessageBubble key={msg.id} message={msg} index={idx} />;
            })}
          </div>
        </div>
      ))}

      {/* Journey start marker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex items-center gap-3 justify-center py-4"
      >
        <div className="h-px flex-1 bg-teal-900/10" />
        <span className="flex items-center gap-2 text-[11px] text-teal-900/30 font-medium uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Beginning of your journey
        </span>
        <div className="h-px flex-1 bg-teal-900/10" />
      </motion.div>
    </div>
  );
}
