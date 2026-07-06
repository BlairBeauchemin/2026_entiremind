/**
 * Curated quote library types
 */

export const QUOTE_THEMES = [
  "abundance",
  "confidence",
  "trusting-the-process",
  "gratitude",
  "resilience",
  "love",
  "purpose",
  "presence",
] as const;

export type QuoteTheme = (typeof QUOTE_THEMES)[number];

export interface Quote {
  id: string;
  text: string;
  author: string;
  theme: QuoteTheme;
}
