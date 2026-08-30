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
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cobalt";

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
    <section className="bg-surface border border-rule rounded-sm p-6 space-y-5">
      <div>
        <h2 className="font-serif text-xl text-ink">System prompt</h2>
        <p className="text-sm text-muted mt-1">
          The instructions that shape every daily message. Save versions here,
          pin them to runs to compare, and activate one to change production.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-sm p-2">
          {error}
        </div>
      )}

      {/* Version list */}
      <div className="space-y-2">
        <div
          className={`rounded-sm border p-4 ${
            !anyActive ? "border-rule bg-cobalt-wash" : "border-rule bg-surface"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-ink flex items-center gap-2">
                Built-in default
                {!anyActive && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cobalt text-linen">
                    <CheckCircle2 className="w-3 h-3" /> live in production
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted">
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
              className="border-rule text-muted rounded-sm shrink-0"
            >
              Edit as new version
            </Button>
          </div>
        </div>

        {prompts.map((p) => (
          <div
            key={p.id}
            className={`rounded-sm border p-4 ${
              p.is_active
                ? "border-rule bg-cobalt-wash"
                : "border-rule bg-surface"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink flex items-center gap-2">
                  {p.name}
                  {p.is_active && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cobalt text-linen">
                      <CheckCircle2 className="w-3 h-3" /> live in production
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted">
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
                  className="border-rule text-muted rounded-sm"
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
                    className="border-rule text-muted rounded-sm"
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
                    className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-[11px] text-muted cursor-pointer">
                view prompt text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-ink bg-surface rounded-sm p-3 max-h-56 overflow-y-auto">
                {p.body}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* New version editor */}
      <div className="space-y-3 pt-2 border-t border-rule">
        <div className="text-[11px] uppercase tracking-widest text-muted">
          Draft a new version
        </div>
        <input
          className={inputClass}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Version name (e.g. warmer tone, fewer questions)"
        />
        <textarea
          className={`${inputClass} min-h-[180px] font-mono text-xs`}
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
          className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
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
        <DialogContent className="bg-linen">
          <DialogHeader>
            <DialogTitle className="font-serif text-ink">
              Activate “{confirmActivate?.name}”?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            This changes production: every real daily send starts using this
            prompt on the next cron run. Simulator runs pinned to other versions
            are unaffected.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmActivate(null)}
              className="border-rule text-muted rounded-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busyId !== null}
              onClick={() =>
                confirmActivate && patch(confirmActivate.id, "activate")
              }
              className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
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
