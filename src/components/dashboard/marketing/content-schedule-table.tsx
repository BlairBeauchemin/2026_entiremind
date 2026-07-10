"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import type { ContentPieceView } from "./types";
import { formatDateTime } from "./types";

interface ContentScheduleTableProps {
  pieces: ContentPieceView[];
}

const PUBLISH_NOW_STATUSES = ["approved", "scheduled"];

export function ContentScheduleTable({ pieces }: ContentScheduleTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function publishNow(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/founder/marketing/content/${id}/publish`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Publish failed (${res.status})`);
        return;
      }
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
        No approved, scheduled, or published content yet.
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-teal-900/40 border-b border-em-purple-300/30">
              <th className="py-2 pr-4">Piece</th>
              <th className="py-2 pr-4">Where</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Scheduled</th>
              <th className="py-2 pr-4">Published</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece) => (
              <tr key={piece.id} className="border-b border-em-purple-300/20 align-top">
                <td className="py-2 pr-4 max-w-[280px]">
                  <div className="text-navy font-medium truncate">
                    {piece.headline ?? piece.caption?.slice(0, 60) ?? "Untitled"}
                  </div>
                  {piece.lastError && (
                    <div className="text-xs text-red-600">{piece.lastError}</div>
                  )}
                  {piece.externalPostId && (
                    <div className="text-xs text-teal-900/50 truncate">
                      {piece.externalPostId}
                      {piece.externalPostId.startsWith("stub_") ? " (placeholder)" : ""}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4 text-teal-900/70">
                  {piece.target === "ad" ? "Ad · " : ""}
                  {piece.platform} {piece.format}
                </td>
                <td className="py-2 pr-4 text-teal-900/70">{piece.status}</td>
                <td className="py-2 pr-4 text-teal-900/50">{formatDateTime(piece.scheduledFor)}</td>
                <td className="py-2 pr-4 text-teal-900/50">{formatDateTime(piece.publishedAt)}</td>
                <td className="py-2">
                  {PUBLISH_NOW_STATUSES.includes(piece.status) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => publishNow(piece.id)}
                      disabled={pendingId === piece.id}
                      className="border-em-purple-300/60 text-navy rounded-xl"
                    >
                      {pendingId === piece.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" /> Publish now
                        </>
                      )}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
