/** Client-side shapes for the founder messaging simulator UI. */

export interface SimRunSummary {
  id: string;
  user_id: string;
  status: "active" | "awaiting_review" | "completed" | "archived";
  start_date: string;
  current_day: number;
  total_days: number;
  pinned_prompt_id: string | null;
  persona_brief: string;
  reply_style: string;
  created_at: string;
}

export interface PersonaSummary {
  id: string;
  name: string | null;
  created_at: string;
  runs: SimRunSummary[];
}

export interface PromptVersion {
  id: string;
  name: string;
  body: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonaProposalView {
  action: "reply" | "silence";
  text: string | null;
  delayMinutes: number;
  reasoning: string | null;
  raw?: string;
}

export interface SimDayView {
  id: string;
  run_id: string;
  day_number: number;
  sim_date: string;
  outbound_text: string | null;
  inbound_text: string | null;
  persona_action: "reply" | "silence" | null;
  status: "pending_review" | "committed";
  debug: {
    user_prompt?: string;
    system_prompt_id?: string | null;
    system_prompt_name?: string;
    content_type?: string;
    fallback?: boolean;
    truncated?: boolean;
    selection?: Record<string, unknown> | null;
    proposal?: PersonaProposalView | null;
    engagement_before?: { score: number; consecutive_silences: number };
    enrichment?: Record<string, unknown> | null;
    would_be_ack?: { text: string; kind: string };
    founder_edited?: boolean;
    committed_action?: string;
    compacted_memory?: Record<string, unknown> | null;
  };
}

export interface RunDetail {
  run: SimRunSummary;
  days: SimDayView[];
  signals: {
    engagement_score: number;
    reply_rate: number | null;
    consecutive_silences: number;
    total_replies: number;
    total_messages_sent: number;
  } | null;
  memory: { summary: Record<string, unknown>; updated_at: string } | null;
}
