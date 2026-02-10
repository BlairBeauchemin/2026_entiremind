"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import type { Intention } from "@/lib/types";
import { EditIntentionDialog } from "./edit-intention-dialog";

function relativeTime(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Set today";
  if (days === 1) return "Set yesterday";
  return `Set ${days} days ago`;
}

interface CurrentIntentionProps {
  intention: Intention;
}

export function CurrentIntention({ intention }: CurrentIntentionProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      {/* Micro label */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-em-purple-300 animate-pulse-slow" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
          Current Intention
        </span>
      </div>

      {/* Intention text */}
      <p className="font-serif text-2xl md:text-3xl italic text-navy leading-snug">
        &ldquo;{intention.text}&rdquo;
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <span className="text-[12px] text-teal-900/40 font-sans">
          {relativeTime(intention.createdAt)}
        </span>
        <button
          onClick={() => setIsEditOpen(true)}
          className="flex items-center gap-1.5 text-[12px] text-teal-900/50 hover:text-teal-900 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
    </motion.div>

    <EditIntentionDialog
      intention={intention}
      open={isEditOpen}
      onOpenChange={setIsEditOpen}
    />
    </>
  );
}
