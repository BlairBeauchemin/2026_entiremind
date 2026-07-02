import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENRICH_SYSTEM_PROMPT } from "./prompts/enrich";
import { DISTORTIONS } from "../persona/types";
import type { Distortion } from "../persona/types";
import { distortionPromptHint } from "../persona/prompt";

export type EnrichmentSentiment = "positive" | "neutral" | "struggling";
export type EnrichmentCategory =
  | "career"
  | "health"
  | "relationships"
  | "money"
  | "identity"
  | "creative"
  | "family"
  | "spiritual"
  | "other";
export type EnrichmentModality =
  | "reflective"
  | "action-oriented"
  | "venting"
  | "question";

export interface ReplyEnrichment {
  sentiment: EnrichmentSentiment;
  emotional_state: string;
  themes: string[];
  category: EnrichmentCategory;
  modality: EnrichmentModality;
  mentions: string[];
  open_thread: boolean;
  substantive: boolean;
  acknowledgement: string | null;
  /** Which of the user's known inner-critic patterns this reply exhibits. */
  distortion_flags: Distortion[];
}

const ENRICH_TIMEOUT_MS = 3000;

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

const VALID_SENTIMENTS: EnrichmentSentiment[] = [
  "positive",
  "neutral",
  "struggling",
];
const VALID_CATEGORIES: EnrichmentCategory[] = [
  "career",
  "health",
  "relationships",
  "money",
  "identity",
  "creative",
  "family",
  "spiritual",
  "other",
];
const VALID_MODALITIES: EnrichmentModality[] = [
  "reflective",
  "action-oriented",
  "venting",
  "question",
];

export function coerceEnrichment(raw: unknown): ReplyEnrichment | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const sentiment = VALID_SENTIMENTS.includes(
    obj.sentiment as EnrichmentSentiment,
  )
    ? (obj.sentiment as EnrichmentSentiment)
    : "neutral";

  const category = VALID_CATEGORIES.includes(obj.category as EnrichmentCategory)
    ? (obj.category as EnrichmentCategory)
    : "other";

  const modality = VALID_MODALITIES.includes(obj.modality as EnrichmentModality)
    ? (obj.modality as EnrichmentModality)
    : "reflective";

  const themes = Array.isArray(obj.themes)
    ? obj.themes.filter((t): t is string => typeof t === "string").slice(0, 8)
    : [];

  const mentions = Array.isArray(obj.mentions)
    ? obj.mentions.filter((m): m is string => typeof m === "string").slice(0, 8)
    : [];

  const emotional_state =
    typeof obj.emotional_state === "string"
      ? obj.emotional_state.slice(0, 64)
      : "neutral";

  const ackRaw = obj.acknowledgement;
  const acknowledgement =
    typeof ackRaw === "string" && ackRaw.trim().length > 0
      ? ackRaw.trim().slice(0, 160)
      : null;

  const distortion_flags = Array.isArray(obj.distortion_flags)
    ? obj.distortion_flags
        .filter(
          (d): d is Distortion =>
            typeof d === "string" &&
            (DISTORTIONS as readonly string[]).includes(d),
        )
        .slice(0, DISTORTIONS.length)
    : [];

  return {
    sentiment,
    emotional_state,
    themes,
    category,
    modality,
    mentions,
    open_thread: Boolean(obj.open_thread),
    substantive: Boolean(obj.substantive),
    acknowledgement,
    distortion_flags,
  };
}

/**
 * Compose the enrichment call's user message. When the user has known
 * inner-critic patterns, they ride in as a bracketed context preamble (the
 * system prompt stays static so it keeps caching). Codes are paired with
 * plain-language hints so the model can both recognize and return them.
 */
export function buildEnrichInput(
  replyText: string,
  knownPatterns: Distortion[],
): string {
  if (knownPatterns.length === 0) return replyText;
  const pairs = knownPatterns
    .map((d) => `${d} = ${distortionPromptHint(d)}`)
    .join("; ");
  return (
    `[This user's known inner-critic patterns: ${pairs}. ` +
    `If this reply clearly exhibits one, include its code in distortion_flags ` +
    `and you MAY gently reframe in the acknowledgement — never label or diagnose.]` +
    `\n\n${replyText}`
  );
}

/**
 * Classify an inbound reply and (when substantive) generate a brief acknowledgement.
 * Returns null on timeout, malformed output, or any API failure — callers should
 * fall back to the soft-ack library in that case.
 */
export async function enrichInboundReply(
  replyText: string,
  knownPatterns: Distortion[] = [],
): Promise<ReplyEnrichment | null> {
  try {
    const anthropic = getClient();

    const call = anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: ENRICH_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildEnrichInput(replyText, knownPatterns) },
      ],
    });

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), ENRICH_TIMEOUT_MS),
    );

    const response = await Promise.race([call, timeout]);
    if (!response) {
      console.warn("Enrich call timed out");
      return null;
    }

    const block = response.content[0];
    if (block.type !== "text" || !block.text) {
      console.warn("Enrich response had no text content");
      return null;
    }

    const trimmed = block.text.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      console.warn("Enrich response did not contain JSON");
      return null;
    }

    const jsonStr = trimmed.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    return coerceEnrichment(parsed);
  } catch (err) {
    console.error("Enrich call failed:", err);
    return null;
  }
}

/**
 * Load a user's known inner-critic patterns from their persona profile so the
 * enrichment call can listen for them. Returns [] when the user has no profile.
 */
export async function loadKnownPatterns(
  supabase: SupabaseClient,
  userId: string,
): Promise<Distortion[]> {
  const { data } = await supabase
    .from("user_profiles")
    .select("primary_distortion, secondary_distortion")
    .eq("user_id", userId)
    // maybeSingle: existing (pre-v2) users have no profile row — 0 rows is fine.
    .maybeSingle();
  if (!data) return [];
  return [data.primary_distortion, data.secondary_distortion].filter(
    (d): d is Distortion => typeof d === "string",
  );
}

/**
 * Persist an enrichment payload: insights JSONB on the inbound message plus
 * one message_themes row per theme. Shared by the Twilio webhook and the
 * founder simulator so both paths write identical data.
 */
export async function persistEnrichment(
  supabase: SupabaseClient,
  params: {
    userId: string;
    inboundMessageId: string;
    enrichment: ReplyEnrichment;
  },
): Promise<void> {
  const { userId, inboundMessageId, enrichment } = params;

  const { error: insightsError } = await supabase
    .from("messages")
    .update({ insights: enrichment })
    .eq("id", inboundMessageId);

  if (insightsError) {
    console.error("Failed to persist insights:", insightsError);
  }

  if (enrichment.themes.length > 0) {
    const themeRows = enrichment.themes.map((theme) => ({
      message_id: inboundMessageId,
      theme,
      category: enrichment.category,
      user_id: userId,
    }));
    const { error: themesError } = await supabase
      .from("message_themes")
      .insert(themeRows);
    if (themesError) {
      console.error("Failed to persist message themes:", themesError);
    }
  }
}
