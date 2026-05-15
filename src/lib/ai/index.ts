import { createServiceRoleClient } from "../supabase";
import { getUserSignals } from "../signals";
import type { UserContext, GeneratedMessage, ContentType, AiProvider, AiProviderAdapter, RecentReplyContext } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt, selectContentType } from "./prompts";
import { openaiAdapter } from "./providers/openai";
import { anthropicAdapter } from "./providers/anthropic";
import { loadUserMemory } from "./memory";

const RECENT_REPLY_LOOKBACK_HOURS = 48;

// Re-export types
export type { UserContext, GeneratedMessage, ContentType, AiProvider } from "./types";

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
function getProviderAdapter(): AiProviderAdapter {
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
export async function buildUserContext(userId: string): Promise<UserContext> {
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
  const recentReply = await loadRecentSubstantiveReply(userId);

  return {
    userId,
    name: user?.name || null,
    intention: intention?.text || null,
    engagementScore: signals?.engagementScore ?? 50,
    consecutiveSilences: signals?.consecutiveSilences ?? 0,
    lastReplyAt: signals?.lastReplyAt ?? null,
    memory,
    recentReply,
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
  userId: string
): Promise<RecentReplyContext | null> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - RECENT_REPLY_LOOKBACK_HOURS);

  const { data: reply } = await supabase
    .from("messages")
    .select("text, created_at, insights")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!reply) return null;
  const row = reply as ReplyRow;
  if (!row.insights?.substantive) return null;

  const ageMs = Date.now() - new Date(row.created_at).getTime();
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
  preferredContentType?: ContentType
): Promise<GeneratedMessage> {
  const adapter = getProviderAdapter();
  const context = await buildUserContext(userId);

  // Select content type (use preferred if provided, otherwise rules-based selection)
  const contentType = preferredContentType || (await selectContentType(context));

  // Build the prompt
  const userPrompt = buildUserPrompt(context, contentType);

  try {
    const text = await adapter.generateMessage(SYSTEM_PROMPT, userPrompt);

    // Ensure we're under 160 characters
    const finalText = text.length > 160 ? text.substring(0, 157) + "..." : text;

    console.log(`Generated message via ${adapter.provider}: "${finalText.substring(0, 50)}..."`);

    return {
      text: finalText,
      contentType,
    };
  } catch (error) {
    console.error(`Failed to generate AI message via ${adapter.provider}:`, error);

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
    };
  }
}

/**
 * Generate messages for multiple users (batch operation)
 * Returns a map of userId to generated message
 */
export async function generateMessagesForUsers(
  userIds: string[]
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
