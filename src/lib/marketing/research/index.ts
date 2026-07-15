import type { ResearchItem, ResearchPlatform, ResearchToolAdapter } from "./types";
import { youtubeResearch } from "./providers/youtube";
import { tiktokResearch } from "./providers/tiktok";
import { instagramResearch } from "./providers/instagram";

export type { ResearchItem, ResearchPlatform, ResearchToolAdapter } from "./types";

const ALL_TOOLS: ResearchToolAdapter[] = [youtubeResearch, tiktokResearch, instagramResearch];

export function getConfiguredResearchTools(): ResearchToolAdapter[] {
  return ALL_TOOLS.filter((tool) => tool.isConfigured());
}

export function getResearchTool(platform: ResearchPlatform): ResearchToolAdapter | undefined {
  return ALL_TOOLS.find((tool) => tool.platform === platform);
}

/** Dedupe by url (or platform+title fallback), preserving first occurrence. */
export function dedupeResearchItems(items: ResearchItem[], cap: number): ResearchItem[] {
  const seen = new Set<string>();
  const result: ResearchItem[] = [];
  for (const item of items) {
    const key = item.url ?? `${item.platform}:${item.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= cap) break;
  }
  return result;
}

export interface ResearchQuery {
  query: string;
  niche: string;
  platforms: ResearchPlatform[];
}

const MAX_TOTAL_ITEMS = 40;
const PER_QUERY_LIMIT = 6;

/**
 * Execute AI-generated research queries across the configured platform
 * tools, plus one trending() pull per configured tool. Unconfigured tools
 * are skipped silently (their placeholder logging happens in the adapter).
 */
export async function executeResearchQueries(
  queries: ResearchQuery[],
): Promise<ResearchItem[]> {
  const configured = getConfiguredResearchTools();
  if (configured.length === 0) return [];

  const items: ResearchItem[] = [];

  for (const query of queries) {
    for (const tool of configured) {
      if (!query.platforms.includes(tool.platform)) continue;
      try {
        items.push(...(await tool.search(query.query, { limit: PER_QUERY_LIMIT })));
      } catch (error) {
        console.error(`Research search failed (${tool.platform}: ${query.query}):`, error);
      }
    }
  }

  for (const tool of configured) {
    if (!tool.trending) continue;
    try {
      items.push(...(await tool.trending({ limit: PER_QUERY_LIMIT })));
    } catch (error) {
      console.error(`Research trending failed (${tool.platform}):`, error);
    }
  }

  return dedupeResearchItems(items, MAX_TOTAL_ITEMS);
}

/** Compact single-line rendering for the synthesis prompt. */
export function renderResearchItems(items: ResearchItem[]): string {
  return items
    .map((item) => {
      const stats: string[] = [];
      if (item.stats?.views) stats.push(`${formatCount(item.stats.views)} views`);
      if (item.stats?.likes) stats.push(`${formatCount(item.stats.likes)} likes`);
      if (item.stats?.comments) stats.push(`${formatCount(item.stats.comments)} comments`);
      return `[${item.platform}] "${item.title}"${stats.length ? ` — ${stats.join(", ")}` : ""}`;
    })
    .join("\n");
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
