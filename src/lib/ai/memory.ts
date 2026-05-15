import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "../supabase";
import { MEMORY_SYSTEM_PROMPT } from "./prompts/memory";

export interface UserMemorySummary {
  themes: string[];
  vision: string | null;
  obstacles: string | null;
  recent_emotional_state: string;
  open_threads: string[];
  last_breakthrough: string | null;
  tone_notes: string | null;
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
    ? obj.open_threads.filter((t): t is string => typeof t === "string").slice(0, 6)
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
        .filter((i): i is number => typeof i === "number" && Number.isInteger(i) && i >= 0)
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
  currentIntention: string | null
): string {
  const lines: string[] = [];
  lines.push(
    `Current intention: ${currentIntention ? `"${currentIntention}"` : "(none on file)"}`
  );
  lines.push("");
  lines.push(
    `Below are the last ${MEMORY_LOOKBACK_DAYS} days of replies from this user, oldest first. Each entry is indexed. Each entry includes brief metadata when available.`
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
  lines.push("Produce the memory blob and intention shift assessment as a single JSON object.");
  return lines.join("\n");
}

function estimateTokenCount(text: string): number {
  // Rough heuristic: 1 token ~= 4 chars of English. Good enough for monitoring.
  return Math.ceil(text.length / 4);
}

/**
 * Seed an initial memory blob from a user's onboarding answers.
 * Used for new users before they've accumulated reply history.
 */
export function buildSeedMemoryFromOnboarding(onboarding: {
  intention?: string | null;
  vision?: string | null;
  obstacles?: string | null;
  aligned_state?: string | null;
}): UserMemorySummary {
  const intentionLine = onboarding.intention
    ? `working toward: ${onboarding.intention}`
    : null;
  const themes = intentionLine ? [intentionLine] : [];
  const tone = onboarding.aligned_state
    ? `feels most themselves when: ${onboarding.aligned_state}`
    : null;
  return {
    themes,
    vision: onboarding.vision ?? null,
    obstacles: onboarding.obstacles ?? null,
    recent_emotional_state: "no replies yet — fresh onboarding",
    open_threads: [],
    last_breakthrough: null,
    tone_notes: tone,
  };
}

/**
 * Compact a single user's last N days of replies into a structured memory blob.
 * Persists the result to user_memory and archives the previous version to
 * user_memory_history. Returns the compacted summary, or null if the user has
 * no replies and no onboarding seed.
 */
export async function compactUserMemory(
  userId: string
): Promise<UserMemorySummary | null> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MEMORY_LOOKBACK_DAYS);

  const { data: replies, error: repliesError } = await supabase
    .from("messages")
    .select("id, text, created_at, insights")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .gte("created_at", cutoff.toISOString())
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
    model: process.env.ANTHROPIC_MEMORY_MODEL || "claude-sonnet-4-6",
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

  await persistMemory(userId, summary);

  // Intention shift detection (best-effort; failure should not block memory)
  if (
    parsed &&
    typeof parsed === "object" &&
    "intention_shift" in (parsed as Record<string, unknown>)
  ) {
    const shift = coerceIntentionShift((parsed as Record<string, unknown>).intention_shift);
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
    console.error(`Failed to record intention shift for user ${params.userId}:`, error);
  }
}

async function persistMemory(
  userId: string,
  summary: UserMemorySummary
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

  // Upsert current memory
  const { error: upsertError } = await supabase
    .from("user_memory")
    .upsert(
      {
        user_id: userId,
        summary,
        version: MEMORY_VERSION,
        token_count: tokenCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error(`Failed to persist memory for user ${userId}:`, upsertError);
  }
}

/**
 * Load the current memory summary for a user, or null if none exists.
 */
export async function loadUserMemory(
  userId: string
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
