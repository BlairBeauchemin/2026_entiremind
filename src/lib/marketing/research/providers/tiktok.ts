import type { ResearchItem, ResearchToolAdapter } from "../types";

/**
 * TikTok research via the TikTok Research API. Requires an approved
 * research application (TIKTOK_RESEARCH_TOKEN); until then this is a
 * PLACEHOLDER that logs the would-be query and returns [].
 */

const API_BASE = "https://open.tiktokapis.com/v2/research/video/query/";
const DEFAULT_LIMIT = 8;

function token(): string | undefined {
  return process.env.TIKTOK_RESEARCH_TOKEN;
}

interface TikTokVideo {
  id?: string;
  video_description?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  share_url?: string;
  create_time?: number;
}

export const tiktokResearch: ResearchToolAdapter = {
  platform: "tiktok",
  isConfigured: () => Boolean(token()),

  async search(query: string, opts?: { limit?: number }): Promise<ResearchItem[]> {
    const accessToken = token();
    const limit = opts?.limit ?? DEFAULT_LIMIT;

    const body = {
      query: {
        and: [{ operation: "IN", field_name: "keyword", field_values: [query] }],
      },
      max_count: limit,
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, ""),
      end_date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    };

    if (!accessToken) {
      // PLACEHOLDER: research app not approved yet — log the real request
      console.log(`[tiktok research placeholder] POST ${API_BASE}`, JSON.stringify(body));
      return [];
    }

    try {
      const response = await fetch(
        `${API_BASE}?fields=id,video_description,like_count,comment_count,view_count,share_url,create_time`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        console.error(`TikTok research API error (${response.status})`);
        return [];
      }
      const json = (await response.json()) as { data?: { videos?: TikTokVideo[] } };
      return (json.data?.videos ?? [])
        .filter((v) => v.video_description)
        .map((v) => ({
          platform: "tiktok" as const,
          title: v.video_description!.slice(0, 120),
          url: v.share_url,
          stats: { views: v.view_count, likes: v.like_count, comments: v.comment_count },
          publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : undefined,
        }));
    } catch (error) {
      console.error("TikTok research search failed:", error);
      return [];
    }
  },
};
