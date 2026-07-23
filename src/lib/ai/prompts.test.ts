import { describe, it, expect } from "vitest";
import { buildUserPrompt } from "./prompts";
import type { UserContext } from "./types";
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

function context(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: "u1",
    name: "Maya",
    intention: "launch my studio",
    engagementScore: 50,
    consecutiveSilences: 0,
    lastReplyAt: null,
    memory: {
      themes: ["showing up"],
      vision: "a calm morning",
      obstacles: null,
      recent_emotional_state: "hopeful",
      open_threads: [],
      last_breakthrough: null,
      tone_notes: null,
    },
    recentReply: null,
    profile: null,
    recentOutboundOpenings: [],
    memoryHistory: null,
    ...overrides,
  };
}

describe("buildUserPrompt profile block", () => {
  it("omits the profile block when there is no profile", () => {
    expect(
      buildUserPrompt(context({ profile: null }), "reflection"),
    ).not.toContain("About this user:");
  });

  it("includes the profile block when a profile is present", () => {
    const prompt = buildUserPrompt(context({ profile: PROFILE }), "reflection");
    expect(prompt).toContain("About this user:");
    expect(prompt).toContain("The Visionary");
  });

  it("places the profile block before the memory block", () => {
    const prompt = buildUserPrompt(context({ profile: PROFILE }), "reflection");
    expect(prompt.indexOf("About this user:")).toBeLessThan(
      prompt.indexOf("What we know about this user:"),
    );
  });

  it("does not alter any existing part of the prompt (no-regression)", () => {
    const without = buildUserPrompt(context({ profile: null }), "reflection");
    const withProfile = buildUserPrompt(
      context({ profile: PROFILE }),
      "reflection",
    );
    for (const part of without.split("\n\n")) {
      expect(withProfile).toContain(part);
    }
  });
});
