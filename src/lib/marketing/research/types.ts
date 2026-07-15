/**
 * In-platform research tools the AI agents call during trend research.
 * Results are normalized so the synthesis prompt can mix platforms.
 */

export type ResearchPlatform = "youtube" | "tiktok" | "instagram";

export interface ResearchItem {
  platform: ResearchPlatform;
  /** Video title / caption excerpt / hashtag name. */
  title: string;
  description?: string;
  url?: string;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    posts?: number;
  };
  publishedAt?: string;
  raw?: unknown;
}

export interface ResearchToolAdapter {
  platform: ResearchPlatform;
  /** Whether real credentials are present in the environment. */
  isConfigured(): boolean;
  /** Keyword/hashtag search of recent popular content. */
  search(query: string, opts?: { limit?: number }): Promise<ResearchItem[]>;
  /** Currently trending content (optional per platform). */
  trending?(opts?: { limit?: number }): Promise<ResearchItem[]>;
}
