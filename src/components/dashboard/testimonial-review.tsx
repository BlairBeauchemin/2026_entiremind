"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

export interface TestimonialItem {
  id: string;
  userName: string | null;
  userEmail: string;
  body: string | null;
  status: "requested" | "received" | "approved" | "dismissed";
  consent: boolean;
  requestedAt: string;
  receivedAt: string | null;
}

interface TestimonialReviewProps {
  items: TestimonialItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<TestimonialItem["status"], string> = {
  requested: "bg-yellow-100 text-yellow-700",
  received: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
};

export function TestimonialReview({
  items: initialItems,
}: TestimonialReviewProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState<Record<string, boolean>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "dismiss") {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch("/api/founder/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "approve" ? { id, action, consent: true } : { id, action },
        ),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: action === "approve" ? "approved" : "dismissed",
                consent: action === "approve",
              }
            : i,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  const visible = items.filter((i) => i.status !== "dismissed");

  if (visible.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No testimonials yet. Use &ldquo;Ask&rdquo; in the engagement table below
        to request one from a highly engaged user.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      {visible.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-navy">
                {item.userName ?? item.userEmail}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-teal-900/40">
                Asked {formatDate(item.requestedAt)}
                {item.receivedAt
                  ? ` · replied ${formatDate(item.receivedAt)}`
                  : ""}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status]}`}
            >
              {item.status}
            </span>
          </div>

          {item.body ? (
            <blockquote className="font-serif text-navy text-lg italic border-l-2 border-em-purple-300 pl-4">
              &ldquo;{item.body}&rdquo;
            </blockquote>
          ) : (
            <div className="text-sm text-teal-900/50 italic">
              Waiting for a reply…
            </div>
          )}

          {item.status === "received" && (
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2 text-sm text-teal-900/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked[item.id] ?? false}
                  onChange={(e) =>
                    setConsentChecked((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  The reply clearly gives permission to share these words
                  (first name only).
                </span>
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleAction(item.id, "approve")}
                  disabled={
                    pendingId === item.id || !(consentChecked[item.id] ?? false)
                  }
                  className="bg-navy hover:bg-navy/90 text-white rounded-xl"
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
                  className="border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
                >
                  <X className="w-4 h-4 mr-1" /> Dismiss
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
