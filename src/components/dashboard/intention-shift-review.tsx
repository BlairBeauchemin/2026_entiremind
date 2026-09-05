"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2, Send } from "lucide-react";

export interface IntentionShiftItem {
  id: string;
  userName: string | null;
  userEmail: string;
  currentIntention: string;
  proposedIntention: string;
  confidence: number | null;
  rationale: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

interface IntentionShiftReviewProps {
  items: IntentionShiftItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * A read-only log of intention drift the weekly memory pass noticed, and
 * whether the user was told.
 *
 * This is not a queue and there is nothing here to approve. The user's
 * intention is theirs — the system says "your focus looks like it moved" once
 * and points them at the app; it never rewrites it, and neither does the
 * founder. Dismiss only tidies this list.
 */
export function IntentionShiftReview({
  items: initialItems,
}: IntentionShiftReviewProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDismiss(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch("/api/founder/intention-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "dismiss" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No intention drift noticed yet. The weekly memory pass logs any here and
        texts the user directly.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        What the weekly pass noticed, and whether the user was told. Nothing
        here needs your approval — the user changes their own intention in the
        app, or leaves it as it is.
      </p>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-sm p-2">
          {error}
        </div>
      )}
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-surface border border-rule rounded-sm p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-ink">
                {item.userName ?? item.userEmail}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-muted">
                {formatDate(item.createdAt)}
                {item.confidence !== null
                  ? ` · confidence ${Math.round(item.confidence * 100)}%`
                  : ""}
              </div>
            </div>
            {item.notifiedAt && (
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-cobalt shrink-0">
                <Send className="w-3 h-3" aria-hidden="true" />
                Nudged {formatDate(item.notifiedAt)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted mb-1">
                Their intention
              </div>
              <div className="font-serif text-ink">{item.currentIntention}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cobalt mb-1">
                What they keep talking about
              </div>
              <div className="font-serif text-ink">
                {item.proposedIntention}
              </div>
            </div>
          </div>

          {item.rationale && (
            <div className="text-sm text-muted italic">{item.rationale}</div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDismiss(item.id)}
              disabled={pendingId === item.id}
              className="border-rule text-muted hover:bg-surface rounded-sm"
            >
              {pendingId === item.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" /> Dismiss from log
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
