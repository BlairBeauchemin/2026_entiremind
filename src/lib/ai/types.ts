/**
 * AI content generation types
 */

import type { UserMemorySummary, MemoryHistoryEntry } from "./memory";
import type { PersonaProfile } from "../persona/types";

export type ContentType =
  | "reflection"
  | "quote"
  | "check-in"
  | "action"
  | "gratitude";

/**
 * Rhetorical stance of a daily prompt — an axis orthogonal to ContentType.
 * `question` reproduces the pre-feeling-seen behavior (ends with a question);
 * the others are the feeling-seen beats and only fire when the founder has
 * enabled the feature and the user has the signal to support them.
 */
export type MessageMode = "question" | "mirror" | "callback" | "attunement";

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
  /**
   * The last few outbound daily-prompt openings, fed back so the model does
   * not reuse the same shape/opener day after day. Set by buildUserContext.
   */
  recentOutboundOpenings: string[];
  /**
   * Archived past memory versions, used only for `callback` mode to contrast
   * "a few weeks ago" with now. Loaded lazily (null until a callback is chosen).
   */
  memoryHistory?: MemoryHistoryEntry[] | null;
}

/** Why selectMessageMode landed on its choice — surfaced in the simulator. */
export interface ModeSelectionDebug {
  mode: MessageMode;
  /** content_selection_config.feeling_seen_enabled at decision time. */
  enabled: boolean;
  /** A playbook technique is active, so mode was forced to `question`. */
  techniqueActive: boolean;
  /** The mode was forced to hit its weekly cadence target. */
  forcedByCadence: boolean;
  /** Modes that passed the eligibility gates (had the signal to run). */
  eligible: MessageMode[];
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
  /** Rhetorical stance used for this message. */
  mode: MessageMode;
  /** Present when the mode came from rules-based selection. */
  modeSelection?: ModeSelectionDebug;
}

export interface AiGenerateOptions {
  /** Max output tokens. Defaults to 100 (SMS-length messages). */
  maxTokens?: number;
  /**
   * Override the model for this call (else ANTHROPIC_MODEL / built-in default).
   * Used to route the feeling-seen modes to a stronger model than the default.
   */
  model?: string;
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
