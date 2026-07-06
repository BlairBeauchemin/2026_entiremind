import { createServiceRoleClient } from "../supabase";
import type { Quote, QuoteTheme } from "./types";
import type { IntentionCategory } from "../persona/types";

export { QUOTE_THEMES } from "./types";
export type { Quote, QuoteTheme } from "./types";

const RECENT_QUOTE_EXCLUSION_COUNT = 20;
const SMS_MAX_LENGTH = 160;

/**
 * Format a quote for SMS: "text" — Author
 * Guards against oversized quotes (the library targets <= 120 char texts,
 * so truncation should never fire in practice).
 */
export function formatQuoteSms(quote: Quote): string {
  const formatted = `"${quote.text}" — ${quote.author}`;
  if (formatted.length <= SMS_MAX_LENGTH) {
    return formatted;
  }
  const room = SMS_MAX_LENGTH - quote.author.length - 8; // quotes, dash, ellipsis
  return `"${quote.text.substring(0, room)}..." — ${quote.author}`;
}

/**
 * Map a persona intention category to the quote themes that fit it best.
 * Empty result means no preference — pick from the whole library.
 */
export function mapCategoryToQuoteThemes(
  category: IntentionCategory | string | null | undefined,
): QuoteTheme[] {
  switch (category) {
    case "money":
      return ["abundance"];
    case "career":
      return ["purpose", "confidence"];
    case "relationships":
    case "family":
      return ["love"];
    case "health":
      return ["resilience", "presence"];
    case "identity":
      return ["confidence"];
    case "spiritual":
      return ["trusting-the-process", "presence"];
    case "creative":
      return ["purpose", "confidence"];
    default:
      return [];
  }
}

/**
 * Pick a library quote for a user's daily 'quote' SMS.
 * Prefers quotes matching the user's intention themes and excludes the
 * user's most recently sent quotes to avoid repetition.
 * Returns null when the library is empty (caller falls back to AI generation).
 */
export async function pickQuoteForUser(
  userId: string,
  preferredThemes: QuoteTheme[],
): Promise<Quote | null> {
  const supabase = createServiceRoleClient();

  const { data: library } = await supabase
    .from("quotes")
    .select("id, text, author, theme")
    .eq("active", true);

  if (!library || library.length === 0) {
    return null;
  }

  const { data: recentSends } = await supabase
    .from("messages")
    .select("quote_id")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .eq("content_type", "quote")
    .not("quote_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECENT_QUOTE_EXCLUSION_COUNT);

  const recentIds = new Set((recentSends ?? []).map((r) => r.quote_id));
  const quotes = library as Quote[];

  const fresh = quotes.filter((q) => !recentIds.has(q.id));
  const pool = fresh.length > 0 ? fresh : quotes;

  const themed =
    preferredThemes.length > 0
      ? pool.filter((q) => preferredThemes.includes(q.theme))
      : [];
  const candidates = themed.length > 0 ? themed : pool;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Deterministically pick a quote from a pre-fetched library — same result
 * for the same seed key (e.g. userId + date), so the dashboard card is
 * stable across refreshes but rotates daily.
 */
export function pickDeterministicQuote(
  quotes: Quote[],
  seedKey: string,
  preferredThemes: QuoteTheme[],
): Quote | null {
  if (quotes.length === 0) {
    return null;
  }

  const themed =
    preferredThemes.length > 0
      ? quotes.filter((q) => preferredThemes.includes(q.theme))
      : [];
  const candidates = themed.length > 0 ? themed : quotes;

  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) | 0;
  }

  return candidates[Math.abs(hash) % candidates.length];
}
