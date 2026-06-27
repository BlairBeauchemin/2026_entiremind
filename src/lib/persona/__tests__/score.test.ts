import { describe, it, expect } from "vitest";
import { scoreProfile } from "../score";
import type { QuizAnswers } from "../types";

/**
 * Baseline answers that score NO distortion (all confident choices).
 * Each test overrides only the fields it cares about.
 */
function answers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    intention_category: "career",
    motivation_orientation: "toward",
    change_style: "dreamer",
    past_pattern: "usually_get_there",
    first_doubt: ["no_doubt"],
    inner_voice: "no_pattern",
    core_values: ["freedom", "growth", "peace"],
    tone_preference: "gentle",
    ...overrides,
  };
}

describe("scoreProfile — archetype mapping", () => {
  const cases: Array<
    [QuizAnswers["motivation_orientation"], QuizAnswers["change_style"], string]
  > = [
    ["toward", "dreamer", "visionary"],
    ["toward", "doer", "alchemist"],
    ["away", "dreamer", "seeker"],
    ["away", "doer", "phoenix"],
  ];

  it.each(cases)("%s + %s = %s", (orientation, style, archetype) => {
    const profile = scoreProfile(
      answers({ motivation_orientation: orientation, change_style: style }),
    );
    expect(profile.archetype).toBe(archetype);
    expect(profile.motivation_orientation).toBe(orientation);
    expect(profile.change_style).toBe(style);
  });
});

describe("scoreProfile — passthrough fields", () => {
  it("carries intention category, values, and tone unchanged", () => {
    const profile = scoreProfile(
      answers({
        intention_category: "creative",
        core_values: ["adventure", "service", "recognition"],
        tone_preference: "socratic",
      }),
    );
    expect(profile.intention_category).toBe("creative");
    expect(profile.core_values).toEqual([
      "adventure",
      "service",
      "recognition",
    ]);
    expect(profile.tone_preference).toBe("socratic");
  });

  it("keeps only the first three values when more are supplied", () => {
    const profile = scoreProfile(
      answers({
        core_values: ["freedom", "growth", "peace", "security"],
      }),
    );
    expect(profile.core_values).toHaveLength(3);
    expect(profile.core_values).toEqual(["freedom", "growth", "peace"]);
  });
});

describe("scoreProfile — primary distortion per pattern", () => {
  it("worthiness", () => {
    const profile = scoreProfile(
      answers({ past_pattern: "talk_myself_out", first_doubt: ["who_am_i"] }),
    );
    expect(profile.distortion_scores).toEqual({ worthiness: 3 });
    expect(profile.primary_distortion).toBe("worthiness");
    expect(profile.secondary_distortion).toBeNull();
  });

  it("all_or_nothing", () => {
    const profile = scoreProfile(
      answers({ inner_voice: "always_do_this", first_doubt: ["not_perfect"] }),
    );
    expect(profile.distortion_scores).toEqual({ all_or_nothing: 4 });
    expect(profile.primary_distortion).toBe("all_or_nothing");
  });

  it("catastrophizing", () => {
    const profile = scoreProfile(
      answers({ inner_voice: "never_work", first_doubt: ["too_late"] }),
    );
    expect(profile.primary_distortion).toBe("catastrophizing");
    expect(profile.distortion_scores.catastrophizing).toBe(4);
  });

  it("should_statements", () => {
    const profile = scoreProfile(answers({ inner_voice: "tried_harder" }));
    expect(profile.primary_distortion).toBe("should_statements");
    expect(profile.distortion_scores).toEqual({ should_statements: 2 });
  });

  it("mind_reading", () => {
    const profile = scoreProfile(
      answers({ inner_voice: "saw_coming", first_doubt: ["judge_me"] }),
    );
    expect(profile.primary_distortion).toBe("mind_reading");
    expect(profile.distortion_scores.mind_reading).toBe(4);
  });

  it("discounting_positive", () => {
    const profile = scoreProfile(answers({ inner_voice: "mostly_luck" }));
    expect(profile.primary_distortion).toBe("discounting_positive");
    expect(profile.distortion_scores).toEqual({ discounting_positive: 2 });
  });

  it("personalization", () => {
    const profile = scoreProfile(answers({ first_doubt: ["selfish"] }));
    expect(profile.primary_distortion).toBe("personalization");
    expect(profile.distortion_scores).toEqual({ personalization: 2 });
  });
});

describe("scoreProfile — no-pattern (confident) path", () => {
  it("returns null primary/secondary and empty scores when nothing scores", () => {
    const profile = scoreProfile(answers());
    expect(profile.distortion_scores).toEqual({});
    expect(profile.primary_distortion).toBeNull();
    expect(profile.secondary_distortion).toBeNull();
  });
});

describe("scoreProfile — tie-breaking", () => {
  it("breaks a top-score tie using the inner-voice answer (over fixed priority)", () => {
    // worthiness 2 (who_am_i) vs discounting_positive 2 (mostly_luck) — tie at 2.
    // Fixed priority would pick worthiness; the inner-voice answer points to
    // discounting_positive, which must win.
    const profile = scoreProfile(
      answers({ first_doubt: ["who_am_i"], inner_voice: "mostly_luck" }),
    );
    expect(profile.distortion_scores).toEqual({
      worthiness: 2,
      discounting_positive: 2,
    });
    expect(profile.primary_distortion).toBe("discounting_positive");
    expect(profile.secondary_distortion).toBe("worthiness");
  });

  it("falls back to fixed priority when the inner-voice distortion is not in the tied top", () => {
    // worthiness 3, catastrophizing 3 (tie at top); should_statements 2 from inner voice.
    // Inner-voice points to should_statements (below the tie), so fixed priority
    // decides: worthiness > catastrophizing.
    const profile = scoreProfile(
      answers({
        past_pattern: "never_tried", // worthiness +1, catastrophizing +1
        first_doubt: ["who_am_i", "too_late"], // worthiness +2, catastrophizing +2
        inner_voice: "tried_harder", // should_statements +2
      }),
    );
    expect(profile.distortion_scores).toEqual({
      worthiness: 3,
      catastrophizing: 3,
      should_statements: 2,
    });
    expect(profile.primary_distortion).toBe("worthiness");
    expect(profile.secondary_distortion).toBe("catastrophizing");
  });
});

describe("scoreProfile — secondary threshold", () => {
  it("does not assign a secondary below the minimum score", () => {
    // all_or_nothing 3 (perfect_moment +1, always_do_this +2); catastrophizing 1.
    const profile = scoreProfile(
      answers({
        past_pattern: "perfect_moment", // all_or_nothing +1, catastrophizing +1
        first_doubt: [],
        inner_voice: "always_do_this", // all_or_nothing +2
      }),
    );
    expect(profile.distortion_scores).toEqual({
      all_or_nothing: 3,
      catastrophizing: 1,
    });
    expect(profile.primary_distortion).toBe("all_or_nothing");
    expect(profile.secondary_distortion).toBeNull();
  });
});

describe("scoreProfile — malformed input", () => {
  it("ignores unknown option ids without throwing", () => {
    const profile = scoreProfile(
      answers({
        past_pattern: "not_a_real_option",
        first_doubt: ["who_am_i", "also_fake"],
        inner_voice: "bogus",
      }),
    );
    // Only who_am_i scores.
    expect(profile.distortion_scores).toEqual({ worthiness: 2 });
    expect(profile.primary_distortion).toBe("worthiness");
  });

  it("handles an empty first_doubt array", () => {
    const profile = scoreProfile(answers({ first_doubt: [] }));
    expect(profile.primary_distortion).toBeNull();
  });
});
