import type { UserContext, ContentType } from "./types";
import { renderMemoryForPrompt } from "./memory";
import { createServiceRoleClient } from "../supabase";

/**
 * System prompt for message generation
 */
export const SYSTEM_PROMPT = `You are a thoughtful guide for Entiremind, an SMS-based manifestation and reflection system. Your role is to send brief, warm morning messages that help users align their thoughts and intentions.

Guidelines:
- Keep messages under 160 characters (SMS limit)
- Be warm and genuine, but not cheesy or overly enthusiastic
- Never use emojis
- End with a gentle question or invitation to reflect
- If you know the user's name, use it naturally (once, at the beginning)
- If you know their intention, subtly reference it without being repetitive
- Vary your tone and approach day to day
- Focus on what's possible, not what's lacking

Avoid:
- Productivity language ("crush it", "goals", "hustle")
- Corporate phrases ("circle back", "touch base")
- Excessive positivity ("amazing!", "incredible!")
- Cliches about manifestation or the law of attraction
- Questions that feel like homework`;

/**
 * Get a content-type-specific prompt addition
 */
export function getContentTypePrompt(contentType: ContentType): string {
  switch (contentType) {
    case "reflection":
      return "Generate a morning reflection prompt that invites introspection about their current state or intentions.";
    case "check-in":
      return "Generate a simple check-in question about how they're feeling or what's on their mind today.";
    case "action":
      return "Generate a gentle prompt that invites them to notice or do one small thing today related to their intention.";
    case "gratitude":
      return "Generate a prompt that invites reflection on something they're grateful for or something that's going well.";
    case "quote":
      return "Generate an original, short reflection or observation (not a famous quote) that might resonate with them.";
    default:
      return "Generate a warm morning message.";
  }
}

/**
 * Build the user prompt for message generation
 */
export function buildUserPrompt(context: UserContext, contentType: ContentType): string {
  const parts: string[] = [];

  // Add content type instruction
  parts.push(getContentTypePrompt(contentType));

  // Add user context
  if (context.name) {
    parts.push(`The user's name is ${context.name}.`);
  }

  if (context.intention) {
    parts.push(`Their stated intention is: "${context.intention}"`);
  }

  // Inject the compacted memory blob (refreshed weekly)
  if (context.memory) {
    parts.push(renderMemoryForPrompt(context.memory));
    parts.push(
      "Let the memory inform tone and direction, but do not quote it back to the user. Pick at most one thread to lean on; do not list themes."
    );
  }

  // Inject the most recent substantive reply, if any
  if (context.recentReply) {
    const r = context.recentReply;
    const themeStr = r.themes.length > 0 ? r.themes.join(", ") : "no specific themes";
    parts.push(
      `Their most recent reply (${r.hoursAgo}h ago) sat in: ${themeStr}. Emotional state: ${r.emotionalState} (${r.sentiment}). What they said: "${r.text}"`
    );
    parts.push(
      "You may subtly reference this if it fits naturally. Do not quote it back. Do not force a callback if today's prompt would land better fresh."
    );
  }

  // Add engagement context for personalization
  if (context.consecutiveSilences >= 3) {
    parts.push("They haven't replied in a while. Keep it light and low-pressure.");
  } else if (context.engagementScore > 70) {
    parts.push("They've been engaged. You can go a bit deeper.");
  }

  parts.push("Remember: under 160 characters, no emojis, warm but not cheesy.");

  return parts.join("\n\n");
}

// ============================================================================
// Content selection
// ============================================================================

interface ContentSelectionConfig {
  no_repeat_days: number;
  earned_reply_bias: number;
  earned_reply_min_sends: number;
  earned_reply_lookback_days: number;
  quote_max_per_week: number;
  silence_threshold: number;
}

const DEFAULT_CONFIG: ContentSelectionConfig = {
  no_repeat_days: 1,
  earned_reply_bias: 0.6,
  earned_reply_min_sends: 5,
  earned_reply_lookback_days: 30,
  quote_max_per_week: 1,
  silence_threshold: 3,
};

const ALL_TYPES: ContentType[] = ["reflection", "check-in", "action", "gratitude", "quote"];
const STRUGGLING_TYPES: ContentType[] = ["check-in", "gratitude"];

async function loadConfig(): Promise<ContentSelectionConfig> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("content_selection_config")
    .select("*")
    .eq("id", 1)
    .single();
  if (error || !data) return DEFAULT_CONFIG;
  return {
    no_repeat_days: data.no_repeat_days ?? DEFAULT_CONFIG.no_repeat_days,
    earned_reply_bias: Number(data.earned_reply_bias ?? DEFAULT_CONFIG.earned_reply_bias),
    earned_reply_min_sends:
      data.earned_reply_min_sends ?? DEFAULT_CONFIG.earned_reply_min_sends,
    earned_reply_lookback_days:
      data.earned_reply_lookback_days ?? DEFAULT_CONFIG.earned_reply_lookback_days,
    quote_max_per_week: data.quote_max_per_week ?? DEFAULT_CONFIG.quote_max_per_week,
    silence_threshold: data.silence_threshold ?? DEFAULT_CONFIG.silence_threshold,
  };
}

interface RawOutboundRow {
  content_type: string | null;
  created_at: string;
  id: string;
}

interface OutboundRow {
  content_type: ContentType;
  created_at: string;
  id: string;
}

interface InboundRow {
  reply_to_message_id: string | null;
}

function isSelectableType(value: string): value is ContentType {
  return (ALL_TYPES as readonly string[]).includes(value);
}

async function loadRecentOutbound(
  userId: string,
  lookbackDays: number
): Promise<OutboundRow[]> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const { data } = await supabase
    .from("messages")
    .select("id, content_type, created_at")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false });

  const rows = (data as RawOutboundRow[]) ?? [];
  return rows.flatMap((m) =>
    m.content_type && isSelectableType(m.content_type)
      ? [{ id: m.id, content_type: m.content_type, created_at: m.created_at }]
      : []
  );
}

async function loadInboundsForOutbounds(
  outboundIds: string[]
): Promise<Set<string>> {
  if (outboundIds.length === 0) return new Set();
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("messages")
    .select("reply_to_message_id")
    .in("reply_to_message_id", outboundIds);
  const replied = new Set<string>();
  for (const row of (data as InboundRow[]) ?? []) {
    if (row.reply_to_message_id) replied.add(row.reply_to_message_id);
  }
  return replied;
}

function computeReplyRateByType(
  outbounds: OutboundRow[],
  repliedIds: Set<string>
): Map<ContentType, { sends: number; replies: number; rate: number }> {
  const stats = new Map<ContentType, { sends: number; replies: number; rate: number }>();
  for (const m of outbounds) {
    const entry = stats.get(m.content_type) ?? { sends: 0, replies: 0, rate: 0 };
    entry.sends += 1;
    if (repliedIds.has(m.id)) entry.replies += 1;
    stats.set(m.content_type, entry);
  }
  for (const [type, entry] of stats) {
    entry.rate = entry.sends > 0 ? entry.replies / entry.sends : 0;
    stats.set(type, entry);
  }
  return stats;
}

function pickWeighted(
  candidates: ContentType[],
  weights: Map<ContentType, number>
): ContentType {
  const total = candidates.reduce((sum, t) => sum + (weights.get(t) ?? 0), 0);
  if (total <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let r = Math.random() * total;
  for (const t of candidates) {
    r -= weights.get(t) ?? 0;
    if (r <= 0) return t;
  }
  return candidates[candidates.length - 1];
}

function pickUniform(candidates: ContentType[]): ContentType {
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Select a content type using a small set of rules:
 * 1. Exclude types sent in the last `no_repeat_days` days (avoid repeats)
 * 2. If the user is silent or struggling, restrict to gentle types
 * 3. Cap `quote` at `quote_max_per_week`
 * 4. With probability `earned_reply_bias`, weight by per-type reply rate
 *    (using only types with at least `earned_reply_min_sends` sends)
 * 5. Otherwise pick uniformly from the eligible set
 */
export async function selectContentType(context: UserContext): Promise<ContentType> {
  const config = await loadConfig();

  const lookback = Math.max(config.earned_reply_lookback_days, 7);
  const outbounds = await loadRecentOutbound(context.userId, lookback);
  const repliedIds = await loadInboundsForOutbounds(outbounds.map((o) => o.id));

  // Rule 1: exclude types sent in the no-repeat window
  const noRepeatCutoff = new Date();
  noRepeatCutoff.setDate(noRepeatCutoff.getDate() - config.no_repeat_days);
  const recentTypes = new Set<ContentType>(
    outbounds
      .filter((o) => new Date(o.created_at) >= noRepeatCutoff)
      .map((o) => o.content_type)
  );
  let candidates = ALL_TYPES.filter((t) => !recentTypes.has(t));

  // Rule 3: enforce quote cap (count quotes in the last 7 days)
  const weekCutoff = new Date();
  weekCutoff.setDate(weekCutoff.getDate() - 7);
  const recentQuotes = outbounds.filter(
    (o) => o.content_type === "quote" && new Date(o.created_at) >= weekCutoff
  ).length;
  if (recentQuotes >= config.quote_max_per_week) {
    candidates = candidates.filter((t) => t !== "quote");
  }

  // Rule 2: gentle types when silent or struggling
  const isStruggling = context.recentReply?.sentiment === "struggling";
  const isSilent = context.consecutiveSilences >= config.silence_threshold;
  if (isStruggling || isSilent) {
    const gentle = candidates.filter((t) => STRUGGLING_TYPES.includes(t));
    if (gentle.length > 0) candidates = gentle;
  }

  // Safety net: if we filtered everything out, fall back to the full set
  if (candidates.length === 0) candidates = [...ALL_TYPES];

  // Rules 4 & 5: weighted by reply rate, or uniform
  if (Math.random() < config.earned_reply_bias) {
    const rates = computeReplyRateByType(outbounds, repliedIds);
    const qualified = candidates.filter((t) => {
      const stat = rates.get(t);
      return stat && stat.sends >= config.earned_reply_min_sends;
    });
    if (qualified.length > 0) {
      // Weight by rate, with a small floor so zero-reply types still have a chance
      const weights = new Map<ContentType, number>();
      for (const t of qualified) {
        weights.set(t, (rates.get(t)?.rate ?? 0) + 0.05);
      }
      return pickWeighted(qualified, weights);
    }
  }

  return pickUniform(candidates);
}
