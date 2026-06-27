import { describe, it, expect } from "vitest";
import { renderProfileForPrompt } from "../prompt";
import type { PersonaProfile } from "../types";

function profile(overrides: Partial<PersonaProfile> = {}): PersonaProfile {
  return {
    archetype: "visionary",
    motivation_orientation: "toward",
    change_style: "dreamer",
    primary_distortion: "all_or_nothing",
    secondary_distortion: null,
    distortion_scores: { all_or_nothing: 5 },
    core_values: ["freedom", "creativity", "peace"],
    tone_preference: "socratic",
    intention_category: "career",
    ...overrides,
  };
}

describe("renderProfileForPrompt", () => {
  it("opens with an 'About this user' header", () => {
    expect(renderProfileForPrompt(profile())).toMatch(/^About this user:/);
  });

  it("names the archetype", () => {
    expect(renderProfileForPrompt(profile())).toContain("The Visionary");
  });

  it("frames forward for a 'toward' orientation", () => {
    const block = renderProfileForPrompt(
      profile({ motivation_orientation: "toward" }),
    );
    expect(block.toLowerCase()).toContain("frame forward");
  });

  it("honors the leaving for an 'away' orientation", () => {
    const block = renderProfileForPrompt(
      profile({ motivation_orientation: "away", archetype: "seeker" }),
    );
    expect(block.toLowerCase()).toContain("forward");
    expect(block.toLowerCase()).toMatch(/leav/);
  });

  it("signals 'honor the effort' for a doer", () => {
    const block = renderProfileForPrompt(
      profile({ change_style: "doer", archetype: "alchemist" }),
    );
    expect(block.toLowerCase()).toContain("effort");
  });

  it("describes the inner-critic pattern with anti-clinical guidance", () => {
    const block = renderProfileForPrompt(
      profile({ primary_distortion: "all_or_nothing" }),
    );
    expect(block.toLowerCase()).toContain("all-or-nothing");
    expect(block.toLowerCase()).toContain("never name it clinically");
    expect(block.toLowerCase()).not.toContain("cognitive distortion.");
  });

  it("never leaks the raw distortion code", () => {
    const block = renderProfileForPrompt(
      profile({ primary_distortion: "discounting_positive" }),
    );
    expect(block).not.toContain("discounting_positive");
  });

  it("handles the no-pattern path without an inner-critic line", () => {
    const block = renderProfileForPrompt(profile({ primary_distortion: null }));
    expect(block.toLowerCase()).toContain("baseline confidence");
    expect(block.toLowerCase()).not.toContain("never name it clinically");
  });

  it("lists the values as friendly labels", () => {
    const block = renderProfileForPrompt(profile());
    expect(block.toLowerCase()).toContain("freedom");
    expect(block.toLowerCase()).toContain("creativity");
    expect(block.toLowerCase()).toContain("peace");
  });

  it("states the tone preference in plain language", () => {
    expect(
      renderProfileForPrompt(
        profile({ tone_preference: "socratic" }),
      ).toLowerCase(),
    ).toContain("questions that make them think");
    expect(
      renderProfileForPrompt(
        profile({ tone_preference: "gentle" }),
      ).toLowerCase(),
    ).toContain("gentle encouragement");
  });

  it("stays compact (a handful of lines)", () => {
    const lines = renderProfileForPrompt(profile()).split("\n");
    expect(lines.length).toBeLessThanOrEqual(7);
  });
});
