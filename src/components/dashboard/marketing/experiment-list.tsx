"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Rocket, X } from "lucide-react";

export interface ExperimentVariantView {
  pieceId: string;
  variantLabel: string | null;
  status: string;
  summary: string;
  videoStyle: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  engagements: number;
}

export interface ExperimentView {
  id: string;
  name: string;
  hypothesis: string;
  variable: string;
  status: string;
  minImpressions: number;
  winnerPieceId: string | null;
  conclusion: string | null;
  acknowledged: boolean;
  hasPlaceholderData: boolean;
  createdAt: string;
  variants: ExperimentVariantView[];
}

interface ExperimentListProps {
  experiments: ExperimentView[];
  /** Hide action buttons (analytics page reuse). */
  readOnly?: boolean;
}

function rate(view: ExperimentVariantView): string {
  if (view.impressions === 0) return "—";
  const clicks = view.clicks > 0 ? view.clicks : view.engagements;
  return `${((clicks / view.impressions) * 100).toFixed(2)}%`;
}

export function ExperimentList({ experiments, readOnly = false }: ExperimentListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "ack" | "follow-up" | "cancel") {
    setPendingId(id);
    setError(null);
    try {
      const res =
        action === "cancel"
          ? await fetch(`/api/founder/marketing/experiments/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled" }),
            })
          : await fetch(`/api/founder/marketing/experiments/${id}/${action}`, {
              method: "POST",
            });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  if (experiments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No experiments yet. Weekly planning structures content as controlled tests — winners show
        up here.
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
      {experiments.map((experiment) => {
        const isUnackedConclusion = experiment.status === "concluded" && !experiment.acknowledged;
        return (
          <div
            key={experiment.id}
            className={`rounded-2xl p-5 space-y-3 border ${
              isUnackedConclusion
                ? "bg-amber-50/70 border-amber-300"
                : "bg-white/60 border-em-purple-300/40"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-navy">{experiment.name}</span>
              <span className="rounded-full bg-em-purple-300/30 text-navy px-2 py-0.5 text-[11px] uppercase tracking-wider">
                tests {experiment.variable.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-teal-900/10 text-teal-900/70 px-2 py-0.5 text-[11px] uppercase tracking-wider">
                {experiment.status}
              </span>
              {experiment.hasPlaceholderData && (
                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] uppercase tracking-wider">
                  placeholder data
                </span>
              )}
              <span className="ml-auto text-[11px] uppercase tracking-widest text-teal-900/40">
                {new Date(experiment.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <p className="text-sm text-teal-900/70 italic">{experiment.hypothesis}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-teal-900/40 border-b border-em-purple-300/30">
                    <th className="py-1.5 pr-3">Variant</th>
                    <th className="py-1.5 pr-3">What it tests</th>
                    <th className="py-1.5 pr-3">Status</th>
                    <th className="py-1.5 pr-3">Impressions</th>
                    <th className="py-1.5">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.variants.map((variant) => {
                    const isWinner = variant.pieceId === experiment.winnerPieceId;
                    return (
                      <tr
                        key={variant.pieceId}
                        className={`border-b border-em-purple-300/20 ${isWinner ? "bg-em-yellow-200/30" : ""}`}
                      >
                        <td className="py-1.5 pr-3 font-medium text-navy">
                          {variant.variantLabel ?? "—"}
                          {isWinner ? " 🏆" : ""}
                        </td>
                        <td className="py-1.5 pr-3 text-teal-900/70 max-w-[280px] truncate">
                          {variant.summary}
                          {variant.videoStyle ? ` · ${variant.videoStyle.replace(/_/g, " ")}` : ""}
                        </td>
                        <td className="py-1.5 pr-3 text-teal-900/60">{variant.status}</td>
                        <td className="py-1.5 pr-3 text-teal-900/60">
                          {variant.impressions.toLocaleString()}
                          <span className="text-teal-900/40"> / {experiment.minImpressions.toLocaleString()}</span>
                        </td>
                        <td className="py-1.5 text-teal-900/60">{rate(variant)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {experiment.conclusion && (
              <p className="text-sm text-navy">{experiment.conclusion}</p>
            )}

            {!readOnly && (
              <div className="flex gap-2 pt-1">
                {experiment.status === "concluded" && (
                  <>
                    <Button
                      type="button"
                      onClick={() => act(experiment.id, "follow-up")}
                      disabled={pendingId === experiment.id}
                      className="bg-navy hover:bg-navy/90 text-white rounded-xl"
                    >
                      {pendingId === experiment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 mr-1" /> Double down: plan follow-up
                        </>
                      )}
                    </Button>
                    {!experiment.acknowledged && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => act(experiment.id, "ack")}
                        disabled={pendingId === experiment.id}
                        className="border-em-purple-300/60 text-navy rounded-xl"
                      >
                        <Check className="w-4 h-4 mr-1" /> Got it
                      </Button>
                    )}
                  </>
                )}
                {["planned", "running"].includes(experiment.status) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => act(experiment.id, "cancel")}
                    disabled={pendingId === experiment.id}
                    className="border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
