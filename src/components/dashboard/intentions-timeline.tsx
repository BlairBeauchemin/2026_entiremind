"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
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

  // Get user reflections (inbound messages) for an intention's date range
  function getReflectionsForIntention(
    intention: Intention,
    index: number
  ): Message[] {
    const startDate = new Date(intention.createdAt);
    const nextIntention = sortedIntentions[index - 1]; // previous in sorted array = next chronologically
    const endDate = nextIntention ? new Date(nextIntention.createdAt) : new Date();

    return messages
      .filter((msg) => {
        if (msg.direction !== "inbound") return false;
        const msgDate = new Date(msg.createdAt);
        return msgDate >= startDate && msgDate < endDate;
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  return (
    <div className="space-y-6">
      {sortedIntentions.map((intention, index) => {
        const reflections = getReflectionsForIntention(intention, index);
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
                  {isActive ? "Active Intention" : "Past Intention"}
                </span>
              </div>
              <span className="text-[11px] text-teal-900/40">
                {formatDate(intention.createdAt)}
              </span>
            </div>

            {/* Intention text */}
            <p className="font-serif text-xl md:text-2xl italic text-navy leading-snug">
              &ldquo;{intention.text}&rdquo;
            </p>

            {/* Reflections section */}
            {reflections.length > 0 && (
              <>
                <div className="h-px bg-teal-900/10 my-6" />

                <div className="flex items-center gap-2 mb-4">
                  <BookOpen
                    className="w-3.5 h-3.5 text-teal-900/40"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
                    Your Reflections
                  </span>
                </div>

                <div className="space-y-3">
                  {reflections.map((reflection) => (
                    <div
                      key={reflection.id}
                      className="pl-4 border-l-2 border-em-purple-300/50"
                    >
                      <p className="text-sm text-teal-900/70 leading-relaxed">
                        {reflection.body}
                      </p>
                      <span className="text-[10px] text-teal-900/40 mt-1 block">
                        {formatShortDate(reflection.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
