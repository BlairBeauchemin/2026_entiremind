"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PromptVersion } from "./types";

const inputClass =
  "w-full rounded-xl border border-teal-900/15 bg-white/60 px-3 py-2 text-sm text-navy placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-em-purple-300";

/**
 * System prompt version manager: list versions, draft new ones (prefilled
 * from any existing version or the built-in default), and activate a version
 * for production behind an explicit confirmation.
 */
export function PromptManager({
  prompts,
  builtInPromptBody,
  onChanged,
}: {
  prompts: PromptVersion[];
  builtInPromptBody: string;
  onChanged: () => void;
}) {
  const [draftName, setDraftName] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState<PromptVersion | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anyActive = prompts.some((p) => p.is_active);

  async function createVersion() {
    if (!draftName.trim() || !draftBody.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/founder/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          body: draftBody.trim(),
          notes: draftNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setDraftName("");
      setDraftBody("");
      setDraftNotes("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, action: "activate" | "deactivate") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/founder/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusyId(null);
      setConfirmActivate(null);
    }
  }

  return (
    <section className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 space-y-5">
      <div>
        <h2 className="font-serif text-xl text-navy">System prompt</h2>
        <p className="text-sm text-teal-900/60 mt-1">
          The instructions that shape every daily message. Save versions here,
          pin them to runs to compare, and activate one to change production.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Version list */}
      <div className="space-y-2">
        <div
          className={`rounded-2xl border p-4 ${
            !anyActive
              ? "border-em-purple-300 bg-em-purple-300/10"
              : "border-teal-900/10 bg-white/40"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-navy flex items-center gap-2">
                Built-in default
                {!anyActive && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-navy text-white">
                    <CheckCircle2 className="w-3 h-3" /> live in production
                  </span>
                )}
              </div>
              <div className="text-[11px] text-teal-900/50">
                The hardcoded prompt shipped with the app. Used whenever no
                version is activated.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDraftName("Copy of built-in default");
                setDraftBody(builtInPromptBody);
              }}
              className="border-teal-900/20 text-teal-900/60 rounded-xl shrink-0"
            >
              Edit as new version
            </Button>
          </div>
        </div>

        {prompts.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-4 ${
              p.is_active
                ? "border-em-purple-300 bg-em-purple-300/10"
                : "border-teal-900/10 bg-white/40"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy flex items-center gap-2">
                  {p.name}
                  {p.is_active && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-navy text-white">
                      <CheckCircle2 className="w-3 h-3" /> live in production
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-teal-900/50">
                  {new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {p.notes ? ` · ${p.notes}` : ""}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraftName(`${p.name} (revised)`);
                    setDraftBody(p.body);
                    setDraftNotes(p.notes ?? "");
                  }}
                  className="border-teal-900/20 text-teal-900/60 rounded-xl"
                >
                  Edit as new
                </Button>
                {p.is_active ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => patch(p.id, "deactivate")}
                    className="border-teal-900/20 text-teal-900/60 rounded-xl"
                  >
                    {busyId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Deactivate"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => setConfirmActivate(p)}
                    className="bg-navy hover:bg-navy/90 text-white rounded-xl"
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-[11px] text-teal-900/50 cursor-pointer">
                view prompt text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-56 overflow-y-auto">
                {p.body}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* New version editor */}
      <div className="space-y-3 pt-2 border-t border-teal-900/10">
        <div className="text-[11px] uppercase tracking-widest text-teal-900/50">
          Draft a new version
        </div>
        <input
          className={inputClass}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Version name (e.g. warmer tone, fewer questions)"
        />
        <textarea
          className={`${inputClass} min-h-[180px] font-mono text-[12px]`}
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          placeholder="Full system prompt text…"
        />
        <input
          className={inputClass}
          value={draftNotes}
          onChange={(e) => setDraftNotes(e.target.value)}
          placeholder="Notes (optional — what you're testing)"
        />
        <Button
          type="button"
          onClick={createVersion}
          disabled={saving || !draftName.trim() || !draftBody.trim()}
          className="bg-navy hover:bg-navy/90 text-white rounded-xl"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save as new version"
          )}
        </Button>
      </div>

      {/* Activate confirmation */}
      <Dialog
        open={confirmActivate !== null}
        onOpenChange={(open) => !open && setConfirmActivate(null)}
      >
        <DialogContent className="bg-cream">
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              Activate “{confirmActivate?.name}”?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-teal-900/70">
            This changes production: every real daily send starts using this
            prompt on the next cron run. Simulator runs pinned to other
            versions are unaffected.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmActivate(null)}
              className="border-teal-900/20 text-teal-900/60 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busyId !== null}
              onClick={() =>
                confirmActivate && patch(confirmActivate.id, "activate")
              }
              className="bg-navy hover:bg-navy/90 text-white rounded-xl"
            >
              {busyId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Activate for production"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
