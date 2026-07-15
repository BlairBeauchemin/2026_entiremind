import type { BrandRow } from "../types";
import { VIDEO_STYLES } from "../video-styles";
import { buildBrandBlock } from "./shared";

const MAX_PREVIOUS_INSIGHTS = 8;
const MAX_PREVIOUS_JSON_CHARS = 6000;

export const TREND_RESEARCH_SYSTEM_PROMPT = `You are a marketing trend researcher. Given a brand and the niches it follows, surface the content trends, hooks, and angles most likely to perform for it right now on Meta, Instagram, TikTok, and YouTube.

Important honesty constraint: when the request includes REAL in-platform research results, ground your insights in them and cite them. Beyond those findings you do not have live data — draw on durable patterns in the brand's niches and platform culture, and never fabricate specific numbers, dates, or "currently viral" claims.

Return a single JSON object with this exact shape:
{
  "summary": string,
  "delta_summary": string,
  "insights": [
    {
      "trend": string,
      "niche": string,
      "momentum": "new" | "rising" | "steady" | "fading",
      "relevance": string,
      "suggested_angle": string,
      "hooks": string[],
      "formats": string[],
      "suggested_video_styles": string[]
    }
  ]
}

Field guidance:
- "summary": 2-4 sentences on the current content landscape for these niches.
- "delta_summary": 1-3 sentences on what changed since the previous snapshot (which trends gained or lost steam). If no previous snapshot is provided, return exactly "First snapshot — no prior data."
- "insights": 5-8 items, covering every followed niche at least once when possible.
- "niche": which followed niche this insight belongs to (use the niche's exact wording), or "general".
- "momentum": relative to the previous snapshot when provided — "new" (absent before), "rising", "steady", or "fading". With no previous snapshot, use "new" for everything.
- "trend": short name of the trend or content pattern. When a trend continues from the previous snapshot, reuse its exact previous name so continuity is trackable.
- "relevance": one sentence on why it fits this brand and audience.
- "suggested_angle": a testable creative angle derived from the trend.
- "hooks": 2-3 opening lines/hooks in the brand voice.
- "formats": which formats fit best (e.g. "reel", "image_ad", "carousel_ad", "short").
- "suggested_video_styles": 1-3 values from: ${VIDEO_STYLES.join(", ")}. Empty array if no video format fits.

Return only the JSON object. No prose before or after.`;

export interface TrendResearchPromptOptions {
  niches: string[];
  previousSnapshot: {
    createdAt: string;
    insights: Array<Record<string, unknown>>;
  } | null;
  /** Compact rendering of real in-platform research results. */
  platformFindings?: string | null;
}

export function buildTrendResearchPrompt(
  brand: BrandRow,
  extraContext: string | null,
  opts: TrendResearchPromptOptions,
): string {
  const lines = [buildBrandBlock(brand)];

  if (opts.niches.length > 0) {
    lines.push(
      `Followed niches (report findings per niche):\n${opts.niches.map((n) => `- ${n}`).join("\n")}`,
    );
  }

  if (opts.previousSnapshot) {
    const trimmed = opts.previousSnapshot.insights.slice(0, MAX_PREVIOUS_INSIGHTS);
    let json = JSON.stringify(trimmed);
    if (json.length > MAX_PREVIOUS_JSON_CHARS) {
      json = json.slice(0, MAX_PREVIOUS_JSON_CHARS) + "…";
    }
    const date = opts.previousSnapshot.createdAt.slice(0, 10);
    lines.push(
      `Previous snapshot (${date}) insights:\n${json}\n\nLabel each new insight's momentum relative to this previous snapshot. Trends absent from it are "new"; reuse exact trend names for continuing trends.`,
    );
  }

  if (opts.platformFindings) {
    lines.push(
      `REAL in-platform research results (fetched just now):\n${opts.platformFindings}\n\nGround your insights in these real findings wherever possible — name the platform and what the finding shows in "relevance". Only fall back to general knowledge for niches with no findings.`,
    );
  }

  if (extraContext) {
    lines.push(`Additional signals from other sources:\n${extraContext}`);
  }

  lines.push(`Today's date: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("Research content trends for this brand.");
  return lines.join("\n\n");
}
