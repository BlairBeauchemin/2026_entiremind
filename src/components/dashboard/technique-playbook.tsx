"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronDown } from "lucide-react";

export interface TechniquePlaybookItem {
  id: string;
  name: string;
  principle: string;
  prompt_recipe: string;
  content_types: string[];
  target_distortions: string[];
  target_sentiments: string[];
  tone_compatibility: string[];
  intention_categories: string[];
  gentle: boolean;
  priority: number;
  source_title: string | null;
  source_author: string | null;
  status: "draft" | "active" | "retired";
  sends: number;
  replyRate: number | null;
}

interface TechniquePlaybookProps {
  techniques: TechniquePlaybookItem[];
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  retired: "bg-gray-100 text-gray-500",
};

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  draft: 1,
  retired: 2,
};

function csv(arr: string[]): string {
  return arr.join(", ");
}
function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const BLANK: TechniquePlaybookItem = {
  id: "",
  name: "",
  principle: "",
  prompt_recipe: "",
  content_types: [],
  target_distortions: [],
  target_sentiments: [],
  tone_compatibility: [],
  intention_categories: [],
  gentle: false,
  priority: 0,
  source_title: null,
  source_author: null,
  status: "draft",
  sends: 0,
  replyRate: null,
};

export function TechniquePlaybook({
  techniques: initial,
}: TechniquePlaybookProps) {
  const [items, setItems] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/founder/techniques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function handleSave(item: TechniquePlaybookItem, isNew: boolean) {
    setPendingId(item.id || "new");
    setError(null);
    try {
      const payload = {
        action: isNew ? "create" : "update",
        ...(isNew ? {} : { id: item.id }),
        name: item.name,
        principle: item.principle,
        prompt_recipe: item.prompt_recipe,
        content_types: item.content_types,
        target_distortions: item.target_distortions,
        target_sentiments: item.target_sentiments,
        tone_compatibility: item.tone_compatibility,
        intention_categories: item.intention_categories,
        gentle: item.gentle,
        priority: item.priority,
        source_title: item.source_title ?? "",
        source_author: item.source_author ?? "",
      };
      const result = await post(payload);
      if (isNew) {
        setItems((prev) => [{ ...item, id: result.id }, ...prev]);
        setCreating(false);
      } else {
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
        setExpandedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  async function handleStatus(id: string, action: "activate" | "retire") {
    setPendingId(id);
    setError(null);
    try {
      await post({ action, id });
      const status = action === "activate" ? "active" : "retired";
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  const sorted = [...items].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      b.sends - a.sends,
  );

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCreating((c) => !c)}
          className="border-em-purple-300/50 text-navy rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> New technique
        </Button>
      </div>

      {creating && (
        <TechniqueEditor
          initial={BLANK}
          isNew
          pending={pendingId === "new"}
          onSave={(item) => handleSave(item, true)}
          onCancel={() => setCreating(false)}
        />
      )}

      {sorted.map((item) => (
        <div
          key={item.id}
          className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy">
                  {item.name}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_BADGE[item.status]}`}
                >
                  {item.status}
                </span>
                {item.gentle && (
                  <span className="text-[10px] uppercase tracking-widest text-teal-900/40">
                    gentle
                  </span>
                )}
              </div>
              <div className="text-sm text-teal-900/60 italic mt-1">
                {item.principle}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-teal-900/40 mt-2">
                {item.sends} sends
                {item.replyRate !== null
                  ? ` · ${Math.round(item.replyRate * 100)}% reply`
                  : " · no data yet"}
                {item.target_distortions.length > 0
                  ? ` · ${csv(item.target_distortions)}`
                  : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setExpandedId((id) => (id === item.id ? null : item.id))
              }
              className="text-teal-900/50 hover:text-navy shrink-0"
              aria-label="Edit technique"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${expandedId === item.id ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {expandedId === item.id && (
            <div className="mt-4 pt-4 border-t border-em-purple-300/30">
              <TechniqueEditor
                initial={item}
                isNew={false}
                pending={pendingId === item.id}
                onSave={(updated) => handleSave(updated, false)}
                onCancel={() => setExpandedId(null)}
                extraActions={
                  <>
                    {item.status !== "active" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus(item.id, "activate")}
                        disabled={pendingId === item.id}
                        className="border-emerald-300 text-emerald-700 rounded-xl"
                      >
                        Activate
                      </Button>
                    )}
                    {item.status !== "retired" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatus(item.id, "retire")}
                        disabled={pendingId === item.id}
                        className="border-teal-900/20 text-teal-900/60 rounded-xl"
                      >
                        Retire
                      </Button>
                    )}
                  </>
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TechniqueEditor({
  initial,
  isNew,
  pending,
  onSave,
  onCancel,
  extraActions,
}: {
  initial: TechniquePlaybookItem;
  isNew: boolean;
  pending: boolean;
  onSave: (item: TechniquePlaybookItem) => void;
  onCancel: () => void;
  extraActions?: React.ReactNode;
}) {
  const [draft, setDraft] = useState(initial);

  function set<K extends keyof TechniquePlaybookItem>(
    key: K,
    value: TechniquePlaybookItem[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const inputCls =
    "w-full text-sm border border-em-purple-300/40 rounded-lg px-3 py-2 bg-white/70";
  const labelCls =
    "text-[10px] uppercase tracking-widest text-teal-900/40 mb-1 block";

  return (
    <div className="space-y-3">
      {isNew && (
        <div>
          <label className={labelCls}>Name (house name)</label>
          <input
            className={inputCls}
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
      )}
      <div>
        <label className={labelCls}>Principle</label>
        <textarea
          className={inputCls}
          rows={2}
          value={draft.principle}
          onChange={(e) => set("principle", e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Prompt recipe (instruction to enact)</label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.prompt_recipe}
          onChange={(e) => set("prompt_recipe", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Content types (comma-sep)</label>
          <input
            className={inputCls}
            value={csv(draft.content_types)}
            onChange={(e) => set("content_types", parseCsv(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls}>Target distortions</label>
          <input
            className={inputCls}
            value={csv(draft.target_distortions)}
            onChange={(e) =>
              set("target_distortions", parseCsv(e.target.value))
            }
          />
        </div>
        <div>
          <label className={labelCls}>Target sentiments</label>
          <input
            className={inputCls}
            value={csv(draft.target_sentiments)}
            onChange={(e) => set("target_sentiments", parseCsv(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls}>Tone compatibility</label>
          <input
            className={inputCls}
            value={csv(draft.tone_compatibility)}
            onChange={(e) =>
              set("tone_compatibility", parseCsv(e.target.value))
            }
          />
        </div>
        <div>
          <label className={labelCls}>Intention categories</label>
          <input
            className={inputCls}
            value={csv(draft.intention_categories)}
            onChange={(e) =>
              set("intention_categories", parseCsv(e.target.value))
            }
          />
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <input
            type="number"
            className={inputCls}
            value={draft.priority}
            onChange={(e) => set("priority", Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          checked={draft.gentle}
          onChange={(e) => set("gentle", e.target.checked)}
        />
        Gentle (safe for struggling / silent users)
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={() => onSave(draft)}
          disabled={pending}
          className="bg-navy hover:bg-navy/90 text-white rounded-xl"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isNew ? (
            "Create draft"
          ) : (
            "Save"
          )}
        </Button>
        {extraActions}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
          className="border-teal-900/20 text-teal-900/60 rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
