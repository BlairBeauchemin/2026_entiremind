import { describe, it, expect } from "vitest";
import { dedupeResearchItems, renderResearchItems } from "./index";
import { mapYoutubeVideos } from "./providers/youtube";
import { ResearchQueriesSchema } from "../pipeline/schemas";
import type { ResearchItem } from "./types";

function item(overrides: Partial<ResearchItem>): ResearchItem {
  return { platform: "youtube", title: "A video", ...overrides };
}

describe("dedupeResearchItems", () => {
  it("dedupes by url and caps the total", () => {
    const items = [
      item({ url: "https://a", title: "First" }),
      item({ url: "https://a", title: "Duplicate url" }),
      item({ url: "https://b", title: "Second" }),
      item({ url: "https://c", title: "Third" }),
    ];
    const result = dedupeResearchItems(items, 2);
    expect(result.map((i) => i.title)).toEqual(["First", "Second"]);
  });

  it("falls back to platform+title when there is no url", () => {
    const items = [
      item({ title: "Same Title " }),
      item({ title: "same title" }),
      item({ platform: "tiktok", title: "same title" }),
    ];
    expect(dedupeResearchItems(items, 10)).toHaveLength(2);
  });
});

describe("renderResearchItems", () => {
  it("renders compact lines with formatted stats", () => {
    const rendered = renderResearchItems([
      item({ title: "Morning routine", stats: { views: 1_200_000, likes: 4500 } }),
      item({ platform: "instagram", title: "manifestation post", stats: { likes: 320 } }),
    ]);
    expect(rendered).toContain('[youtube] "Morning routine" — 1.2M views, 4.5K likes');
    expect(rendered).toContain('[instagram] "manifestation post" — 320 likes');
  });
});

describe("mapYoutubeVideos", () => {
  it("maps API video items to ResearchItems", () => {
    const mapped = mapYoutubeVideos([
      {
        id: "abc123",
        snippet: {
          title: "5AM manifestation routine",
          description: "How I start my day",
          publishedAt: "2026-07-01T00:00:00Z",
        },
        statistics: { viewCount: "150000", likeCount: "9000", commentCount: "300" },
      },
      { id: undefined, snippet: { title: "no id — dropped" } },
    ]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      platform: "youtube",
      title: "5AM manifestation routine",
      url: "https://www.youtube.com/watch?v=abc123",
      stats: { views: 150000, likes: 9000, comments: 300 },
    });
  });
});

describe("ResearchQueriesSchema", () => {
  it("accepts well-formed queries", () => {
    const result = ResearchQueriesSchema.safeParse({
      queries: [
        { query: "morning manifestation routine", niche: "manifestation", platforms: ["youtube", "tiktok"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects queries with no platforms", () => {
    const result = ResearchQueriesSchema.safeParse({
      queries: [{ query: "x", niche: "general", platforms: [] }],
    });
    expect(result.success).toBe(false);
  });
});
