"use client";

import { motion } from "framer-motion";
import type { Message } from "@/lib/types";

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
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatIsoDate(iso: string): string {
  return new Date(iso).toISOString();
}

export interface PairedMessage {
  prompt: Message;
  reply?: Message;
}

interface MessageCardProps {
  prompt: Message;
  reply?: Message;
  index: number;
}

export function MessageCard({ prompt, reply, index }: MessageCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="bg-surface rounded-sm border border-rule p-5 md:p-6"
      aria-label={`Message from ${formatDateLabel(prompt.createdAt)}`}
    >
      {/* Date header */}
      <time
        dateTime={formatIsoDate(prompt.createdAt)}
        className="text-sm font-medium uppercase tracking-wider text-muted"
      >
        {formatDateLabel(prompt.createdAt)}
      </time>

      {/* The prompt carries the meaning, so it takes the serif; the reply
          below is the user's own voice in the sans. That reads as a
          difference in kind rather than a difference in weight. */}
      <p className="mt-4 font-serif text-lg md:text-xl text-ink leading-relaxed">
        {prompt.body}
      </p>

      {/* Reply (if exists) */}
      {reply && (
        <p className="mt-4 text-lg text-ink leading-relaxed">{reply.body}</p>
      )}

      {/* Metadata footer */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        <span>Via Text Message</span>
        <span aria-hidden="true">•</span>
        <span>{formatTime(prompt.createdAt)}</span>
      </div>
    </motion.article>
  );
}
