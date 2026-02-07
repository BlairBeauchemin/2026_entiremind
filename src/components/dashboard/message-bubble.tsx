"use client";

import { motion } from "framer-motion";
import type { Message } from "@/lib/types";

const typeBadgeStyles: Record<string, string> = {
  reflection: "bg-em-purple-100 text-em-purple-300",
  "check-in": "bg-em-yellow-100 text-em-yellow-400",
  prompt: "bg-teal-100 text-teal-900",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.direction === "inbound";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
    >
      {/* Micro label */}
      {isUser ? (
        <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/30 mb-1.5 block text-right mr-2">
          Your Reply
        </span>
      ) : (
        <span
          className={`inline-block text-[10px] font-medium uppercase tracking-widest mb-1.5 ml-2 px-2.5 py-0.5 rounded-full ${
            typeBadgeStyles[message.type] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {message.type === "check-in" ? "Check-in" : message.type}
        </span>
      )}

      {/* Bubble */}
      {isUser ? (
        <div className="bg-navy p-5 rounded-2xl rounded-tr-sm text-cream font-serif font-light text-[15px] leading-relaxed">
          {message.body}
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100/50 text-[15px] text-teal-900 leading-relaxed font-serif">
          {message.body}
        </div>
      )}

      {/* Timestamp */}
      <span
        className={`text-[10px] text-teal-900/30 mt-1.5 block font-sans ${
          isUser ? "text-right mr-2" : "ml-2"
        }`}
      >
        {formatTime(message.createdAt)}
      </span>
    </motion.div>
  );
}
