import { createServiceRoleClient } from "../supabase";
import { getUserSignals } from "../signals";
import type {
  UserContext,
  GeneratedMessage,
  ContentType,
  AiProvider,
  AiProviderAdapter,
  RecentReplyContext,
} from "./types";
import { buildUserPrompt, selectContentTypeDetailed } from "./prompts";
import {
  loadActiveSystemPrompt,
  loadSystemPromptById,
  type ResolvedSystemPrompt,
} from "./system-prompt";
import { openaiAdapter } from "./providers/openai";
import { anthropicAdapter } from "./providers/anthropic";
import { loadUserMemory } from "./memory";
import type { PersonaProfile } from "../persona/types";

const RECENT_REPLY_LOOKBACK_HOURS = 48;

// Re-export types
export type {
  UserContext,
  GeneratedMessage,
  ContentType,
  AiProvider,
} from "./types";

/**
 * Get the current AI provider from environment
 * Defaults to 'anthropic' (Claude)
 */
export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "openai") {
    return "openai";
  }
  // Default to Anthropic (Claude)
  return "anthropic";
}

/**
 * Get the adapter for the current AI provider
 */
export function getProviderAdapter(): AiProviderAdapter {
  const provider = getAiProvider();
  switch (provider) {
    case "openai":
      return openaiAdapter;
    case "anthropic":
      return anthropicAdapter;
    default:
      return anthropicAdapter;
  }
}

/**
 * Build user context for AI personalization
 */
export async function buildUserContext(
  userId: string,
  asOf: Date = new Date(),
): Promise<UserContext> {
  const supabase = createServiceRoleClient();

  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  // Fetch active intention
  const { data: intention } = await supabase
    .from("intentions")
    .select("text")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get user signals
  const signals = await getUserSignals(userId);

  // Load compacted memory blob (refreshed weekly by the memory cron)
  const memory = await loadUserMemory(userId);

  // Load most recent substantive reply within the lookback window
  const recentReply = await loadRecentSubstantiveReply(userId, asOf);

  // Load the derived persona profile (Onboarding v2). Null for unprofiled users.
  const profile = await loadUserProfile(userId);

  return {
    userId,
    name: user?.name || null,
    intention: intention?.text || null,
    engagementScore: signals?.engagementScore ?? 50,
    consecutiveSilences: signals?.consecutiveSilences ?? 0,
    lastReplyAt: signals?.lastReplyAt ?? null,
    memory,
    recentReply,
    profile,
  };
}

interface ProfileRow {
  archetype: PersonaProfile["archetype"];
  motivation_orientation: PersonaProfile["motivation_orientation"];
  change_style: PersonaProfile["change_style"];
  primary_distortion: PersonaProfile["primary_distortion"];
  secondary_distortion: PersonaProfile["secondary_distortion"];
  distortion_scores: PersonaProfile["distortion_scores"] | null;
  core_values: PersonaProfile["core_values"] | null;
  tone_preference: PersonaProfile["tone_preference"];
  intention_category: PersonaProfile["intention_category"];
}

async function loadUserProfile(userId: string): Promise<PersonaProfile | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("user_profiles")
    .select(
      "archetype, motivation_orientation, change_style, primary_distortion, secondary_distortion, distortion_scores, core_values, tone_preference, intention_category",
    )
    .eq("user_id", userId)
    // maybeSingle: existing (pre-v2) users have no profile row — 0 rows is
    // expected, not an error.
    .maybeSingle();

  if (!data) return null;
  const row = data as ProfileRow;
  return {
    archetype: row.archetype,
    motivation_orientation: row.motivation_orientation,
    change_style: row.change_style,
    primary_distortion: row.primary_distortion,
    secondary_distortion: row.secondary_distortion,
    distortion_scores: row.distortion_scores ?? {},
    core_values: row.core_values ?? [],
    tone_preference: row.tone_preference,
    intention_category: row.intention_category,
  };
}

interface ReplyRow {
  text: string;
  created_at: string;
  insights: {
    sentiment?: "positive" | "neutral" | "struggling";
    emotional_state?: string;
    themes?: string[];
    substantive?: boolean;
  } | null;
}

async function loadRecentSubstantiveReply(
  userId: string,
  asOf: Date = new Date(),
): Promise<RecentReplyContext | null> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date(asOf);
  cutoff.setHours(cutoff.getHours() - RECENT_REPLY_LOOKBACK_HOURS);

  const { data: reply } = await supabase
    .from("messages")
    .select("text, created_at, insights")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .gte("created_at", cutoff.toISOString())
    .lte("created_at", asOf.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!reply) return null;
  const row = reply as ReplyRow;
  if (!row.insights?.substantive) return null;

  const ageMs = asOf.getTime() - new Date(row.created_at).getTime();
  const hoursAgo = Math.round(ageMs / (1000 * 60 * 60));

  return {
    text: row.text,
    themes: row.insights.themes ?? [],
    emotionalState: row.insights.emotional_state ?? "unspecified",
    sentiment: row.insights.sentiment ?? "neutral",
    hoursAgo,
  };
}

/**
 * Generate a personalized message for a user
 */
export async function generateMessageForUser(
  userId: string,
  preferredContentType?: ContentType,
  opts?: {
    /** Reference time for all lookback windows (simulator). Defaults to now. */
    asOf?: Date;
    /** Pin generation to a specific prompt version (simulator A/B runs). */
    systemPromptId?: string | null;
  },
): Promise<GeneratedMessage> {
  const adapter = getProviderAdapter();
  const asOf = opts?.asOf ?? new Date();
  const context = await buildUserContext(userId, asOf);

  // Select content type (use preferred if provided, otherwise rules-based selection)
  let contentType = preferredContentType;
  let selection: GeneratedMessage["selection"];
  if (!contentType) {
    const detailed = await selectContentTypeDetailed(context, asOf);
    contentType = detailed.contentType;
    selection = detailed.debug;
  }

  // Resolve the system prompt: pinned version, else active version, else the
  // built-in default constant.
  const systemPrompt: ResolvedSystemPrompt = opts?.systemPromptId
    ? await loadSystemPromptById(opts.systemPromptId)
    : await loadActiveSystemPrompt();

  // Build the prompt
  const userPrompt = buildUserPrompt(context, contentType);

  try {
    const text = await adapter.generateMessage(systemPrompt.body, userPrompt);

    // Ensure we're under 160 characters
    const truncated = text.length > 160;
    const finalText = truncated ? text.substring(0, 157) + "..." : text;

    console.log(
      `Generated message via ${adapter.provider}: "${finalText.substring(0, 50)}..."`,
    );

    return {
      text: finalText,
      contentType,
      fallback: false,
      truncated,
      userPrompt,
      systemPromptId: systemPrompt.id,
      systemPromptName: systemPrompt.name,
      selection,
    };
  } catch (error) {
    console.error(
      `Failed to generate AI message via ${adapter.provider}:`,
      error,
    );

    // Fallback message
    const fallbackMessages: Record<ContentType, string> = {
      reflection: context.name
        ? `Good morning, ${context.name}. What's one thing you'd like to notice about yourself today?`
        : "Good morning. What's one thing you'd like to notice about yourself today?",
      "check-in": context.name
        ? `Morning, ${context.name}. How are you feeling as you start your day?`
        : "Morning. How are you feeling as you start your day?",
      action: context.name
        ? `Hi ${context.name}. What's one small step you could take today toward what matters to you?`
        : "What's one small step you could take today toward what matters to you?",
      gratitude: context.name
        ? `Good morning, ${context.name}. What's one thing, big or small, that you're grateful for today?`
        : "Good morning. What's one thing, big or small, that you're grateful for today?",
      quote:
        "Small shifts in attention can lead to meaningful changes over time.",
    };

    return {
      text: fallbackMessages[contentType],
      contentType,
      fallback: true,
      truncated: false,
      userPrompt,
      systemPromptId: systemPrompt.id,
      systemPromptName: systemPrompt.name,
      selection,
    };
  }
}

/**
 * Generate messages for multiple users (batch operation)
 * Returns a map of userId to generated message
 */
export async function generateMessagesForUsers(
  userIds: string[],
): Promise<Map<string, GeneratedMessage>> {
  const results = new Map<string, GeneratedMessage>();

  // Process in parallel with some concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (userId) => {
      const message = await generateMessageForUser(userId);
      results.set(userId, message);
    });
    await Promise.all(promises);
  }

  return results;
}
