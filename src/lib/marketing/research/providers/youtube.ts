import type { ResearchItem, ResearchToolAdapter } from "../types";

/**
 * REAL: YouTube Data API v3 research. Needs only a free API key
 * (YOUTUBE_API_KEY) — no OAuth, no app review. Covers YouTube + Shorts.
 * Failures log and return [] so a cron run never dies on a research call.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";
const DEFAULT_LIMIT = 8;
const LOOKBACK_DAYS = 30;

function apiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY;
}

interface SearchItem {
  id?: { videoId?: string };
}

interface VideoItem {
  id?: string;
  snippet?: { title?: string; description?: string; publishedAt?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
}

function mapVideos(items: VideoItem[]): ResearchItem[] {
  return items
    .filter((v) => v.id && v.snippet?.title)
    .map((v) => ({
      platform: "youtube" as const,
      title: v.snippet!.title!,
      description: v.snippet?.description?.slice(0, 200),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      stats: {
        views: v.statistics?.viewCount ? Number(v.statistics.viewCount) : undefined,
        likes: v.statistics?.likeCount ? Number(v.statistics.likeCount) : undefined,
        comments: v.statistics?.commentCount ? Number(v.statistics.commentCount) : undefined,
      },
      publishedAt: v.snippet?.publishedAt,
    }));
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`YouTube research API error (${response.status}): ${await response.text().catch(() => "")}`);
    return null;
  }
  return (await response.json()) as Record<string, unknown>;
}

/** Fetch statistics for a set of video ids. Exported for testing. */
export function buildVideosUrl(ids: string[], key: string): string {
  return `${API_BASE}/videos?part=snippet,statistics&id=${ids.join(",")}&key=${key}`;
}

export const youtubeResearch: ResearchToolAdapter = {
  platform: "youtube",
  isConfigured: () => Boolean(apiKey()),

  async search(query: string, opts?: { limit?: number }): Promise<ResearchItem[]> {
    const key = apiKey();
    if (!key) return [];
    const limit = opts?.limit ?? DEFAULT_LIMIT;

    try {
      const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const searchJson = await fetchJson(
        `${API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=${limit}&publishedAfter=${publishedAfter}&key=${key}`,
      );
      if (!searchJson) return [];

      const ids = ((searchJson.items as SearchItem[] | undefined) ?? [])
        .map((i) => i.id?.videoId)
        .filter((id): id is string => Boolean(id));
      if (ids.length === 0) return [];

      const videosJson = await fetchJson(buildVideosUrl(ids, key));
      if (!videosJson) return [];

      return mapVideos((videosJson.items as VideoItem[] | undefined) ?? []);
    } catch (error) {
      console.error("YouTube research search failed:", error);
      return [];
    }
  },

  async trending(opts?: { limit?: number }): Promise<ResearchItem[]> {
    const key = apiKey();
    if (!key) return [];
    const limit = opts?.limit ?? DEFAULT_LIMIT;

    try {
      const json = await fetchJson(
        `${API_BASE}/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=${limit}&key=${key}`,
      );
      if (!json) return [];
      return mapVideos((json.items as VideoItem[] | undefined) ?? []);
    } catch (error) {
      console.error("YouTube research trending failed:", error);
      return [];
    }
  },
};

export { mapVideos as mapYoutubeVideos };
