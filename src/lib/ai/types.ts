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

export interface GeneratedMessage {
  text: string;
  contentType: ContentType;
}

export interface AiProviderAdapter {
  /**
   * The provider name for logging
   */
  provider: AiProvider;

  /**
   * Generate a message given system and user prompts
   */
  generateMessage(systemPrompt: string, userPrompt: string): Promise<string>;
}
