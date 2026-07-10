import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "../supabase";
import {
  WEEKLY_EDITION_SYSTEM_PROMPT,
  buildWeeklyEditionPrompt,
} from "../ai/prompts/weekly-edition";
import { QUOTE_THEMES, type Quote, type QuoteTheme } from "../quotes/types";
import {
  renderWeeklyEditionHtml,
  renderWeeklyEditionPlainText,
  type WeeklyEditionContent,
} from "../email-campaigns/template";
import { getEmailCampaignAdapter } from "../email-campaigns";

const THEME_LOOKBACK_EDITIONS = 8;
const QUOTES_PER_EDITION = 3;

export interface EditionQuoteRef {
  quote_id: string;
  text: string;
  author: string;
}

export interface EditionContent extends WeeklyEditionContent {
  quotes: EditionQuoteRef[];
}

/** Monday of the current ISO week, as YYYY-MM-DD */
export function currentWeekStart(from: Date = new Date()): string {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

interface PastEditionRow {
  theme: string;
  content: { quotes?: Array<{ quote_id?: string }> } | null;
}

/**
 * Pick this week's theme: the one least recently used across recent editions
 * (unused themes first, in QUOTE_THEMES order).
 */
function pickTheme(pastEditions: PastEditionRow[]): QuoteTheme {
  // pastEditions is ordered most-recent-first; the further down a theme's
  // first appearance, the longer since it was used.
  const lastUsedIndex = new Map<QuoteTheme, number>();
  pastEditions.forEach((edition, index) => {
    const theme = edition.theme as QuoteTheme;
    if (!lastUsedIndex.has(theme)) {
      lastUsedIndex.set(theme, index);
    }
  });

  const unused = QUOTE_THEMES.filter((t) => !lastUsedIndex.has(t));
  if (unused.length > 0) {
    return unused[0];
  }

  return [...QUOTE_THEMES].sort(
    (a, b) =>
      (lastUsedIndex.get(b) ?? Infinity) - (lastUsedIndex.get(a) ?? Infinity),
  )[0];
}

export interface GenerateEditionResult {
  status: "created" | "skipped" | "failed";
  editionId?: string;
  detail?: string;
}

/**
 * Generate this week's edition draft: rotate theme, pick 3 quotes not used
 * in recent editions, draft copy via the AI provider, insert as status
 * 'draft'. Skips if an edition already exists for this week.
 */
export async function generateEditionDraft(): Promise<GenerateEditionResult> {
  const supabase = createServiceRoleClient();
  const weekStart = currentWeekStart();

  const { data: existing } = await supabase
    .from("weekly_editions")
    .select("id, status")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) {
    return {
      status: "skipped",
      editionId: existing.id,
      detail: `Edition for ${weekStart} already exists (${existing.status})`,
    };
  }

  const { data: pastEditions } = await supabase
    .from("weekly_editions")
    .select("theme, content")
    .order("week_start", { ascending: false })
    .limit(THEME_LOOKBACK_EDITIONS);

  const theme = pickTheme((pastEditions ?? []) as PastEditionRow[]);

  const recentQuoteIds = new Set<string>();
  for (const edition of (pastEditions ?? []) as PastEditionRow[]) {
    for (const q of edition.content?.quotes ?? []) {
      if (q.quote_id) recentQuoteIds.add(q.quote_id);
    }
  }

  const { data: themeQuotes } = await supabase
    .from("quotes")
    .select("id, text, author, theme")
    .eq("active", true)
    .eq("theme", theme);

  const library = (themeQuotes ?? []) as Quote[];
  const fresh = library.filter((q) => !recentQuoteIds.has(q.id));
  const pool = fresh.length >= QUOTES_PER_EDITION ? fresh : library;

  if (pool.length < QUOTES_PER_EDITION) {
    return {
      status: "failed",
      detail: `Not enough active quotes for theme '${theme}' (have ${pool.length}, need ${QUOTES_PER_EDITION}). Run scripts/import-quotes.ts.`,
    };
  }

  // Random pick of 3
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, QUOTES_PER_EDITION);

  // Draft the copy. Direct Anthropic call (like memory compaction) — the
  // shared provider adapters cap max_tokens for SMS-length output.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { status: "failed", detail: "ANTHROPIC_API_KEY not set" };
  }
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_EDITION_MODEL || "claude-sonnet-4-6",
    max_tokens: 1000,
    system: WEEKLY_EDITION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildWeeklyEditionPrompt(theme, chosen) },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text" || !block.text) {
    return { status: "failed", detail: "Empty AI response for edition draft" };
  }
  const raw = block.text.trim();

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    return { status: "failed", detail: "AI response contained no JSON object" };
  }

  let parsed: {
    title?: string;
    intro?: string;
    reflection?: string;
    question?: string;
  };
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return { status: "failed", detail: "Failed to parse AI edition JSON" };
  }

  if (
    !parsed.title ||
    !parsed.intro ||
    !parsed.reflection ||
    !parsed.question
  ) {
    return {
      status: "failed",
      detail: "AI edition JSON missing required fields",
    };
  }

  const content: EditionContent = {
    title: parsed.title,
    intro: parsed.intro,
    reflection: parsed.reflection,
    question: parsed.question,
    quotes: chosen.map((q) => ({
      quote_id: q.id,
      text: q.text,
      author: q.author,
    })),
  };

  const { data: inserted, error } = await supabase
    .from("weekly_editions")
    .insert({ week_start: weekStart, theme, status: "draft", content })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      status: "failed",
      detail: `Failed to insert edition: ${error?.message ?? "unknown"}`,
    };
  }

  return { status: "created", editionId: inserted.id };
}

export interface PushEditionResult {
  status: "pushed" | "failed";
  campaignId?: string;
  detail?: string;
}

/**
 * Render the edition and create it as a draft campaign in the email
 * provider. The founder reviews, tweaks, and sends it from the provider UI.
 */
export async function pushEditionToProvider(
  editionId: string,
): Promise<PushEditionResult> {
  const supabase = createServiceRoleClient();

  const { data: edition } = await supabase
    .from("weekly_editions")
    .select("id, week_start, theme, status, content")
    .eq("id", editionId)
    .single();

  if (!edition) {
    return { status: "failed", detail: `Edition ${editionId} not found` };
  }
  if (edition.status === "pushed") {
    return { status: "pushed", detail: "Already pushed" };
  }

  const content = edition.content as EditionContent;
  const adapter = getEmailCampaignAdapter();

  const result = await adapter.createDraftCampaign({
    name: `Entiremind Weekly — ${edition.week_start}`,
    subject: content.title,
    html: renderWeeklyEditionHtml(content),
    plainText: renderWeeklyEditionPlainText(content),
  });

  if (!result.success) {
    await supabase
      .from("weekly_editions")
      .update({
        status: "failed",
        provider: adapter.provider,
        error: result.error,
      })
      .eq("id", editionId);
    return { status: "failed", detail: result.error };
  }

  await supabase
    .from("weekly_editions")
    .update({
      status: "pushed",
      provider: adapter.provider,
      provider_campaign_id: result.campaignId,
      error: null,
    })
    .eq("id", editionId);

  return { status: "pushed", campaignId: result.campaignId };
}
