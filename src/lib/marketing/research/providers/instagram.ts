import type { ResearchItem, ResearchToolAdapter } from "../types";

/**
 * Instagram/Reels research via Graph API hashtag search: ig_hashtag_search
 * -> /{hashtag-id}/top_media. Requires META_ACCESS_TOKEN +
 * META_IG_BUSINESS_ID (same credentials as IG publishing); until then this
 * is a PLACEHOLDER that logs the would-be query and returns [].
 */

const DEFAULT_LIMIT = 8;

function graphBase(): string {
  return `https://graph.facebook.com/${process.env.META_API_VERSION || "v21.0"}`;
}

function creds(): { token?: string; igUserId?: string } {
  return {
    token: process.env.META_ACCESS_TOKEN,
    igUserId: process.env.META_IG_BUSINESS_ID,
  };
}

interface IgMedia {
  id?: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
  timestamp?: string;
}

export const instagramResearch: ResearchToolAdapter = {
  platform: "instagram",
  isConfigured: () => {
    const { token, igUserId } = creds();
    return Boolean(token && igUserId);
  },

  async search(query: string, opts?: { limit?: number }): Promise<ResearchItem[]> {
    const { token, igUserId } = creds();
    const limit = opts?.limit ?? DEFAULT_LIMIT;
    const hashtag = query.replace(/\s+/g, "").toLowerCase();

    if (!token || !igUserId) {
      // PLACEHOLDER: Meta credentials not wired — log the real request chain
      console.log(
        `[instagram research placeholder] GET ${graphBase()}/ig_hashtag_search?user_id=${igUserId ?? "IG_USER_ID"}&q=${hashtag} -> /{hashtag-id}/top_media`,
      );
      return [];
    }

    try {
      const searchRes = await fetch(
        `${graphBase()}/ig_hashtag_search?user_id=${igUserId}&q=${encodeURIComponent(hashtag)}&access_token=${token}`,
      );
      if (!searchRes.ok) {
        console.error(`Instagram hashtag search error (${searchRes.status})`);
        return [];
      }
      const searchJson = (await searchRes.json()) as { data?: Array<{ id: string }> };
      const hashtagId = searchJson.data?.[0]?.id;
      if (!hashtagId) return [];

      const mediaRes = await fetch(
        `${graphBase()}/${hashtagId}/top_media?user_id=${igUserId}&fields=id,caption,like_count,comments_count,permalink,timestamp&limit=${limit}&access_token=${token}`,
      );
      if (!mediaRes.ok) {
        console.error(`Instagram top_media error (${mediaRes.status})`);
        return [];
      }
      const mediaJson = (await mediaRes.json()) as { data?: IgMedia[] };

      return (mediaJson.data ?? [])
        .filter((m) => m.caption)
        .map((m) => ({
          platform: "instagram" as const,
          title: m.caption!.slice(0, 120),
          url: m.permalink,
          stats: { likes: m.like_count, comments: m.comments_count },
          publishedAt: m.timestamp,
        }));
    } catch (error) {
      console.error("Instagram research search failed:", error);
      return [];
    }
  },
};
