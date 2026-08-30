"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

interface ContentCreateDialogProps {
  brandId: string;
}

const fieldClass =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cobalt";

const FORMATS_BY_TARGET: Record<string, string[]> = {
  ad: ["image_ad", "video_ad", "carousel_ad"],
  organic: ["post", "reel", "story", "short"],
};

/**
 * Fully manual piece creation: write everything by hand (goes straight to
 * review / filming), or leave the creative fields blank and let the AI fill
 * them (starts as a draft the generation cron picks up).
 */
export function ContentCreateDialog({ brandId }: ContentCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<"ad" | "organic">("organic");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("post");
  const [productionMode, setProductionMode] = useState<
    "ai_generated" | "founder_filmed"
  >("ai_generated");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [script, setScript] = useState("");
  const [angle, setAngle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTargetChange(next: "ad" | "organic") {
    setTarget(next);
    if (next === "ad") {
      setPlatform("meta_ads");
      setFormat("image_ad");
    } else {
      setPlatform("instagram");
      setFormat("post");
    }
  }

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/founder/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          target,
          platform,
          format,
          production_mode: productionMode,
          mode,
          headline: headline || null,
          caption: caption || null,
          script: script || null,
          angle: angle || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="border-rule text-ink rounded-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New piece
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-ink">
            New content piece
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm p-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-muted">
              Target
              <select
                value={target}
                onChange={(e) =>
                  onTargetChange(e.target.value as "ad" | "organic")
                }
                className={fieldClass}
              >
                <option value="organic">Organic post</option>
                <option value="ad">Paid ad (Meta)</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Platform
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={fieldClass}
                disabled={target === "ad"}
              >
                {target === "ad" ? (
                  <option value="meta_ads">Meta Ads</option>
                ) : (
                  <>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </>
                )}
              </select>
            </label>
            <label className="block text-sm text-muted">
              Format
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={fieldClass}
              >
                {FORMATS_BY_TARGET[target].map((f) => (
                  <option key={f} value={f}>
                    {f.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-muted">
              Production
              <select
                value={productionMode}
                onChange={(e) =>
                  setProductionMode(
                    e.target.value as "ai_generated" | "founder_filmed",
                  )
                }
                className={fieldClass}
              >
                <option value="ai_generated">AI generated</option>
                <option value="founder_filmed">I&apos;ll film it</option>
              </select>
            </label>
          </div>

          <label className="block text-sm text-muted">
            How should it be written?
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "ai" | "manual")}
              className={fieldClass}
            >
              <option value="ai">AI writes it (queued for generation)</option>
              <option value="manual">I&apos;ll write it myself</option>
            </select>
          </label>

          <label className="block text-sm text-muted">
            Angle / idea
            <input
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="What should this piece test or say?"
              className={fieldClass}
            />
          </label>

          {mode === "manual" && (
            <>
              <label className="block text-sm text-muted">
                Headline / hook
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-muted">
                Caption
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-muted">
                Script (for video)
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={4}
                  className={fieldClass}
                />
              </label>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={create}
              disabled={saving}
              className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
