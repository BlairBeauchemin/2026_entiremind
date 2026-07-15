"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Pencil } from "lucide-react";
import type { ContentPieceView } from "./types";
import { formatBudget, formatDateTime, latestReadyImage } from "./types";
import { ContentEditDialog } from "./content-edit-dialog";

interface ContentReviewQueueProps {
  pieces: ContentPieceView[];
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "purple" | "yellow" | "gray" }) {
  const tones = {
    purple: "bg-em-purple-300/30 text-navy",
    yellow: "bg-em-yellow-200/60 text-navy",
    gray: "bg-teal-900/10 text-teal-900/70",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wider ${tones[tone ?? "gray"]}`}>
      {children}
    </span>
  );
}

/**
 * Pending-review cards: ads and organic posts wait here for approve /
 * reject / edit. Nothing publishes or spends money without this step
 * (organic auto-publish channels skip the queue entirely by design).
 */
export function ContentReviewQueue({ pieces: initialPieces }: ContentReviewQueueProps) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentPieceView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(id: string, action: "approve" | "reject") {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/founder/marketing/content/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          // Approve schedules for immediate pickup by the publish cron
          ...(action === "approve" ? { scheduledFor: new Date().toISOString() } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setPieces((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  if (pieces.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nothing waiting for review. Generated content lands here before it can publish.
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
      {pieces.map((piece) => {
        const image = latestReadyImage(piece);
        return (
          <motion.div
            key={piece.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={piece.target === "ad" ? "yellow" : "purple"}>
                {piece.target === "ad" ? "Paid ad" : "Organic"}
              </Badge>
              <Badge>{piece.platform}</Badge>
              <Badge>{piece.format}</Badge>
              {piece.productionMode === "founder_filmed" && <Badge tone="purple">Founder filmed</Badge>}
              {piece.videoStyle && <Badge>{piece.videoStyle.replace(/_/g, " ")}</Badge>}
              {piece.experimentName && (
                <Badge tone="yellow">
                  {piece.experimentName}
                  {piece.variantLabel ? ` · ${piece.variantLabel}` : ""}
                </Badge>
              )}
              {piece.target === "ad" && <Badge tone="gray">{formatBudget(piece.dailyBudgetCents)}</Badge>}
              <span className="ml-auto text-[11px] uppercase tracking-widest text-teal-900/40">
                {formatDateTime(piece.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.publicUrl!}
                  alt={piece.headline ?? "Generated creative"}
                  className="w-full rounded-xl border border-em-purple-300/40 object-cover"
                />
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-em-purple-300/60 text-xs text-teal-900/50 p-4 text-center">
                  {piece.media.some((m) => m.kind === "video")
                    ? "Video pending — Veo not wired yet"
                    : "No media yet"}
                </div>
              )}

              <div className="space-y-2 text-sm">
                {piece.headline && <div className="font-medium text-navy">{piece.headline}</div>}
                {piece.bodyCopy && <p className="text-teal-900/80">{piece.bodyCopy}</p>}
                {piece.caption && (
                  <p className="text-teal-900/70 whitespace-pre-line">{piece.caption}</p>
                )}
                {piece.script && (
                  <details className="text-teal-900/70">
                    <summary className="cursor-pointer text-em-purple-400">Script</summary>
                    <p className="whitespace-pre-line mt-1">{piece.script}</p>
                  </details>
                )}
                {piece.hashtags.length > 0 && (
                  <div className="text-em-purple-400 text-xs">
                    {piece.hashtags.map((h) => `#${h}`).join(" ")}
                  </div>
                )}
                {piece.angle && (
                  <div className="text-xs text-teal-900/50 italic">Testing: {piece.angle}</div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={() => review(piece.id, "approve")}
                disabled={pendingId === piece.id}
                className="bg-navy hover:bg-navy/90 text-white rounded-xl"
              >
                {pendingId === piece.id ? (
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
                onClick={() => setEditing(piece)}
                disabled={pendingId === piece.id}
                className="border-em-purple-300/60 text-navy rounded-xl"
              >
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => review(piece.id, "reject")}
                disabled={pendingId === piece.id}
                className="border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
              >
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          </motion.div>
        );
      })}

      {editing && (
        <ContentEditDialog
          piece={editing}
          open={true}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
