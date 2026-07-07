import { describe, it, expect } from "vitest";
import { filterEligible, scoreTechnique } from "./index";
import type { Technique } from "./types";

const technique = (overrides: Partial<Technique> = {}): Technique => ({
  id: "t1",
  name: "Test",
  principle: "p",
  prompt_recipe: "r",
  content_types: [],
  target_distortions: [],
  target_sentiments: [],
  tone_compatibility: [],
  intention_categories: [],
  gentle: false,
  priority: 0,
  source_title: null,
  source_author: null,
  status: "active",
  ...overrides,
});

const noJitter = { random: () => 0 };

describe("filterEligible", () => {
  const base = {
    contentType: "reflection" as const,
    tonePreference: "gentle" as const,
    isFragile: false,
    recentTechniqueIds: new Set<string>(),
  };

  it("excludes techniques that cannot ride the content type", () => {
    const t = technique({ content_types: ["gratitude"] });
    expect(filterEligible([t], base)).toHaveLength(0);
  });

  it("allows techniques with no content-type restriction", () => {
    const t = technique({ content_types: [] });
    expect(filterEligible([t], base)).toHaveLength(1);
  });

  it("restricts to gentle techniques when the user is fragile", () => {
    const harsh = technique({ id: "h", gentle: false });
    const soft = technique({ id: "s", gentle: true });
    const result = filterEligible([harsh, soft], { ...base, isFragile: true });
    expect(result.map((t) => t.id)).toEqual(["s"]);
  });

  it("excludes tone-incompatible techniques when the user has a preference", () => {
    const t = technique({ tone_compatibility: ["direct"] });
    expect(filterEligible([t], base)).toHaveLength(0);
  });

  it("keeps tone-restricted techniques when the user has no tone preference", () => {
    const t = technique({ tone_compatibility: ["direct"] });
    expect(filterEligible([t], { ...base, tonePreference: null })).toHaveLength(
      1,
    );
  });

  it("excludes recently sent techniques", () => {
    const t = technique({ id: "used" });
    expect(
      filterEligible([t], {
        ...base,
        recentTechniqueIds: new Set(["used"]),
      }),
    ).toHaveLength(0);
  });
});

describe("scoreTechnique", () => {
  const base = {
    distortions: ["catastrophizing" as const],
    sentiment: "neutral" as const,
    intentionCategory: "career" as const,
    ...noJitter,
  };

  it("gives distortion match the dominant weight", () => {
    const matched = technique({ target_distortions: ["catastrophizing"] });
    const unmatched = technique({ target_distortions: ["personalization"] });
    // matched: +3 distortion +2 sentiment(empty) +1 category(empty) = 6
    // unmatched: +2 +1 = 3
    expect(scoreTechnique(matched, base)).toBeGreaterThan(
      scoreTechnique(unmatched, base),
    );
  });

  it("adds the founder priority boost", () => {
    const plain = technique({ priority: 0 });
    const boosted = technique({ priority: 5 });
    expect(scoreTechnique(boosted, base) - scoreTechnique(plain, base)).toBe(5);
  });

  it("rewards a matching target sentiment", () => {
    const fits = technique({ target_sentiments: ["neutral"] });
    const misses = technique({ target_sentiments: ["positive"] });
    expect(scoreTechnique(fits, base)).toBeGreaterThan(
      scoreTechnique(misses, base),
    );
  });

  it("rewards a matching intention category", () => {
    const fits = technique({ intention_categories: ["career"] });
    const misses = technique({ intention_categories: ["health"] });
    expect(scoreTechnique(fits, base)).toBeGreaterThan(
      scoreTechnique(misses, base),
    );
  });

  it("treats empty sentiment/category as universally fitting", () => {
    const universal = technique({
      target_sentiments: [],
      intention_categories: [],
    });
    // +2 sentiment +1 category, no distortion match = 3
    expect(scoreTechnique(universal, base)).toBe(3);
  });
});
