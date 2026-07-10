"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import type { ContentPieceView } from "./types";
import { formatDateTime } from "./types";

interface FilmingQueueProps {
  pieces: ContentPieceView[];
}

/**
 * "Awaiting your footage": founder-filmed pieces whose script is ready.
 * Upload goes directly to Supabase Storage via a signed URL (videos exceed
 * Vercel's request body limit), then the piece moves to the review queue.
 */
export function FilmingQueue({ pieces: initialPieces }: FilmingQueueProps) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(pieceId: string, file: File) {
    setUploadingId(pieceId);
    setError(null);
    try {
      // 1. init: get a signed upload URL + pending asset row
      const initRes = await fetch(`/api/founder/marketing/content/${pieceId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "init", mimeType: file.type }),
      });
      const init = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        setError(init.error || `Upload init failed (${initRes.status})`);
        return;
      }

      // 2. PUT the file straight to storage
      const putRes = await fetch(init.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          Authorization: `Bearer ${init.token}`,
          "x-upsert": "false",
        },
        body: file,
      });
      if (!putRes.ok) {
        setError(`Storage upload failed (${putRes.status})`);
        return;
      }

      // 3. complete: mark asset ready, move piece to review
      const completeRes = await fetch(`/api/founder/marketing/content/${pieceId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete", assetId: init.assetId }),
      });
      if (!completeRes.ok) {
        const body = await completeRes.json().catch(() => ({}));
        setError(body.error || `Upload completion failed (${completeRes.status})`);
        return;
      }

      setPieces((prev) => prev.filter((p) => p.id !== pieceId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUploadingId(null);
    }
  }

  if (pieces.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No scripts waiting to be filmed. Founder-filmed pieces appear here once their script is ready.
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
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-navy">
                {piece.headline ?? "Untitled"} · {piece.platform} {piece.format}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-teal-900/40">
                {formatDateTime(piece.createdAt)}
                {piece.angle ? ` · ${piece.angle}` : ""}
              </div>
            </div>
          </div>

          {piece.script && (
            <div className="rounded-xl bg-em-purple-300/10 border border-em-purple-300/30 p-4 text-sm text-teal-900/80 whitespace-pre-line">
              {piece.script}
            </div>
          )}

          <div>
            <input
              ref={(el) => {
                fileInputs.current[piece.id] = el;
              }}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(piece.id, file);
              }}
            />
            <Button
              type="button"
              onClick={() => fileInputs.current[piece.id]?.click()}
              disabled={uploadingId === piece.id}
              className="bg-navy hover:bg-navy/90 text-white rounded-xl"
            >
              {uploadingId === piece.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              Upload footage
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
