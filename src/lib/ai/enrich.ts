import Anthropic from "@anthropic-ai/sdk";
import { ENRICH_SYSTEM_PROMPT } from "./prompts/enrich";

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
export type EnrichmentModality = "reflective" | "action-oriented" | "venting" | "question";

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

const VALID_SENTIMENTS: EnrichmentSentiment[] = ["positive", "neutral", "struggling"];
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

function coerceEnrichment(raw: unknown): ReplyEnrichment | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const sentiment = VALID_SENTIMENTS.includes(obj.sentiment as EnrichmentSentiment)
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
    typeof obj.emotional_state === "string" ? obj.emotional_state.slice(0, 64) : "neutral";

  const ackRaw = obj.acknowledgement;
  const acknowledgement =
    typeof ackRaw === "string" && ackRaw.trim().length > 0 ? ackRaw.trim().slice(0, 160) : null;

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
  };
}

/**
 * Classify an inbound reply and (when substantive) generate a brief acknowledgement.
 * Returns null on timeout, malformed output, or any API failure — callers should
 * fall back to the soft-ack library in that case.
 */
export async function enrichInboundReply(replyText: string): Promise<ReplyEnrichment | null> {
  try {
    const anthropic = getClient();

    const call = anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: ENRICH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: replyText }],
    });

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), ENRICH_TIMEOUT_MS)
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
