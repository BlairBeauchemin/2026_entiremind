"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import type { ContentPieceView } from "./types";
import { latestReadyImage } from "./types";
import { VIDEO_STYLES, VIDEO_STYLE_GUIDANCE } from "@/lib/marketing/video-styles";

const VIDEO_FORMATS = ["video_ad", "reel", "short"];

interface ContentEditDialogProps {
  piece: ContentPieceView;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const fieldClass =
  "w-full rounded-xl border border-em-purple-300/40 bg-white/80 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-em-purple-400";

/**
 * Every creative field is editable here so agentic output is always
 * manually tweakable before approval. "Regenerate image" re-runs only the
 * image step from the (possibly edited) image prompt.
 */
export function ContentEditDialog({ piece, open, onClose, onSaved }: ContentEditDialogProps) {
  const [headline, setHeadline] = useState(piece.headline ?? "");
  const [bodyCopy, setBodyCopy] = useState(piece.bodyCopy ?? "");
  const [caption, setCaption] = useState(piece.caption ?? "");
  const [script, setScript] = useState(piece.script ?? "");
  const [imagePrompt, setImagePrompt] = useState(piece.imagePrompt ?? "");
  const [hashtags, setHashtags] = useState(piece.hashtags.join(", "));
  const [cta, setCta] = useState(piece.cta ?? "");
  const [linkUrl, setLinkUrl] = useState(piece.linkUrl ?? "");
  const [budget, setBudget] = useState(
    piece.dailyBudgetCents != null ? String(piece.dailyBudgetCents / 100) : "",
  );
  const [videoStyle, setVideoStyle] = useState(piece.videoStyle ?? "");
  const [imageUrl, setImageUrl] = useState(latestReadyImage(piece)?.publicUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/founder/marketing/content/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline || null,
          body_copy: bodyCopy || null,
          caption: caption || null,
          script: script || null,
          image_prompt: imagePrompt || null,
          cta: cta || null,
          link_url: linkUrl || null,
          hashtags: hashtags
            .split(",")
            .map((h) => h.trim().replace(/^#/, ""))
            .filter(Boolean),
          daily_budget_cents: budget ? Math.round(parseFloat(budget) * 100) : null,
          ...(VIDEO_FORMATS.includes(piece.format)
            ? { video_style: videoStyle || null }
            : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Save failed (${res.status})`);
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateImage() {
    setRegenerating(true);
    setError(null);
    try {
      // Persist the edited prompt first so regeneration uses it
      await fetch(`/api/founder/marketing/content/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_prompt: imagePrompt || null }),
      });
      const res = await fetch(`/api/founder/marketing/content/${piece.id}/regenerate`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Regenerate failed (${res.status})`);
        return;
      }
      if (body.publicUrl) setImageUrl(body.publicUrl);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-navy">Edit content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Current creative"
              className="w-full max-h-64 object-contain rounded-xl border border-em-purple-300/40"
            />
          )}

          <label className="block text-sm text-teal-900/60">
            Headline / hook
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={fieldClass} />
          </label>

          {piece.target === "ad" && (
            <label className="block text-sm text-teal-900/60">
              Primary text (body copy)
              <textarea
                value={bodyCopy}
                onChange={(e) => setBodyCopy(e.target.value)}
                rows={3}
                className={fieldClass}
              />
            </label>
          )}

          <label className="block text-sm text-teal-900/60">
            Caption
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className={fieldClass} />
          </label>

          {(piece.script || piece.productionMode === "founder_filmed") && (
            <label className="block text-sm text-teal-900/60">
              Script
              <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={6} className={fieldClass} />
            </label>
          )}

          <label className="block text-sm text-teal-900/60">
            Hashtags (comma-separated)
            <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className={fieldClass} />
          </label>

          {VIDEO_FORMATS.includes(piece.format) && (
            <label className="block text-sm text-teal-900/60">
              Video style
              <select
                value={videoStyle}
                onChange={(e) => setVideoStyle(e.target.value)}
                className={fieldClass}
              >
                <option value="">(none)</option>
                {VIDEO_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {VIDEO_STYLE_GUIDANCE[s].label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="space-y-1">
            <label className="block text-sm text-teal-900/60">
              Image prompt
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className={fieldClass}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={regenerateImage}
              disabled={regenerating || !imagePrompt}
              className="border-em-purple-300/60 text-navy rounded-xl"
            >
              {regenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              Regenerate image
            </Button>
          </div>

          {piece.target === "ad" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-teal-900/60">
                CTA
                <input value={cta} onChange={(e) => setCta(e.target.value)} className={fieldClass} />
              </label>
              <label className="block text-sm text-teal-900/60">
                Daily budget ($)
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  type="number"
                  min="1"
                  step="0.01"
                  className={fieldClass}
                />
              </label>
            </div>
          )}

          <label className="block text-sm text-teal-900/60">
            Link URL
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={fieldClass} />
          </label>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-navy hover:bg-navy/90 text-white rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
