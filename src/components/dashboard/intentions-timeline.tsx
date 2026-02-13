"use client";

import { motion } from "framer-motion";
import { MessageCircle, Bot, User } from "lucide-react";
import Link from "next/link";
import type { Intention, Message } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface IntentionsTimelineProps {
  intentions: Intention[];
  messages: Message[];
}

export function IntentionsTimeline({
  intentions,
  messages,
}: IntentionsTimelineProps) {
  // Sort intentions newest first
  const sortedIntentions = [...intentions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get all messages (prompts + responses) for an intention's date range
  function getMessagesForIntention(
    intention: Intention,
    index: number
  ): Message[] {
    const startDate = new Date(intention.createdAt);
    const nextIntention = sortedIntentions[index - 1]; // previous in sorted array = next chronologically
    const endDate = nextIntention ? new Date(nextIntention.createdAt) : new Date();

    return messages
      .filter((msg) => {
        const msgDate = new Date(msg.createdAt);
        return msgDate >= startDate && msgDate < endDate;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return (
    <div className="space-y-6">
      {sortedIntentions.map((intention, index) => {
        const intentionMessages = getMessagesForIntention(intention, index);
        const isActive = intention.status === "active";

        return (
          <motion.div
            key={intention.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
            className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
          >
            {/* Header: status label + date */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive
                      ? "bg-emerald-500 animate-pulse-slow"
                      : "bg-teal-900/30"
                  }`}
                />
                <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
                  {isActive ? "Current Intention" : "Past Intention"}
                </span>
                {isActive && (
                  <Link
                    href="/dashboard"
                    className="text-xs text-teal-900/50 hover:text-teal-900/70 underline-offset-2 hover:underline ml-2"
                  >
                    Edit
                  </Link>
                )}
              </div>
              <span className="text-[11px] text-teal-900/40">
                {formatDate(intention.createdAt)}
              </span>
            </div>

            {/* Intention text */}
            <p className="font-serif text-xl md:text-2xl italic text-navy leading-snug">
              &ldquo;{intention.text}&rdquo;
            </p>

            {/* Conversation section */}
            {intentionMessages.length > 0 && (
              <>
                <div className="h-px bg-teal-900/10 my-6" />

                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle
                    className="w-3.5 h-3.5 text-teal-900/40"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
                    Conversation
                  </span>
                </div>

                <div className="space-y-3">
                  {intentionMessages.map((message) => {
                    const isOutbound = message.direction === "outbound";
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOutbound ? "opacity-70" : ""}`}
                      >
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isOutbound
                              ? "bg-teal-900/10"
                              : "bg-em-purple-300/30"
                          }`}
                        >
                          {isOutbound ? (
                            <Bot className="w-3 h-3 text-teal-900/50" strokeWidth={1.5} />
                          ) : (
                            <User className="w-3 h-3 text-em-purple-500" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-relaxed ${
                              isOutbound
                                ? "text-teal-900/50 italic"
                                : "text-teal-900/70"
                            }`}
                          >
                            {message.body}
                          </p>
                          <span className="text-[10px] text-teal-900/40 mt-1 block">
                            {formatShortDate(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
