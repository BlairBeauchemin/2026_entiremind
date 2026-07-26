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
  /**
   * When the user explicitly asks us to change what we talk about ("can we
   * focus on manifestation?"), a short normalized restatement of that steer.
   * Null when the reply carries no explicit topic directive.
   */
  directive: string | null;
  /**
   * True when this payload came from a real model enrichment; false when it's
   * the deterministic fallback (see buildFallbackEnrichment). The reconcile
   * cron re-enriches rows where this is false. Absent on pre-existing rows,
   * which are treated as already-enriched.
   */
  enriched: boolean;
}

// The enrich call runs in the webhook's background `after()` — Twilio already
// has its TwiML response, so a tight race just drops signal. Give the model
// real headroom; env-tunable for tuning without a deploy.
const ENRICH_TIMEOUT_MS = Number(process.env.ENRICH_TIMEOUT_MS) || 10000;
const ENRICH_MAX_ATTEMPTS = 2;

/**
 * Resolve the model for the enrichment call. Deliberately its OWN env var —
 * enrichment must never inherit ANTHROPIC_MODEL (which the daily generator may
 * point at a slow, thinking-enabled Sonnet). Defaults to Haiku.
 */
export function resolveEnrichModel(): string {
  return process.env.ANTHROPIC_ENRICH_MODEL || "claude-haiku-4-5-20251001";
}

/**
 * A reply is "substantive" when it clears this length, or when the enrichment
 * model explicitly said so. Shared by the fallback payload and the next-day
 * reference so both agree.
 */
export const SUBSTANTIVE_MIN_CHARS = 30;

/**
 * Decide whether a reply is substantive. Prefers the model's `substantive`
 * flag when present; otherwise (enrichment missing/failed) falls back to a
 * length heuristic so a long reply still surfaces even before it's enriched.
 */
export function deriveSubstantive(
  insights: { substantive?: boolean } | null | undefined,
  text: string,
): boolean {
  if (insights && typeof insights.substantive === "boolean") {
    return insights.substantive;
  }
  return text.trim().length >= SUBSTANTIVE_MIN_CHARS;
}

/**
 * Deterministic minimal enrichment used when the model call fails outright.
 * Guarantees an inbound reply is never left with fully-null insights: at least
 * `substantive` is derived from length so the next-day reference and memory
 * compaction can still see it, and `enriched: false` flags it for the reconcile
 * cron to re-enrich later.
 */
export function buildFallbackEnrichment(replyText: string): ReplyEnrichment {
  return {
    sentiment: "neutral",
    emotional_state: "unknown",
    themes: [],
    category: "other",
    modality: "reflective",
    mentions: [],
    open_thread: false,
    substantive: replyText.trim().length >= SUBSTANTIVE_MIN_CHARS,
    acknowledgement: null,
    distortion_flags: [],
    directive: null,
    enriched: false,
  };
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

  const directiveRaw = obj.directive;
  const directive =
    typeof directiveRaw === "string" && directiveRaw.trim().length > 0
      ? directiveRaw.trim().slice(0, 160)
      : null;

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
    directive,
    enriched: true,
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
 * One enrichment attempt. Returns the parsed enrichment, or null on timeout or
 * malformed output. Throws on an API error so the caller's retry loop can see it.
 */
async function attemptEnrich(
  anthropic: Anthropic,
  replyText: string,
  knownPatterns: Distortion[],
  model: string,
): Promise<ReplyEnrichment | null> {
  // Non-Haiku models (e.g. Sonnet) default to adaptive thinking, which returns a
  // thinking block as content[0] and can eat the whole output — disable it so
  // the JSON always lands in the first text block. Haiku is already thinking-off.
  const thinking = /haiku/i.test(model)
    ? undefined
    : ({ type: "disabled" } as const);

  const call = anthropic.messages.create({
    model,
    max_tokens: 400,
    system: ENRICH_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildEnrichInput(replyText, knownPatterns) },
    ],
    thinking,
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

  return coerceEnrichment(JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)));
}

/**
 * Classify an inbound reply and (when substantive) generate a brief acknowledgement.
 * Retries once on timeout/malformed output/API error. Returns null only after all
 * attempts fail — callers must then persist buildFallbackEnrichment so the reply
 * is never left with fully-null insights.
 */
export async function enrichInboundReply(
  replyText: string,
  knownPatterns: Distortion[] = [],
): Promise<ReplyEnrichment | null> {
  const anthropic = getClient();
  const model = resolveEnrichModel();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= ENRICH_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await attemptEnrich(
        anthropic,
        replyText,
        knownPatterns,
        model,
      );
      if (result) return result;
    } catch (err) {
      lastError = err;
    }
    if (attempt < ENRICH_MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Log loudly so a persistent enrichment failure surfaces in error monitoring
  // instead of hiding behind the soft-ack fallback (the original silent bug).
  console.error(
    "Enrich call failed after all attempts:",
    lastError ?? "no usable result (timeout or malformed output)",
  );
  return null;
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
