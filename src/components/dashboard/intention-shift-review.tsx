"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

export interface IntentionShiftItem {
  id: string;
  userName: string | null;
  userEmail: string;
  currentIntention: string;
  proposedIntention: string;
  confidence: number | null;
  rationale: string | null;
  createdAt: string;
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

export function IntentionShiftReview({
  items: initialItems,
}: IntentionShiftReviewProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "dismiss") {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch("/api/founder/intention-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
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
        No pending intention shifts. The weekly memory pass will surface any
        here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted mb-1">
                Current
              </div>
              <div className="font-serif text-ink">{item.currentIntention}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cobalt mb-1">
                Proposed
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
              onClick={() => handleAction(item.id, "approve")}
              disabled={pendingId === item.id}
              className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
            >
              {pendingId === item.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" /> Approve
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAction(item.id, "dismiss")}
              disabled={pendingId === item.id}
              className="border-rule text-muted hover:bg-surface rounded-sm"
            >
              <X className="w-4 h-4 mr-1" /> Dismiss
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
