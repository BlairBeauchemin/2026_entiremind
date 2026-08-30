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
        className="bg-surface rounded-sm border border-rule p-8 md:p-10"
      >
        {/* Micro label */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-cobalt-wash animate-pulse-slow" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Current Intention
          </span>
        </div>

        {/* Intention text */}
        <p className="font-serif text-2xl md:text-3xl italic text-ink leading-snug">
          &ldquo;{intention.text}&rdquo;
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-muted font-sans">
            {relativeTime(intention.createdAt)}
          </span>
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-cobalt transition-colors"
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
