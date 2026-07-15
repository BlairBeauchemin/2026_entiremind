"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";

interface NicheEditorProps {
  brandId: string;
  niches: string[];
}

/**
 * Chip editor for the niches a brand follows. Trend research reports
 * per-niche, so this list directly steers what the engine looks for.
 */
export function NicheEditor({ brandId, niches: initialNiches }: NicheEditorProps) {
  const router = useRouter();
  const [niches, setNiches] = useState(initialNiches);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/founder/marketing/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niches: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Save failed (${res.status})`);
        return;
      }
      setNiches(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  function add() {
    const value = input.trim();
    if (!value) return;
    if (niches.some((n) => n.toLowerCase() === value.toLowerCase())) {
      setInput("");
      return;
    }
    setInput("");
    save([...niches, value]);
  }

  function remove(niche: string) {
    save(niches.filter((n) => n !== niche));
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {niches.length === 0 && (
          <span className="text-sm text-muted-foreground italic">
            No niches yet — add the topics this brand should track.
          </span>
        )}
        {niches.map((niche) => (
          <span
            key={niche}
            className="inline-flex items-center gap-1 rounded-full bg-em-purple-300/30 text-navy px-3 py-1 text-sm"
          >
            {niche}
            <button
              type="button"
              onClick={() => remove(niche)}
              disabled={saving}
              aria-label={`Remove ${niche}`}
              className="text-navy/50 hover:text-navy"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 max-w-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. morning routines"
          className="flex-1 rounded-xl border border-em-purple-300/40 bg-white/80 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-em-purple-400"
        />
        <Button
          type="button"
          onClick={add}
          disabled={saving || !input.trim()}
          variant="outline"
          className="border-em-purple-300/60 text-navy rounded-xl"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
