import { describe, it, expect } from "vitest";
import { buildRevealContent, buildWelcomeArchetypeLine } from "../content";
import type { PersonaProfile } from "../types";

function profile(overrides: Partial<PersonaProfile> = {}): PersonaProfile {
  return {
    archetype: "visionary",
    motivation_orientation: "toward",
    change_style: "dreamer",
    primary_distortion: "all_or_nothing",
    secondary_distortion: null,
    distortion_scores: { all_or_nothing: 4 },
    core_values: ["freedom", "creativity", "peace"],
    tone_preference: "socratic",
    intention_category: "creative",
    ...overrides,
  };
}

describe("buildRevealContent — archetype section", () => {
  it("names the archetype", () => {
    const content = buildRevealContent(profile({ archetype: "phoenix" }), {
      name: "Sam",
    });
    expect(content.archetype.name).toBe("The Phoenix");
  });

  it("weaves the user's name and a top value into the paragraph", () => {
    const content = buildRevealContent(
      profile({ core_values: ["freedom", "growth", "peace"] }),
      { name: "Maya" }
    );
    expect(content.archetype.paragraph).toContain("Maya");
    expect(content.archetype.paragraph.toLowerCase()).toContain("freedom");
  });
});

describe("buildRevealContent — inner critic section", () => {
  it("renders the friendly-named pattern with its one-liner and response", () => {
    const content = buildRevealContent(profile({ primary_distortion: "worthiness" }), {
      name: "Sam",
    });
    expect(content.innerCritic).not.toBeNull();
    expect(content.innerCritic?.name).toBe("The Imposter Whisper");
    expect(content.innerCritic?.oneLiner.length).toBeGreaterThan(0);
    expect(content.innerCritic?.howWeRespond.length).toBeGreaterThan(0);
  });

  it("omits the inner-critic section when there is no pattern", () => {
    const content = buildRevealContent(
      profile({ primary_distortion: null, distortion_scores: {} }),
      { name: "Sam" }
    );
    expect(content.innerCritic).toBeNull();
  });
});

describe("buildRevealContent — how it works", () => {
  it("reflects the user's tone preference and returns three lines", () => {
    const content = buildRevealContent(profile({ tone_preference: "celebratory" }), {
      name: "Sam",
    });
    expect(content.howItWorks).toHaveLength(3);
    expect(content.howItWorks.join(" ").toLowerCase()).toContain("celebrat");
  });
});

describe("buildWelcomeArchetypeLine", () => {
  it("references the archetype by name", () => {
    expect(buildWelcomeArchetypeLine(profile({ archetype: "alchemist" }))).toContain(
      "Alchemist"
    );
  });
});
