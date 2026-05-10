"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Message } from "@/lib/types";
import { MessageCard, type PairedMessage } from "./message-card";

/**
 * Pairs outbound prompts with their following inbound replies.
 * Each outbound message is matched with the next inbound message (if exists).
 * Unpaired outbound messages are kept as prompts without replies.
 * Standalone inbound messages (without preceding outbound) are shown as unprompted replies.
 */
function pairMessages(messages: Message[]): PairedMessage[] {
  // Sort by createdAt ascending (oldest first)
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const paired: PairedMessage[] = [];
  let i = 0;

  while (i < sorted.length) {
    const current = sorted[i];

    if (current.direction === "outbound") {
      // Look for the next inbound message as a potential reply
      const next = sorted[i + 1];
      if (next && next.direction === "inbound") {
        paired.push({ prompt: current, reply: next });
        i += 2;
      } else {
        // Outbound with no reply yet
        paired.push({ prompt: current });
        i += 1;
      }
    } else {
      // Standalone inbound (unprompted reply) - show as its own card
      // Create a synthetic prompt for display purposes
      paired.push({
        prompt: {
          ...current,
          body: "You reached out:",
          direction: "outbound",
        },
        reply: current,
      });
      i += 1;
    }
  }

  // Reverse to show newest first
  return paired.reverse();
}

interface MessageFeedProps {
  messages: Message[];
}

export function MessageFeed({ messages }: MessageFeedProps) {
  const paired = pairMessages(messages);

  return (
    <section aria-label="Message history" className="space-y-6">
      <h2 className="font-serif text-2xl md:text-3xl text-navy font-medium">
        Your Journey
      </h2>

      <div className="space-y-6" role="feed" aria-label="Message cards">
        {paired.map((item, index) => (
          <MessageCard
            key={item.prompt.id}
            prompt={item.prompt}
            reply={item.reply}
            index={index}
          />
        ))}
      </div>

      {/* Journey start marker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex items-center gap-3 justify-center py-4"
        role="separator"
        aria-label="Beginning of your journey"
      >
        <div className="h-px flex-1 bg-teal-900/10" aria-hidden="true" />
        <span className="flex items-center gap-2 text-sm text-teal-900/30 font-medium uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          Beginning of your journey
        </span>
        <div className="h-px flex-1 bg-teal-900/10" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
