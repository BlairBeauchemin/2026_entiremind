import { describe, it, expect } from "vitest";
import { buildSeedMemoryFromOnboarding } from "./memory";
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
