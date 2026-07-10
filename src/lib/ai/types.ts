/**
 * AI content generation types
 */

import type { UserMemorySummary } from "./memory";
import type { PersonaProfile } from "../persona/types";

export type ContentType =
  | "reflection"
  | "quote"
  | "check-in"
  | "action"
  | "gratitude";

export type AiProvider = "openai" | "anthropic";

export interface RecentReplyContext {
  text: string;
  themes: string[];
  emotionalState: string;
  sentiment: "positive" | "neutral" | "struggling";
  hoursAgo: number;
}

export interface UserContext {
  userId: string;
  name: string | null;
  intention: string | null;
  engagementScore: number;
  consecutiveSilences: number;
  lastReplyAt: string | null;
  memory: UserMemorySummary | null;
  recentReply: RecentReplyContext | null;
  /** Derived persona profile (Onboarding v2). Null for unprofiled users. */
  profile: PersonaProfile | null;
}

/** Why selectContentType landed on its choice — surfaced in the simulator's debug view. */
export interface SelectionDebug {
  excludedByNoRepeat: ContentType[];
  quoteCapped: boolean;
  gentleMode: boolean;
  usedWeightedPick: boolean;
  replyRates: Partial<Record<ContentType, { sends: number; rate: number }>>;
}

export interface GeneratedMessage {
  text: string;
  contentType: ContentType;
  /** True when the AI call failed and a canned fallback was returned. */
  fallback: boolean;
  /** True when the generated text was truncated to fit 160 chars. */
  truncated: boolean;
  /** The exact user prompt sent to the model (for founder debugging). */
  userPrompt: string;
  /** system_prompts.id used, or null for the built-in default. */
  systemPromptId: string | null;
  systemPromptName: string;
  /** Present when the content type came from rules-based selection. */
  selection?: SelectionDebug;
  /** Set when the message is a curated library quote rather than AI-generated */
  quoteId?: string;
  /** Set when a playbook technique shaped the prompt for this message */
  techniqueId?: string;
}

export interface AiGenerateOptions {
  /** Max output tokens. Defaults to 100 (SMS-length messages). */
  maxTokens?: number;
}

export interface AiProviderAdapter {
  /**
   * The provider name for logging
   */
  provider: AiProvider;

  /**
   * Generate a message given system and user prompts
   */
  generateMessage(
    systemPrompt: string,
    userPrompt: string,
    options?: AiGenerateOptions,
  ): Promise<string>;
}
