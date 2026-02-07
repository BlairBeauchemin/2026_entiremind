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
          onClick={() => setIsPaused(!isPaused)}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
            isPaused ? "bg-em-yellow" : "bg-teal-900/20"
          }`}
          aria-pressed={isPaused}
          aria-label="Pause messages"
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
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
