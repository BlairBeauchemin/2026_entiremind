"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Play, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaForm } from "./persona-form";
import { PromptManager } from "./prompt-manager";
import { ConversationTimeline } from "./conversation-timeline";
import type {
  PersonaSummary,
  PromptVersion,
  RunDetail,
  SimRunSummary,
} from "./types";

async function jsonFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: body as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

function liveRun(runs: SimRunSummary[]): SimRunSummary | null {
  return runs.find((r) => r.status !== "archived") ?? runs[0] ?? null;
}

/**
 * Founder messaging simulator orchestrator: persona list, run controls,
 * pending-day review, conversation timeline, and the prompt manager.
 */
export function SimulatorClient({
  initialPersonas,
  initialPrompts,
  builtInPromptBody,
}: {
  initialPersonas: PersonaSummary[];
  initialPrompts: PromptVersion[];
  builtInPromptBody: string;
}) {
  const [personas, setPersonas] = useState<PersonaSummary[]>(initialPersonas);
  const [prompts, setPrompts] = useState<PromptVersion[]>(initialPrompts);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    initialPersonas[0]?.id ?? null,
  );
  // Explicit run choice (e.g. viewing an archived week); falls back to the
  // persona's live run when unset or no longer valid for the persona.
  const [runIdOverride, setRunIdOverride] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Review panel state
  const [reviewText, setReviewText] = useState("");
  const [reviewAction, setReviewAction] = useState<"reply" | "silence">(
    "silence",
  );

  // New-run prompt picker
  const [newRunPromptId, setNewRunPromptId] = useState<string>("");

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedPersonaId) ?? null,
    [personas, selectedPersonaId],
  );

  const refreshPersonas = useCallback(async () => {
    const res = await jsonFetch<{ personas: PersonaSummary[] }>(
      "/api/founder/simulator/personas",
    );
    if (res.ok) {
      setPersonas(res.data.personas);
      return res.data.personas;
    }
    setError(res.error);
    return null;
  }, []);

  const refreshPrompts = useCallback(async () => {
    const res = await jsonFetch<{ prompts: PromptVersion[] }>(
      "/api/founder/prompts",
    );
    if (res.ok) setPrompts(res.data.prompts);
  }, []);

  const loadRun = useCallback(async (runId: string) => {
    const res = await jsonFetch<RunDetail>(
      `/api/founder/simulator/runs/${runId}`,
    );
    if (res.ok) {
      setRunDetail(res.data);
      const pendingDay = res.data.days.find(
        (d) => d.status === "pending_review",
      );
      const proposal = pendingDay?.debug.proposal;
      setReviewAction(proposal?.action ?? "silence");
      setReviewText(proposal?.action === "reply" ? (proposal.text ?? "") : "");
    } else {
      setError(res.error);
    }
  }, []);

  const selectedRunId = useMemo(() => {
    if (!selectedPersona) return null;
    if (
      runIdOverride &&
      selectedPersona.runs.some((r) => r.id === runIdOverride)
    ) {
      return runIdOverride;
    }
    return liveRun(selectedPersona.runs)?.id ?? null;
  }, [selectedPersona, runIdOverride]);

  useEffect(() => {
    // All state updates happen after the fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedRunId) void loadRun(selectedRunId);
  }, [selectedRunId, loadRun]);

  async function act(
    label: string,
    url: string,
    body?: Record<string, unknown>,
  ) {
    setBusy(label);
    setError(null);
    const res = await jsonFetch<Record<string, unknown>>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : "{}",
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    return res.data;
  }

  async function handleStep() {
    if (!selectedRunId) return;
    const data = await act(
      "step",
      `/api/founder/simulator/runs/${selectedRunId}/step`,
    );
    if (data) await loadRun(selectedRunId);
  }

  async function handleCommit() {
    if (!selectedRunId) return;
    const data = await act(
      "commit",
      `/api/founder/simulator/runs/${selectedRunId}/commit-day`,
      {
        action: reviewAction,
        text: reviewAction === "reply" ? reviewText : null,
      },
    );
    if (data) {
      await loadRun(selectedRunId);
      await refreshPersonas();
    }
  }

  async function handleRunWeek() {
    if (!selectedRunId) return;
    const data = await act(
      "week",
      `/api/founder/simulator/runs/${selectedRunId}/run-week`,
    );
    if (data) {
      await loadRun(selectedRunId);
      await refreshPersonas();
    }
  }

  async function handleReset() {
    if (!selectedRunId) return;
    if (!window.confirm("Reset this run? All simulated days will be wiped."))
      return;
    const data = await act(
      "reset",
      `/api/founder/simulator/runs/${selectedRunId}/reset`,
    );
    if (data) {
      await loadRun(selectedRunId);
      await refreshPersonas();
    }
  }

  async function handleNewRun() {
    if (!selectedRunId) return;
    const data = await act(
      "new-run",
      `/api/founder/simulator/runs/${selectedRunId}/new-run`,
      { pinnedPromptId: newRunPromptId || null },
    );
    if (data) {
      await refreshPersonas();
      const newId = (data as { runId?: string }).runId;
      setRunIdOverride(newId ?? null);
    }
  }

  async function handleDeletePersona(userId: string) {
    if (
      !window.confirm(
        "Delete this test persona and all of its simulated data?",
      )
    )
      return;
    setBusy("delete");
    setError(null);
    const res = await jsonFetch<{ success: boolean }>(
      "/api/founder/simulator/personas",
      { method: "DELETE", body: JSON.stringify({ userId }) },
    );
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const refreshed = await refreshPersonas();
    if (refreshed) {
      setSelectedPersonaId(refreshed[0]?.id ?? null);
    }
  }

  // Guard against showing a previously loaded run while a new one fetches.
  const detail =
    runDetail && runDetail.run.id === selectedRunId ? runDetail : null;
  const run = detail?.run ?? null;
  const pendingDay =
    detail?.days.find((d) => d.status === "pending_review") ?? null;
  const promptNameById = (id: string | null) =>
    id
      ? (prompts.find((p) => p.id === id)?.name ?? "unknown version")
      : "active / built-in";

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Persona rail */}
      <section className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-navy">Test personas</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setFormOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" /> New persona
          </Button>
        </div>

        {personas.length === 0 ? (
          <p className="text-sm text-teal-900/50 italic">
            No test personas yet. Create one to start simulating.
          </p>
        ) : (
          <div className="space-y-2">
            {personas.map((p) => {
              const r = liveRun(p.runs);
              const isSelected = p.id === selectedPersonaId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-em-purple-300 bg-em-purple-300/10"
                      : "border-teal-900/10 bg-white/40 hover:border-teal-900/30"
                  }`}
                  onClick={() => {
                    setSelectedPersonaId(p.id);
                    setRunIdOverride(null);
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-navy">
                      {p.name ?? "Unnamed"}
                    </div>
                    <div className="text-[11px] text-teal-900/50">
                      {r
                        ? `Day ${r.current_day}/${r.total_days} · ${r.status.replace("_", " ")} · ${r.reply_style}`
                        : "no run"}
                      {p.runs.filter((x) => x.status === "archived").length > 0
                        ? ` · ${p.runs.filter((x) => x.status === "archived").length} archived`
                        : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeletePersona(p.id);
                    }}
                    disabled={busy !== null}
                    className="p-2 text-teal-900/30 hover:text-red-600 transition-colors"
                    title="Delete persona"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected run */}
      {run && (
        <section className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-navy">
                {selectedPersona?.name ?? "Persona"} — week{" "}
                {run.status === "archived" ? "(archived)" : ""}
              </h2>
              <div className="text-[11px] text-teal-900/50 mt-1">
                Day {run.current_day} of {run.total_days} ·{" "}
                {run.status.replace("_", " ")} · prompt:{" "}
                {promptNameById(run.pinned_prompt_id)}
                {detail?.signals && (
                  <>
                    {" "}
                    · engagement{" "}
                    {Math.round(Number(detail.signals.engagement_score))}
                    {detail.signals.reply_rate !== null
                      ? ` · reply rate ${Math.round(Number(detail.signals.reply_rate))}%`
                      : ""}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleStep}
                disabled={
                  busy !== null ||
                  run.status === "completed" ||
                  run.status === "awaiting_review" ||
                  run.status === "archived"
                }
                className="bg-navy hover:bg-navy/90 text-white rounded-xl"
              >
                {busy === "step" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" /> Step 1 day
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRunWeek}
                disabled={
                  busy !== null ||
                  run.status === "completed" ||
                  run.status === "archived"
                }
                variant="outline"
                className="border-teal-900/20 text-teal-900/70 rounded-xl"
              >
                {busy === "week" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <FastForward className="w-4 h-4 mr-1" /> Run remaining week
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReset}
                disabled={busy !== null || run.status === "archived"}
                variant="outline"
                className="border-teal-900/20 text-teal-900/70 rounded-xl"
              >
                {busy === "reset" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset
                  </>
                )}
              </Button>
            </div>
          </div>

          {busy === "week" && (
            <div className="text-sm text-teal-900/60 bg-white/50 rounded-xl p-3">
              Simulating the remaining days — each day is one generation, one
              persona reaction, and enrichment. This takes ~30 seconds.
            </div>
          )}

          {/* Pending day review */}
          {pendingDay && run.status === "awaiting_review" && (
            <div className="rounded-2xl border border-em-purple-300 bg-em-purple-300/10 p-5 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-em-purple-400">
                Day {pendingDay.day_number} — review the persona&apos;s
                reaction
              </div>
              <div className="text-sm text-navy">
                <span className="font-medium">Message sent:</span>{" "}
                {pendingDay.outbound_text}
              </div>
              {pendingDay.debug.proposal?.reasoning && (
                <div className="text-[12px] text-teal-900/60 italic">
                  Persona model: {pendingDay.debug.proposal.reasoning}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction("reply")}
                  className={`text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
                    reviewAction === "reply"
                      ? "bg-navy text-white border-navy"
                      : "bg-white/50 text-teal-900/70 border-teal-900/15"
                  }`}
                >
                  They reply
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction("silence")}
                  className={`text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
                    reviewAction === "silence"
                      ? "bg-navy text-white border-navy"
                      : "bg-white/50 text-teal-900/70 border-teal-900/15"
                  }`}
                >
                  They stay silent
                </button>
              </div>
              {reviewAction === "reply" && (
                <textarea
                  className="w-full rounded-xl border border-teal-900/15 bg-white/60 px-3 py-2 text-sm text-navy min-h-[80px] focus:outline-none focus:ring-2 focus:ring-em-purple-300"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What they text back — edit freely"
                />
              )}
              <Button
                type="button"
                onClick={handleCommit}
                disabled={
                  busy !== null ||
                  (reviewAction === "reply" && !reviewText.trim())
                }
                className="bg-navy hover:bg-navy/90 text-white rounded-xl"
              >
                {busy === "commit" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Commit day"
                )}
              </Button>
            </div>
          )}

          <ConversationTimeline days={detail?.days ?? []} />

          {/* End-of-week memory */}
          {run.status === "completed" && detail?.memory && (
            <div className="rounded-2xl border border-teal-900/10 bg-white/40 p-5">
              <div className="text-[11px] uppercase tracking-widest text-teal-900/40 mb-2">
                What the system remembers after this week
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {JSON.stringify(detail.memory.summary, null, 2)}
              </pre>
            </div>
          )}

          {/* New run for A/B */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-teal-900/10">
            <span className="text-[11px] uppercase tracking-widest text-teal-900/50">
              New run (A/B):
            </span>
            <select
              value={newRunPromptId}
              onChange={(e) => setNewRunPromptId(e.target.value)}
              className="rounded-xl border border-teal-900/15 bg-white/60 px-3 py-1.5 text-sm text-navy focus:outline-none"
            >
              <option value="">Active / built-in prompt</option>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  Pin: {p.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleNewRun}
              disabled={busy !== null}
              className="border-teal-900/20 text-teal-900/70 rounded-xl"
            >
              {busy === "new-run" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Archive week & start fresh"
              )}
            </Button>
            <span className="text-[11px] text-teal-900/40">
              Same persona, clean slate — compare how a different prompt lands.
            </span>
          </div>
        </section>
      )}

      {/* Archived runs for the selected persona */}
      {selectedPersona &&
        selectedPersona.runs.filter((r) => r.status === "archived").length >
          0 && (
          <section className="space-y-2">
            <div className="text-[11px] uppercase tracking-widest text-teal-900/50 px-1">
              Past weeks for {selectedPersona.name ?? "this persona"}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPersona.runs
                .filter((r) => r.status === "archived")
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRunIdOverride(r.id)}
                    className={`text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
                      selectedRunId === r.id
                        ? "bg-navy text-white border-navy"
                        : "bg-white/50 text-teal-900/70 border-teal-900/15 hover:border-teal-900/40"
                    }`}
                  >
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {promptNameById(r.pinned_prompt_id)}
                  </button>
                ))}
              {run?.status === "archived" && (
                <button
                  type="button"
                  onClick={() => setRunIdOverride(null)}
                  className="text-[13px] px-3 py-1.5 rounded-full border bg-white/50 text-teal-900/70 border-teal-900/15 hover:border-teal-900/40"
                >
                  ← Back to current week
                </button>
              )}
            </div>
          </section>
        )}

      <PromptManager
        prompts={prompts}
        builtInPromptBody={builtInPromptBody}
        onChanged={() => void refreshPrompts()}
      />

      <PersonaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={() => {
          void refreshPersonas().then((refreshed) => {
            if (refreshed && refreshed.length > 0) {
              setSelectedPersonaId(refreshed[0].id);
            }
          });
        }}
      />
    </div>
  );
}
