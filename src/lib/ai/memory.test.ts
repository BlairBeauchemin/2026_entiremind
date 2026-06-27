import { describe, it, expect } from "vitest";
import {
  buildSeedMemoryFromOnboarding,
  mergeProfileIntoMemory,
  type UserMemorySummary,
} from "./memory";
import type { PersonaProfile } from "../persona/types";

const PROFILE: PersonaProfile = {
  archetype: "visionary",
  motivation_orientation: "toward",
  change_style: "dreamer",
  primary_distortion: "all_or_nothing",
  secondary_distortion: null,
  distortion_scores: { all_or_nothing: 5 },
  core_values: ["freedom", "creativity", "peace"],
  tone_preference: "socratic",
  intention_category: "career",
};

describe("buildSeedMemoryFromOnboarding", () => {
  describe("without a profile (legacy callers)", () => {
    it("keeps the prior shape: obstacles + aligned-state tone notes", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: "a calm morning",
        obstacles: "fear of judgment",
        aligned_state: "on a long walk",
      });
      expect(seed.vision).toBe("a calm morning");
      expect(seed.obstacles).toBe("fear of judgment");
      expect(seed.tone_notes).toContain("on a long walk");
    });
  });

  describe("with a profile", () => {
    it("composes tone_notes from tone preference and aligned-state", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: "a calm morning",
        obstacles: null,
        aligned_state: "on a long walk",
        profile: PROFILE,
      });
      expect(seed.tone_notes?.toLowerCase()).toContain(
        "questions that make them think",
      );
      expect(seed.tone_notes).toContain("on a long walk");
    });

    it("composes tone_notes from tone preference alone when aligned-state is skipped", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: null,
        obstacles: null,
        aligned_state: null,
        profile: PROFILE,
      });
      expect(seed.tone_notes?.toLowerCase()).toContain(
        "questions that make them think",
      );
    });

    it("seeds obstacles from the inner-critic pattern", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: null,
        obstacles: null,
        aligned_state: null,
        profile: PROFILE,
      });
      expect(seed.obstacles?.toLowerCase()).toContain("all-or-nothing");
      expect(seed.obstacles).not.toContain("all_or_nothing");
    });

    it("leaves obstacles null when no inner-critic pattern surfaced", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: null,
        obstacles: null,
        aligned_state: null,
        profile: { ...PROFILE, primary_distortion: null },
      });
      expect(seed.obstacles).toBeNull();
    });

    it("seeds a theme from the intention category", () => {
      const seed = buildSeedMemoryFromOnboarding({
        intention: "launch my studio",
        vision: null,
        obstacles: null,
        aligned_state: null,
        profile: PROFILE,
      });
      expect(seed.themes).toContain("career");
    });
  });
});

const EXISTING_MEMORY: UserMemorySummary = {
  themes: ["working toward: launch my studio", "creative"],
  vision: "a calm morning",
  obstacles: "fear of judgment",
  recent_emotional_state: "hopeful but tired",
  open_threads: ["mentioned a deadline next week"],
  last_breakthrough: "shipped the landing page",
  tone_notes: "feels most themselves when: on a long walk",
};

describe("mergeProfileIntoMemory", () => {
  it("preserves compacted history untouched", () => {
    const merged = mergeProfileIntoMemory(EXISTING_MEMORY, PROFILE);
    expect(merged.themes).toEqual(EXISTING_MEMORY.themes);
    expect(merged.vision).toBe(EXISTING_MEMORY.vision);
    expect(merged.open_threads).toEqual(EXISTING_MEMORY.open_threads);
    expect(merged.last_breakthrough).toBe(EXISTING_MEMORY.last_breakthrough);
    expect(merged.recent_emotional_state).toBe(
      EXISTING_MEMORY.recent_emotional_state,
    );
  });

  it("refreshes obstacles from the inner-critic pattern", () => {
    const merged = mergeProfileIntoMemory(EXISTING_MEMORY, PROFILE);
    expect(merged.obstacles?.toLowerCase()).toContain("all-or-nothing");
  });

  it("keeps existing obstacles when the profile has no pattern", () => {
    const merged = mergeProfileIntoMemory(EXISTING_MEMORY, {
      ...PROFILE,
      primary_distortion: null,
    });
    expect(merged.obstacles).toBe("fear of judgment");
  });

  it("adds the tone preference while preserving existing tone context", () => {
    const merged = mergeProfileIntoMemory(EXISTING_MEMORY, PROFILE);
    expect(merged.tone_notes?.toLowerCase()).toContain(
      "questions that make them think",
    );
    expect(merged.tone_notes).toContain("on a long walk");
  });

  it("is idempotent — repeated merges do not stack 'prefers' clauses", () => {
    const once = mergeProfileIntoMemory(EXISTING_MEMORY, PROFILE);
    const twice = mergeProfileIntoMemory(once, {
      ...PROFILE,
      tone_preference: "gentle",
    });
    const prefersCount = (twice.tone_notes?.match(/prefers/gi) ?? []).length;
    expect(prefersCount).toBe(1);
    expect(twice.tone_notes).toContain("on a long walk");
  });

  it("sets tone_notes to the preference alone when there was none", () => {
    const merged = mergeProfileIntoMemory(
      { ...EXISTING_MEMORY, tone_notes: null },
      PROFILE,
    );
    expect(merged.tone_notes?.toLowerCase()).toContain(
      "questions that make them think",
    );
  });
});
