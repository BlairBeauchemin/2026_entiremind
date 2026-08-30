"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function SettingsMessaging() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="bg-surface rounded-sm border border-rule p-8 md:p-10"
    >
      <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted mb-6">
        Messaging Controls
      </h2>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-serif text-ink mb-1">Pause Messages</p>
          <p className="text-sm text-muted">
            Temporarily stop receiving SMS prompts and check-ins
          </p>
        </div>

        {/* Custom toggle switch */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
            isPaused ? "bg-cobalt" : "bg-rule"
          }`}
          aria-pressed={isPaused}
          aria-label="Pause messages"
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-surface transition-transform duration-200 ${
              isPaused ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Paused notice */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-5 p-4 rounded-sm bg-cobalt-wash border border-rule"
        >
          <p className="text-sm text-muted">
            Messages are paused. You can resume anytime.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
