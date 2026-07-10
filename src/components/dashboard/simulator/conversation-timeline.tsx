"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { SimDayView } from "./types";

function formatSimDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function DebugDrawer({ day }: { day: SimDayView }) {
  const d = day.debug;
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-navy/[0.03] border border-navy/10 p-4 text-[13px] leading-relaxed">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
          System prompt
        </div>
        <div className="text-navy">
          {d.system_prompt_name ?? "Built-in default"}
        </div>
      </div>

      {d.user_prompt && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            Exact user prompt sent to the model
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-64 overflow-y-auto">
            {d.user_prompt}
          </pre>
        </div>
      )}

      {d.selection != null && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            Content-type selection
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-40 overflow-y-auto">
            {JSON.stringify(d.selection, null, 2)}
          </pre>
        </div>
      )}

      {d.proposal && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            Persona decision
          </div>
          <div className="text-teal-900/80">
            {d.proposal.action === "reply"
              ? `Replied after ~${d.proposal.delayMinutes} min`
              : "Stayed silent"}
            {d.proposal.reasoning ? ` — ${d.proposal.reasoning}` : ""}
            {d.founder_edited ? " (reply edited by you)" : ""}
          </div>
          {d.proposal.raw && (
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] text-red-800/80 bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              Raw model output (unparseable): {d.proposal.raw}
            </pre>
          )}
        </div>
      )}

      {d.enrichment != null && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            Enrichment
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {JSON.stringify(d.enrichment, null, 2)}
          </pre>
        </div>
      )}

      {d.would_be_ack && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            Ack that would have been sent (
            {d.would_be_ack.kind === "ai_mirror" ? "AI mirror" : "soft ack"})
          </div>
          <div className="text-navy italic">“{d.would_be_ack.text}”</div>
        </div>
      )}

      {d.compacted_memory != null && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
            End-of-week memory compaction
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] text-teal-900/80 bg-white/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {JSON.stringify(d.compacted_memory, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Day-by-day feed of a simulated week: outbound bubble (content-type chip,
 * char count, loud fallback flag), inbound bubble or silence marker, and a
 * per-day "why?" drawer with the full generation debug payload.
 */
export function ConversationTimeline({ days }: { days: SimDayView[] }) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  if (days.length === 0) {
    return (
      <div className="text-sm text-teal-900/50 italic">
        No days simulated yet. Step one day or run the full week.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const isOpen = openDay === day.day_number;
        const engagement = day.debug.engagement_before;
        return (
          <article
            key={day.id}
            className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[11px] uppercase tracking-widest text-teal-900/40">
                Day {day.day_number} · {formatSimDate(day.sim_date)}
                {day.status === "pending_review" && (
                  <span className="ml-2 text-em-purple-400">
                    awaiting review
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : day.day_number)}
                className="flex items-center gap-1 text-xs text-teal-900/50 hover:text-teal-900 transition-colors"
              >
                why?
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Outbound */}
            <div className="border-l-2 border-em-purple-300 pl-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-teal-900/40">
                  Entiremind
                </span>
                {day.debug.content_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-em-purple-300/30 text-navy">
                    {day.debug.content_type}
                  </span>
                )}
                <span className="text-[10px] text-teal-900/40">
                  {day.outbound_text?.length ?? 0} chars
                </span>
                {day.debug.fallback && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    fallback — not AI-generated
                  </span>
                )}
                {day.debug.truncated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    truncated to 160
                  </span>
                )}
              </div>
              <p className="text-[15px] text-navy font-medium">
                {day.outbound_text}
              </p>
            </div>

            {/* Inbound / silence */}
            <div className="mt-3 pl-4">
              {day.status === "pending_review" ? (
                <p className="text-sm text-teal-900/50 italic">
                  Persona reaction pending your review below.
                </p>
              ) : day.persona_action === "reply" && day.inbound_text ? (
                <div className="border-l-2 border-teal-900/20 pl-4">
                  <div className="text-[10px] uppercase tracking-widest text-teal-900/40 mb-1">
                    {"They replied"}
                    {day.debug.founder_edited ? " (edited by you)" : ""}
                  </div>
                  <p className="text-[15px] text-teal-900/90">
                    {day.inbound_text}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-teal-900/40 italic">— silence —</p>
              )}
            </div>

            {engagement && (
              <div className="mt-3 text-[11px] text-teal-900/40">
                Engagement going into this day: {engagement.score}
                {engagement.consecutive_silences > 0
                  ? ` · ${engagement.consecutive_silences} consecutive silences`
                  : ""}
              </div>
            )}

            {isOpen && <DebugDrawer day={day} />}
          </article>
        );
      })}
    </div>
  );
}
