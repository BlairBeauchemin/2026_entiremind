import type {
  UserContext,
  ContentType,
  MessageMode,
  SelectionDebug,
  ModeSelectionDebug,
} from "./types";
import type { Technique } from "../techniques/types";
import { renderMemoryForPrompt, renderProgressionForPrompt } from "./memory";
import { renderProfileForPrompt } from "../persona/prompt";
import { createServiceRoleClient } from "../supabase";

/**
 * System prompt for message generation
 */
export const SYSTEM_PROMPT = `You are a thoughtful guide for Entiremind, an SMS-based manifestation and reflection system. Your role is to send brief, warm morning messages that help users align their thoughts and intentions.

Guidelines:
- Keep messages under 160 characters (SMS limit) unless told a higher ceiling
- Be warm and genuine, but not cheesy or overly enthusiastic
- Never use emojis
- Output only the message text itself — no preamble, quotes, labels, or explanation
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
 * The rhetorical-stance instruction for a message. `question` reproduces the
 * pre-feeling-seen behavior (a content-typed prompt ending in a question); the
 * other modes are declarative and MUST NOT end with a question — that's how the
 * "always end with a question" mandate becomes conditional per mode.
 */
export function getModeInstruction(
  mode: MessageMode,
  contentType: ContentType,
): string {
  switch (mode) {
    case "mirror":
      return "Reflect back ONE specific thing this person has said, or a real pattern you've noticed about them. Make a single declarative observation that helps them feel genuinely seen. Do NOT ask a question.";
    case "callback":
      return "Deliberately reference something from a while ago and contrast it with where they are now — a 'then vs. now' that shows you remember. One or two short sentences. Do NOT ask a question.";
    case "attunement":
      return "Offer one grounded, encouraging statement that lands — something true about where they are right now. No advice, no homework. Do NOT ask a question.";
    case "question":
    default:
      return `${getContentTypePrompt(contentType)} End with a gentle question or invitation to reflect.`;
  }
}

/** Whether a mode should be encouraged to reference specifics / quote the user. */
function isFeelingSeenMode(mode: MessageMode): boolean {
  return mode === "mirror" || mode === "callback";
}

/**
 * Build the user prompt for message generation.
 *
 * @param mode        Rhetorical stance (defaults to `question` = legacy behavior).
 * @param charCeiling Soft character ceiling stated to the model (160 for
 *                    question/attunement; higher for mirror/callback).
 */
export function buildUserPrompt(
  context: UserContext,
  contentType: ContentType,
  technique?: Technique | null,
  mode: MessageMode = "question",
  charCeiling = 160,
): string {
  const parts: string[] = [];

  // A playbook technique, when present, replaces the generic content-type
  // instruction with a recipe to enact — as a question, never a lesson. All
  // the personalization blocks below still stack on top. (Technique sends are
  // always `question` mode — see selectMessageMode — so no conflict.)
  if (technique) {
    parts.push(
      `Today, work from this approach: "${technique.prompt_recipe}" Turn it into ONE short question that enacts the approach for this person. Never name or explain the technique; keep the calm Entiremind voice.`,
    );
  } else {
    parts.push(getModeInstruction(mode, contentType));
  }

  // Add user context
  if (context.name) {
    parts.push(`The user's name is ${context.name}.`);
  }

  if (context.intention) {
    parts.push(`Their stated intention is: "${context.intention}"`);
  }

  // Inject the derived persona profile block (Onboarding v2). Sits with the
  // memory block so it shares the same per-user cached section. No profile, no
  // block — unprofiled users get exactly the pre-v2 prompt.
  if (context.profile) {
    parts.push(renderProfileForPrompt(context.profile));
  }

  const showSpecifics = isFeelingSeenMode(mode);

  // Inject the compacted memory blob (refreshed weekly). On feeling-seen modes
  // the model is encouraged to reference a specific thread and may quote the
  // user's own words; on ordinary days it stays light-touch, as before.
  if (context.memory) {
    parts.push(renderMemoryForPrompt(context.memory));
    parts.push(
      showSpecifics
        ? "Reference ONE specific open thread or theme above. You may quote 2-4 of their own words in quotation marks. Be precise, not generic — this is the moment they feel remembered."
        : "Let the memory inform tone and direction, but do not quote it back to the user. Pick at most one thread to lean on; do not list themes.",
    );
  }

  // For callback mode, inject a "then vs. now" contrast from archived memory.
  if (mode === "callback" && context.memoryHistory && context.memory) {
    const progression = renderProgressionForPrompt(
      context.memory,
      context.memoryHistory,
    );
    if (progression) parts.push(progression);
  }

  // Inject the most recent substantive reply, if any.
  if (context.recentReply) {
    const r = context.recentReply;
    const themeStr =
      r.themes.length > 0 ? r.themes.join(", ") : "no specific themes";
    parts.push(
      `Their most recent reply (${r.hoursAgo}h ago) sat in: ${themeStr}. Emotional state: ${r.emotionalState} (${r.sentiment}). What they said: "${r.text}"`,
    );
    parts.push(
      showSpecifics
        ? "Reflect this back with precision — you may quote a few of their own words. Show them you actually read it."
        : "You may subtly reference this if it fits naturally. Do not quote it back. Do not force a callback if today's prompt would land better fresh.",
    );
  }

  // Anti-repetition: show the model its own recent openings so it stops
  // regressing to the same shape day after day.
  if (context.recentOutboundOpenings.length > 0) {
    parts.push(
      `Your recent messages to this person opened like this:\n${context.recentOutboundOpenings
        .map((o) => `- "${o}"`)
        .join(
          "\n",
        )}\nDo NOT reuse these openings or sentence shapes. Never open with "Good morning [name], what's one thing".`,
    );
  }

  // Add engagement context for personalization
  if (context.consecutiveSilences >= 3) {
    parts.push(
      "They haven't replied in a while. Keep it light and low-pressure.",
    );
  } else if (context.engagementScore > 70) {
    parts.push("They've been engaged. You can go a bit deeper.");
  }

  parts.push(
    `Remember: under ${charCeiling} characters, no emojis, warm but not cheesy.`,
  );

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
  // Feeling-seen message modes (migration 026)
  feeling_seen_enabled: boolean;
  mirror_target_per_week: number;
  callback_target_per_week: number;
  mode_char_ceiling: number;
}

const DEFAULT_CONFIG: ContentSelectionConfig = {
  no_repeat_days: 1,
  earned_reply_bias: 0.6,
  earned_reply_min_sends: 5,
  earned_reply_lookback_days: 30,
  quote_max_per_week: 1,
  silence_threshold: 3,
  feeling_seen_enabled: false,
  mirror_target_per_week: 2,
  callback_target_per_week: 1,
  mode_char_ceiling: 300,
};

const ALL_TYPES: ContentType[] = [
  "reflection",
  "check-in",
  "action",
  "gratitude",
  "quote",
];
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
    earned_reply_bias: Number(
      data.earned_reply_bias ?? DEFAULT_CONFIG.earned_reply_bias,
    ),
    earned_reply_min_sends:
      data.earned_reply_min_sends ?? DEFAULT_CONFIG.earned_reply_min_sends,
    earned_reply_lookback_days:
      data.earned_reply_lookback_days ??
      DEFAULT_CONFIG.earned_reply_lookback_days,
    quote_max_per_week:
      data.quote_max_per_week ?? DEFAULT_CONFIG.quote_max_per_week,
    silence_threshold:
      data.silence_threshold ?? DEFAULT_CONFIG.silence_threshold,
    feeling_seen_enabled:
      data.feeling_seen_enabled ?? DEFAULT_CONFIG.feeling_seen_enabled,
    mirror_target_per_week:
      data.mirror_target_per_week ?? DEFAULT_CONFIG.mirror_target_per_week,
    callback_target_per_week:
      data.callback_target_per_week ?? DEFAULT_CONFIG.callback_target_per_week,
    mode_char_ceiling:
      data.mode_char_ceiling ?? DEFAULT_CONFIG.mode_char_ceiling,
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
  lookbackDays: number,
  asOf: Date = new Date(),
): Promise<OutboundRow[]> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const { data } = await supabase
    .from("messages")
    .select("id, content_type, created_at")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .gte("created_at", cutoff.toISOString())
    .lte("created_at", asOf.toISOString())
    .order("created_at", { ascending: false });

  const rows = (data as RawOutboundRow[]) ?? [];
  return rows.flatMap((m) =>
    m.content_type && isSelectableType(m.content_type)
      ? [{ id: m.id, content_type: m.content_type, created_at: m.created_at }]
      : [],
  );
}

async function loadInboundsForOutbounds(
  outboundIds: string[],
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
  repliedIds: Set<string>,
): Map<ContentType, { sends: number; replies: number; rate: number }> {
  const stats = new Map<
    ContentType,
    { sends: number; replies: number; rate: number }
  >();
  for (const m of outbounds) {
    const entry = stats.get(m.content_type) ?? {
      sends: 0,
      replies: 0,
      rate: 0,
    };
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
  weights: Map<ContentType, number>,
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
export async function selectContentType(
  context: UserContext,
  asOf: Date = new Date(),
): Promise<ContentType> {
  const { contentType } = await selectContentTypeDetailed(context, asOf);
  return contentType;
}

/**
 * Same rules as selectContentType, but also returns why the choice landed
 * where it did — surfaced in the founder simulator's debug view.
 */
export async function selectContentTypeDetailed(
  context: UserContext,
  asOf: Date = new Date(),
): Promise<{ contentType: ContentType; debug: SelectionDebug }> {
  const config = await loadConfig();

  const lookback = Math.max(config.earned_reply_lookback_days, 7);
  const outbounds = await loadRecentOutbound(context.userId, lookback, asOf);
  const repliedIds = await loadInboundsForOutbounds(outbounds.map((o) => o.id));

  // Rule 1: exclude types sent in the no-repeat window
  const noRepeatCutoff = new Date(asOf);
  noRepeatCutoff.setDate(noRepeatCutoff.getDate() - config.no_repeat_days);
  const recentTypes = new Set<ContentType>(
    outbounds
      .filter((o) => new Date(o.created_at) >= noRepeatCutoff)
      .map((o) => o.content_type),
  );
  let candidates = ALL_TYPES.filter((t) => !recentTypes.has(t));

  // Rule 3: enforce quote cap (count quotes in the last 7 days)
  const weekCutoff = new Date(asOf);
  weekCutoff.setDate(weekCutoff.getDate() - 7);
  const recentQuotes = outbounds.filter(
    (o) => o.content_type === "quote" && new Date(o.created_at) >= weekCutoff,
  ).length;
  const quoteCapped = recentQuotes >= config.quote_max_per_week;
  if (quoteCapped) {
    candidates = candidates.filter((t) => t !== "quote");
  }

  // Rule 2: gentle types when silent or struggling
  const isStruggling = context.recentReply?.sentiment === "struggling";
  const isSilent = context.consecutiveSilences >= config.silence_threshold;
  let gentleMode = false;
  if (isStruggling || isSilent) {
    const gentle = candidates.filter((t) => STRUGGLING_TYPES.includes(t));
    if (gentle.length > 0) {
      candidates = gentle;
      gentleMode = true;
    }
  }

  // Safety net: if we filtered everything out, fall back to the full set
  if (candidates.length === 0) candidates = [...ALL_TYPES];

  const rates = computeReplyRateByType(outbounds, repliedIds);
  const debug: SelectionDebug = {
    excludedByNoRepeat: [...recentTypes],
    quoteCapped,
    gentleMode,
    usedWeightedPick: false,
    replyRates: Object.fromEntries(
      [...rates].map(([t, s]) => [t, { sends: s.sends, rate: s.rate }]),
    ),
  };

  // Rules 4 & 5: weighted by reply rate, or uniform
  if (Math.random() < config.earned_reply_bias) {
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
      debug.usedWeightedPick = true;
      return { contentType: pickWeighted(qualified, weights), debug };
    }
  }

  return { contentType: pickUniform(candidates), debug };
}

// ============================================================================
// Message mode selection (feeling-seen redesign)
// ============================================================================

/** Count how many of each mode were sent in the trailing `days` window. */
async function loadRecentModeCounts(
  userId: string,
  days: number,
  asOf: Date,
): Promise<Partial<Record<MessageMode, number>>> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - days);

  const { data } = await supabase
    .from("messages")
    .select("message_mode")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .not("message_mode", "is", null)
    .gte("created_at", cutoff.toISOString())
    .lte("created_at", asOf.toISOString());

  const counts: Partial<Record<MessageMode, number>> = {};
  for (const row of (data as { message_mode: string | null }[]) ?? []) {
    const m = row.message_mode as MessageMode | null;
    if (m) counts[m] = (counts[m] ?? 0) + 1;
  }
  return counts;
}

export interface ModeDecisionInput {
  /** content_selection_config.feeling_seen_enabled */
  enabled: boolean;
  /** A playbook technique is shaping this send — force `question`. */
  techniqueActive: boolean;
  /** Feeling-seen modes the user has the signal to support right now. */
  eligible: MessageMode[];
  /** Count of each mode sent in the trailing 7 days (for cadence). */
  sentThisWeek: Partial<Record<MessageMode, number>>;
  mirrorTarget: number;
  callbackTarget: number;
  /** Injectable for tests; defaults to Math.random. */
  random?: () => number;
}

/**
 * Pure mode decision. Returns `question` (today's behavior) unless the feature
 * is enabled, no technique is active, and the user is eligible. mirror/callback
 * are cadence-driven: each is spread across a rolling 7-day window by firing
 * today with probability (target - sentThisWeek) / 7, so ~target land per week.
 * attunement is an occasional softener; question is the default otherwise.
 */
export function decideMessageMode(input: ModeDecisionInput): ModeSelectionDebug {
  const rnd = input.random ?? Math.random;
  const base: ModeSelectionDebug = {
    mode: "question",
    enabled: input.enabled,
    techniqueActive: input.techniqueActive,
    forcedByCadence: false,
    eligible: input.eligible,
  };

  if (!input.enabled || input.techniqueActive) return base;

  const isEligible = (m: MessageMode) => input.eligible.includes(m);

  // Cadence — callback first (rarer), then mirror.
  const cadence: Array<{ mode: MessageMode; target: number }> = [
    { mode: "callback", target: input.callbackTarget },
    { mode: "mirror", target: input.mirrorTarget },
  ];
  for (const { mode, target } of cadence) {
    if (!isEligible(mode) || target <= 0) continue;
    const needed = target - (input.sentThisWeek[mode] ?? 0);
    if (needed <= 0) continue;
    if (rnd() < needed / 7) {
      return { ...base, mode, forcedByCadence: true };
    }
  }

  // Occasional attunement softener; otherwise the default question.
  if (isEligible("attunement") && rnd() < 0.15) {
    return { ...base, mode: "attunement" };
  }
  return base;
}

/**
 * Select the rhetorical mode for a user's next daily prompt, plus the character
 * ceiling to state to the model. Loads config + recent-mode counts, computes
 * eligibility from the context, and defers the decision to `decideMessageMode`.
 *
 * Invariant: returns `question` with the legacy 160-char ceiling whenever the
 * feature is off, a technique is active, or the user lacks the required signal.
 */
export async function selectMessageMode(
  context: UserContext,
  techniqueActive: boolean,
  asOf: Date = new Date(),
): Promise<{ mode: MessageMode; debug: ModeSelectionDebug; charCeiling: number }> {
  const config = await loadConfig();

  // Fast path: feature off — no extra query, identical to today.
  if (!config.feeling_seen_enabled || techniqueActive) {
    return {
      mode: "question",
      debug: {
        mode: "question",
        enabled: config.feeling_seen_enabled,
        techniqueActive,
        forcedByCadence: false,
        eligible: [],
      },
      charCeiling: 160,
    };
  }

  const eligible: MessageMode[] = [];
  const hasReply = context.recentReply != null;
  const hasThreads = (context.memory?.open_threads.length ?? 0) > 0;
  if (hasReply || hasThreads) eligible.push("mirror");
  if (
    context.memory &&
    context.memoryHistory &&
    renderProgressionForPrompt(context.memory, context.memoryHistory) != null
  ) {
    eligible.push("callback");
  }
  if (context.memory) eligible.push("attunement");

  const sentThisWeek = await loadRecentModeCounts(context.userId, 7, asOf);

  const debug = decideMessageMode({
    enabled: config.feeling_seen_enabled,
    techniqueActive,
    eligible,
    sentThisWeek,
    mirrorTarget: config.mirror_target_per_week,
    callbackTarget: config.callback_target_per_week,
  });

  const charCeiling =
    debug.mode === "mirror" || debug.mode === "callback"
      ? config.mode_char_ceiling
      : 160;

  return { mode: debug.mode, debug, charCeiling };
}

/**
 * Per-mode reply rate over a lookback window (for founder measurement). Reuses
 * the same reply_to_message_id join as the per-content-type rates.
 */
export async function computeReplyRateByMode(
  userId: string,
  lookbackDays = 30,
  asOf: Date = new Date(),
): Promise<Partial<Record<MessageMode, { sends: number; rate: number }>>> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const { data } = await supabase
    .from("messages")
    .select("id, message_mode")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .not("message_mode", "is", null)
    .gte("created_at", cutoff.toISOString())
    .lte("created_at", asOf.toISOString());

  const rows = (data as { id: string; message_mode: string | null }[]) ?? [];
  const repliedIds = await loadInboundsForOutbounds(rows.map((r) => r.id));

  const stats = new Map<MessageMode, { sends: number; replies: number }>();
  for (const row of rows) {
    const m = row.message_mode as MessageMode | null;
    if (!m) continue;
    const entry = stats.get(m) ?? { sends: 0, replies: 0 };
    entry.sends += 1;
    if (repliedIds.has(row.id)) entry.replies += 1;
    stats.set(m, entry);
  }

  const out: Partial<Record<MessageMode, { sends: number; rate: number }>> = {};
  for (const [mode, entry] of stats) {
    out[mode] = {
      sends: entry.sends,
      rate: entry.sends > 0 ? entry.replies / entry.sends : 0,
    };
  }
  return out;
}
