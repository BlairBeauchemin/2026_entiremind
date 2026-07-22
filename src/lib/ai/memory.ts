import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "../supabase";
import { MEMORY_SYSTEM_PROMPT } from "./prompts/memory";
import { tonePromptPhrase, distortionPromptHint } from "../persona/prompt";
import type { PersonaProfile } from "../persona/types";

export interface UserMemorySummary {
  themes: string[];
  vision: string | null;
  obstacles: string | null;
  recent_emotional_state: string;
  open_threads: string[];
  last_breakthrough: string | null;
  tone_notes: string | null;
}

/** An archived past memory version (from user_memory_history). */
export interface MemoryHistoryEntry {
  summary: UserMemorySummary;
  version: number;
  created_at: string;
}

const MEMORY_LOOKBACK_DAYS = 7;
const MEMORY_VERSION = 1;
const INTENTION_SHIFT_MIN_CONFIDENCE = 0.6;

interface IntentionShiftDetection {
  detected: boolean;
  confidence: number;
  proposedIntention: string | null;
  rationale: string | null;
  supportingQuoteIndices: number[];
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set");
  }
  client = new Anthropic({ apiKey });
  return client;
}

function coerceSummary(raw: unknown): UserMemorySummary | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const themes = Array.isArray(obj.themes)
    ? obj.themes.filter((t): t is string => typeof t === "string").slice(0, 8)
    : [];
  const open_threads = Array.isArray(obj.open_threads)
    ? obj.open_threads
        .filter((t): t is string => typeof t === "string")
        .slice(0, 6)
    : [];

  const asStringOrNull = (v: unknown): string | null =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

  return {
    themes,
    vision: asStringOrNull(obj.vision),
    obstacles: asStringOrNull(obj.obstacles),
    recent_emotional_state:
      asStringOrNull(obj.recent_emotional_state) ?? "no signal yet",
    open_threads,
    last_breakthrough: asStringOrNull(obj.last_breakthrough),
    tone_notes: asStringOrNull(obj.tone_notes),
  };
}

// Recaps are sent as a single SMS; clamp anything the model lets sprawl.
const RECAP_MAX_CHARS = 320;

function coerceRecap(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > RECAP_MAX_CHARS) {
    return `${trimmed.slice(0, RECAP_MAX_CHARS - 1).trimEnd()}…`;
  }
  return trimmed;
}

function coerceIntentionShift(raw: unknown): IntentionShiftDetection {
  const fallback: IntentionShiftDetection = {
    detected: false,
    confidence: 0,
    proposedIntention: null,
    rationale: null,
    supportingQuoteIndices: [],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const confidence = typeof obj.confidence === "number" ? obj.confidence : 0;
  const proposed =
    typeof obj.proposed_intention === "string" &&
    obj.proposed_intention.trim().length > 0
      ? obj.proposed_intention.trim()
      : null;
  const rationale =
    typeof obj.rationale === "string" && obj.rationale.trim().length > 0
      ? obj.rationale.trim()
      : null;
  const indices = Array.isArray(obj.supporting_quote_indices)
    ? obj.supporting_quote_indices
        .filter(
          (i): i is number =>
            typeof i === "number" && Number.isInteger(i) && i >= 0,
        )
        .slice(0, 10)
    : [];
  return {
    detected: Boolean(obj.detected) && proposed !== null,
    confidence: Math.max(0, Math.min(1, confidence)),
    proposedIntention: proposed,
    rationale,
    supportingQuoteIndices: indices,
  };
}

interface ReplyForCompaction {
  id: string;
  text: string;
  created_at: string;
  insights: {
    sentiment?: string;
    emotional_state?: string;
    themes?: string[];
    category?: string;
    modality?: string;
  } | null;
}

function buildUserMessage(
  replies: ReplyForCompaction[],
  currentIntention: string | null,
): string {
  const lines: string[] = [];
  lines.push(
    `Current intention: ${currentIntention ? `"${currentIntention}"` : "(none on file)"}`,
  );
  lines.push("");
  lines.push(
    `Below are the last ${MEMORY_LOOKBACK_DAYS} days of replies from this user, oldest first. Each entry is indexed. Each entry includes brief metadata when available.`,
  );
  lines.push("");

  replies.forEach((r, idx) => {
    const date = new Date(r.created_at).toISOString().slice(0, 10);
    const meta: string[] = [];
    if (r.insights?.sentiment) meta.push(`sentiment=${r.insights.sentiment}`);
    if (r.insights?.emotional_state)
      meta.push(`state=${r.insights.emotional_state}`);
    if (r.insights?.themes && r.insights.themes.length > 0) {
      meta.push(`themes=${r.insights.themes.join(",")}`);
    }
    if (r.insights?.modality) meta.push(`modality=${r.insights.modality}`);
    const metaStr = meta.length > 0 ? ` [${meta.join("; ")}]` : "";
    lines.push(`[${idx}] ${date}${metaStr}: ${r.text}`);
  });

  lines.push("");
  lines.push(
    "Produce the memory blob and intention shift assessment as a single JSON object.",
  );
  return lines.join("\n");
}

function estimateTokenCount(text: string): number {
  // Rough heuristic: 1 token ~= 4 chars of English. Good enough for monitoring.
  return Math.ceil(text.length / 4);
}

/**
 * Seed an initial memory blob from a user's onboarding answers.
 * Used for new users before they've accumulated reply history.
 *
 * When a derived persona profile is supplied (Onboarding v2), tone_notes is
 * composed from the tone preference + aligned-state, obstacles is seeded from
 * the friendly-named inner-critic pattern, and the intention category is added
 * as a theme. Without a profile, the prior behavior is preserved.
 */
export function buildSeedMemoryFromOnboarding(onboarding: {
  intention?: string | null;
  vision?: string | null;
  obstacles?: string | null;
  aligned_state?: string | null;
  profile?: PersonaProfile | null;
}): UserMemorySummary {
  const profile = onboarding.profile ?? null;

  const intentionLine = onboarding.intention
    ? `working toward: ${onboarding.intention}`
    : null;
  const themes = intentionLine ? [intentionLine] : [];
  if (profile) themes.push(profile.intention_category);

  const alignedLine = onboarding.aligned_state
    ? `feels most themselves when: ${onboarding.aligned_state}`
    : null;

  let tone_notes: string | null = alignedLine;
  let obstacles: string | null = onboarding.obstacles ?? null;

  if (profile) {
    const preference = `prefers ${tonePromptPhrase(profile.tone_preference)}`;
    tone_notes = alignedLine ? `${preference}; ${alignedLine}` : preference;
    obstacles = profile.primary_distortion
      ? `inner critic tends toward ${distortionPromptHint(profile.primary_distortion)}`
      : null;
  }

  return {
    themes,
    vision: onboarding.vision ?? null,
    obstacles,
    recent_emotional_state: "no replies yet — fresh onboarding",
    open_threads: [],
    last_breakthrough: null,
    tone_notes,
  };
}

/**
 * Merge a freshly derived persona profile into a user's EXISTING memory blob
 * (Onboarding v2 backfill / retake).
 *
 * Unlike the seed path, this is deliberately conservative: an existing onboarded
 * user's memory may hold months of compaction, so only the persona-derived
 * fields are refreshed — `tone_notes` gains the tone preference (preserving any
 * prior context, idempotent across retakes) and `obstacles` is set from the
 * inner-critic pattern (kept as-is when the profile is confident). Themes,
 * vision, open threads, emotional state, and breakthroughs are untouched.
 */
export function mergeProfileIntoMemory(
  existing: UserMemorySummary,
  profile: PersonaProfile,
): UserMemorySummary {
  const preference = `prefers ${tonePromptPhrase(profile.tone_preference)}`;
  // Strip any prior leading "prefers ...;" clause so retakes don't stack.
  const rest = (existing.tone_notes ?? "")
    .replace(/^prefers[^;]*;?\s*/i, "")
    .trim();
  const tone_notes = rest ? `${preference}; ${rest}` : preference;

  const obstacles = profile.primary_distortion
    ? `inner critic tends toward ${distortionPromptHint(profile.primary_distortion)}`
    : existing.obstacles;

  return {
    ...existing,
    obstacles,
    tone_notes,
  };
}

/**
 * Compact a single user's last N days of replies into a structured memory blob.
 * Persists the result to user_memory and archives the previous version to
 * user_memory_history. Returns the compacted summary, or null if the user has
 * no replies and no onboarding seed.
 */
export async function compactUserMemory(
  userId: string,
  asOf: Date = new Date(),
): Promise<UserMemorySummary | null> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - MEMORY_LOOKBACK_DAYS);

  const { data: replies, error: repliesError } = await supabase
    .from("messages")
    .select("id, text, created_at, insights")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .gte("created_at", cutoff.toISOString())
    .lte("created_at", asOf.toISOString())
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error(`Failed to fetch replies for user ${userId}:`, repliesError);
    return null;
  }

  if (!replies || replies.length === 0) {
    const { data: onboarding } = await supabase
      .from("onboarding_responses")
      .select("intention, vision, obstacles, aligned_state")
      .eq("user_id", userId)
      .single();

    if (!onboarding) {
      return null;
    }

    const seed = buildSeedMemoryFromOnboarding(onboarding);
    await persistMemory(userId, seed);
    return seed;
  }

  // Fetch the user's current active intention so the model can compare against it
  const { data: intentionRow } = await supabase
    .from("intentions")
    .select("text")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  const currentIntention = intentionRow?.text ?? null;

  const typedReplies = replies as ReplyForCompaction[];
  const anthropic = getClient();
  const userMessage = buildUserMessage(typedReplies, currentIntention);

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MEMORY_MODEL || "claude-sonnet-5",
    max_tokens: 1000,
    system: MEMORY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== "text" || !block.text) {
    console.error(`Empty memory response for user ${userId}`);
    return null;
  }

  const trimmed = block.text.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    console.error(`Memory response missing JSON for user ${userId}`);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
  } catch (err) {
    console.error(`Failed to parse memory JSON for user ${userId}:`, err);
    return null;
  }

  const summary = coerceSummary(parsed);
  if (!summary) {
    console.error(`Memory coercion failed for user ${userId}`);
    return null;
  }

  const recap = coerceRecap(
    (parsed as Record<string, unknown>).recap_message,
  );

  await persistMemory(userId, summary, recap);

  // Intention shift detection (best-effort; failure should not block memory)
  if (
    parsed &&
    typeof parsed === "object" &&
    "intention_shift" in (parsed as Record<string, unknown>)
  ) {
    const shift = coerceIntentionShift(
      (parsed as Record<string, unknown>).intention_shift,
    );
    if (
      shift.detected &&
      shift.confidence >= INTENTION_SHIFT_MIN_CONFIDENCE &&
      shift.proposedIntention &&
      currentIntention
    ) {
      await recordIntentionShift({
        userId,
        currentIntention,
        proposedIntention: shift.proposedIntention,
        confidence: shift.confidence,
        rationale: shift.rationale,
        supportingMessageIds: shift.supportingQuoteIndices
          .map((i) => typedReplies[i]?.id)
          .filter((id): id is string => !!id),
      });
    }
  }

  return summary;
}

async function recordIntentionShift(params: {
  userId: string;
  currentIntention: string;
  proposedIntention: string;
  confidence: number;
  rationale: string | null;
  supportingMessageIds: string[];
}): Promise<void> {
  const supabase = createServiceRoleClient();

  // Avoid duplicates: if there's already a pending suggestion with the same
  // proposed text for this user, skip.
  const { data: existing } = await supabase
    .from("intention_shift_suggestions")
    .select("id")
    .eq("user_id", params.userId)
    .eq("status", "pending")
    .eq("proposed_intention", params.proposedIntention)
    .limit(1)
    .single();

  if (existing) return;

  const { error } = await supabase.from("intention_shift_suggestions").insert({
    user_id: params.userId,
    current_intention: params.currentIntention,
    proposed_intention: params.proposedIntention,
    confidence: params.confidence,
    rationale: params.rationale,
    supporting_message_ids: params.supportingMessageIds,
    status: "pending",
  });

  if (error) {
    console.error(
      `Failed to record intention shift for user ${params.userId}:`,
      error,
    );
  }
}

async function persistMemory(
  userId: string,
  summary: UserMemorySummary,
  pendingRecap: string | null = null,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const tokenCount = estimateTokenCount(JSON.stringify(summary));

  // Archive previous version (if any) to history
  const { data: previous } = await supabase
    .from("user_memory")
    .select("summary, version")
    .eq("user_id", userId)
    .single();

  if (previous) {
    await supabase.from("user_memory_history").insert({
      user_id: userId,
      summary: previous.summary,
      version: previous.version ?? MEMORY_VERSION,
    });
  }

  // Upsert current memory. pending_recap is always written — a compaction
  // with no recap clears any stale one from a previous week.
  const { error: upsertError } = await supabase.from("user_memory").upsert(
    {
      user_id: userId,
      summary,
      version: MEMORY_VERSION,
      token_count: tokenCount,
      pending_recap: pendingRecap,
      recap_generated_at: pendingRecap ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error(`Failed to persist memory for user ${userId}:`, upsertError);
  }
}

// A staged recap is only valid for a couple of days — it's written Monday
// pre-dawn and meant for that morning's send. Anything older is stale.
const RECAP_MAX_AGE_HOURS = 48;

/**
 * Claim the user's pending weekly recap, if one is staged and fresh.
 * Clears it before returning so a recap is never delivered twice, even if
 * the caller's send subsequently fails (dropping a recap is better than
 * double-texting it).
 */
export async function takePendingRecap(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("user_memory")
    .select("pending_recap, recap_generated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.pending_recap || !data.recap_generated_at) return null;

  const ageHours =
    (Date.now() - new Date(data.recap_generated_at).getTime()) / 3_600_000;

  const { error: clearError } = await supabase
    .from("user_memory")
    .update({ pending_recap: null, recap_generated_at: null })
    .eq("user_id", userId);

  if (clearError) {
    // If we can't claim it, don't send it — another run may also read it.
    console.error(`Failed to claim recap for user ${userId}:`, clearError);
    return null;
  }

  return ageHours <= RECAP_MAX_AGE_HOURS ? data.pending_recap : null;
}

/**
 * Load the current memory summary for a user, or null if none exists.
 */
export async function loadUserMemory(
  userId: string,
): Promise<UserMemorySummary | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_memory")
    .select("summary")
    .eq("user_id", userId)
    .single();

  if (error || !data?.summary) return null;
  return data.summary as UserMemorySummary;
}

/**
 * Render a memory summary as a compact text block for prompt injection.
 * Designed to be short, scannable, and useful to the daily-prompt model.
 */
export function renderMemoryForPrompt(summary: UserMemorySummary): string {
  const lines: string[] = [];
  lines.push("What we know about this user:");
  if (summary.themes.length > 0) {
    lines.push(`- Recent themes: ${summary.themes.join(", ")}`);
  }
  if (summary.vision) {
    lines.push(`- Vision: ${summary.vision}`);
  }
  if (summary.obstacles) {
    lines.push(`- Obstacles: ${summary.obstacles}`);
  }
  lines.push(`- Recent emotional state: ${summary.recent_emotional_state}`);
  if (summary.open_threads.length > 0) {
    lines.push(`- Open threads: ${summary.open_threads.join("; ")}`);
  }
  if (summary.last_breakthrough) {
    lines.push(`- Last breakthrough: ${summary.last_breakthrough}`);
  }
  if (summary.tone_notes) {
    lines.push(`- Tone: ${summary.tone_notes}`);
  }
  return lines.join("\n");
}

/**
 * Load the most recent archived memory versions for a user (oldest of the set
 * is used to contrast "a few weeks ago" against now in `callback` mode).
 * Returns newest-first; empty when the user has no archived history yet.
 */
export async function loadMemoryHistory(
  userId: string,
  limit = 3,
): Promise<MemoryHistoryEntry[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_memory_history")
    .select("summary, version, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data
    .filter((row) => row.summary)
    .map((row) => ({
      summary: row.summary as UserMemorySummary,
      version: (row.version as number) ?? MEMORY_VERSION,
      created_at: row.created_at as string,
    }));
}

/**
 * Render a "then vs. now" contrast from the oldest archived memory version to
 * the current one, for `callback` mode. Returns null when there's no history
 * or no discernible shift — the caller then falls back to a non-callback mode.
 */
export function renderProgressionForPrompt(
  current: UserMemorySummary,
  past: MemoryHistoryEntry[],
): string | null {
  if (past.length === 0) return null;
  // Oldest of the loaded set gives the widest, most legible contrast.
  const oldest = past[past.length - 1];
  const then = oldest.summary;

  const thenState = then.recent_emotional_state?.trim() || "";
  const nowState = current.recent_emotional_state?.trim() || "";
  const thenThemes = then.themes.slice(0, 3).join(", ");
  const nowThemes = current.themes.slice(0, 3).join(", ");

  // Require a real difference in either the emotional state or the themes.
  const stateShifted =
    thenState.length > 0 && nowState.length > 0 && thenState !== nowState;
  const themesShifted =
    thenThemes.length > 0 && nowThemes.length > 0 && thenThemes !== nowThemes;
  if (!stateShifted && !themesShifted) return null;

  const weeksAgo = Math.max(
    1,
    Math.round(
      (Date.now() - new Date(oldest.created_at).getTime()) /
        (7 * 24 * 3_600_000),
    ),
  );
  const whenLabel = weeksAgo === 1 ? "About a week ago" : `About ${weeksAgo} weeks ago`;

  const parts: string[] = [];
  parts.push("How this user has shifted over time (for a callback):");
  const thenBits: string[] = [];
  if (thenThemes) thenBits.push(`working with ${thenThemes}`);
  if (thenState) thenBits.push(`felt ${thenState}`);
  const nowBits: string[] = [];
  if (nowThemes) nowBits.push(`working with ${nowThemes}`);
  if (nowState) nowBits.push(`feels ${nowState}`);
  parts.push(`- ${whenLabel}: ${thenBits.join("; ") || "unclear"}`);
  parts.push(`- Now: ${nowBits.join("; ") || "unclear"}`);
  if (current.last_breakthrough) {
    parts.push(`- Recent breakthrough: ${current.last_breakthrough}`);
  }
  return parts.join("\n");
}

// Content types that count as real daily prompts (mirrors ai/prompts ALL_TYPES).
// Recovery/upgrade/ack/welcome/recap sends are excluded so the anti-repetition
// signal reflects only genuine morning prompts.
const DAILY_PROMPT_CONTENT_TYPES = [
  "reflection",
  "quote",
  "check-in",
  "action",
  "gratitude",
];

/**
 * Load the openings of the user's recent daily prompts so the generator can be
 * told not to reuse the same shape/opener. Returns short opening fragments
 * (first ~8 words), most recent first.
 */
export async function loadRecentOutboundOpenings(
  userId: string,
  limit = 5,
  asOf: Date = new Date(),
): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("messages")
    .select("text, created_at")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .in("content_type", DAILY_PROMPT_CONTENT_TYPES)
    .lte("created_at", asOf.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data
    .map((row) => (typeof row.text === "string" ? row.text.trim() : ""))
    .filter((t) => t.length > 0)
    .map((t) => {
      const words = t.split(/\s+/).slice(0, 8).join(" ");
      return words.length < t.length ? `${words}…` : words;
    });
}
