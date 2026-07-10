"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Plan buttons on the tokenized upgrade interstitial (/u/[token]).
 * Copy mirrors the settings upgrade card; prices intentionally live only in
 * Stripe Checkout so they can never drift from the source of truth.
 */
export function UpgradePlanPicker({ token }: { token: string }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);
    try {
      const response = await fetch("/api/upgrade-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, plan }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(null);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => choose("monthly")}
          disabled={loading !== null}
          className="rounded-xl border border-navy/20 bg-white/60 p-5 text-left transition-colors hover:bg-white/80 disabled:opacity-50"
        >
          <div className="font-serif text-lg text-navy">
            {loading === "monthly" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Monthly"
            )}
          </div>
          <div className="mt-1 text-sm text-teal-900/60">
            Billed monthly, cancel anytime
          </div>
        </button>
        <button
          onClick={() => choose("yearly")}
          disabled={loading !== null}
          className="rounded-xl border border-navy/20 bg-white/60 p-5 text-left transition-colors hover:bg-white/80 disabled:opacity-50"
        >
          <div className="font-serif text-lg text-navy">
            {loading === "yearly" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Yearly"
            )}
          </div>
          <div className="mt-1 text-sm text-teal-900/60">
            Save with annual billing
          </div>
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
