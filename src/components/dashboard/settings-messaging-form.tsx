"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { updateMessagingStatus } from "@/lib/auth/actions";

interface SettingsMessagingFormProps {
  status: "active" | "paused" | "cancelled";
}

export function SettingsMessagingForm({ status }: SettingsMessagingFormProps) {
  const [isPaused, setIsPaused] = useState(status === "paused");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const newStatus = isPaused ? "active" : "paused";
    setIsPaused(!isPaused);
    setError(null);

    startTransition(async () => {
      const result = await updateMessagingStatus(newStatus);
      if (result.error) {
        setError(result.error);
        setIsPaused(isPaused); // Revert on error
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      <h2 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-6">
        Messaging Controls
      </h2>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-serif text-navy mb-1">Pause Messages</p>
          <p className="text-sm text-teal-900/50">
            Temporarily stop receiving SMS prompts and check-ins
          </p>
        </div>

        {/* Custom toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
            isPaused ? "bg-em-yellow" : "bg-teal-900/20"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={isPaused}
          aria-label="Pause messages"
        >
          {isPending ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-teal-900/40" />
            </span>
          ) : (
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPaused ? "translate-x-6" : "translate-x-1"
              }`}
            />
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Paused notice */}
      {isPaused && !error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-5 p-4 rounded-xl bg-em-yellow/20 border border-em-yellow/40"
        >
          <p className="text-sm text-teal-900/70">
            Messages are paused. You can resume anytime.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
