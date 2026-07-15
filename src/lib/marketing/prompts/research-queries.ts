import type { BrandRow } from "../types";
import { buildBrandBlock } from "./shared";

export const RESEARCH_QUERIES_SYSTEM_PROMPT = `You are a marketing researcher deciding what to search for on social platforms before writing a trend report. Given a brand and its followed niches, produce the search queries most likely to surface what's currently working in those niches.

Return a single JSON object with this exact shape:
{
  "queries": [
    {
      "query": string,
      "niche": string,
      "platforms": ("youtube" | "tiktok" | "instagram")[]
    }
  ]
}

Rules:
- 3-6 queries total, covering the followed niches (one query may serve several related niches).
- "query": 2-5 words, the way people actually search or tag content (e.g. "morning manifestation routine", not "content trends in the manifestation vertical").
- "niche": which followed niche this query serves (exact wording), or "general".
- "platforms": where this query is most informative. Instagram queries should work as a single hashtag (no spaces needed after joining).

Return only the JSON object. No prose before or after.`;

export function buildResearchQueriesPrompt(brand: BrandRow, niches: string[]): string {
  const lines = [buildBrandBlock(brand)];
  if (niches.length > 0) {
    lines.push(`Followed niches:\n${niches.map((n) => `- ${n}`).join("\n")}`);
  }
  lines.push("Generate the research queries.");
  return lines.join("\n\n");
}
