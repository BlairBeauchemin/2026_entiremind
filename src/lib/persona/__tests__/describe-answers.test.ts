import { describe, it, expect } from "vitest";
import { describeAnswers } from "../questions";
import type { QuizAnswers } from "../types";

function answers(overrides: Partial<QuizAnswers> = {}): QuizAnswers {
  return {
    intention_category: "creative",
    motivation_orientation: "toward",
    change_style: "dreamer",
    past_pattern: "lose_steam",
    first_doubt: ["who_am_i", "not_perfect"],
    inner_voice: "always_do_this",
    core_values: ["freedom", "growth", "peace"],
    tone_preference: "socratic",
    ...overrides,
  };
}

describe("describeAnswers", () => {
  it("resolves every quiz answer id to its human-readable label", () => {
    const described = describeAnswers(answers());
    const byQuestion = Object.fromEntries(
      described.map((d) => [d.question, d.answer]),
    );

    expect(byQuestion["Dream category"]).toBe("Creative expression");
    expect(byQuestion["Motivation"]).toBe(
      "I'm reaching toward something I can almost see",
    );
    expect(byQuestion["Change style"]).toContain("doing");
    expect(byQuestion["Past pattern"]).toBe("I start strong, then lose steam");
    expect(byQuestion["Inner voice"]).toBe("You always do this.");
    expect(byQuestion["Tone preference"]).toBe("Questions that make me think");
  });

  it("joins multi-select first doubts into one readable answer", () => {
    const described = describeAnswers(
      answers({ first_doubt: ["who_am_i", "not_perfect"] }),
    );
    const firstDoubt = described.find((d) => d.question === "First doubt");
    expect(firstDoubt?.answer).toContain("Who am I to want this?");
    expect(firstDoubt?.answer).toContain(
      "If I can't do it perfectly, why start?",
    );
  });

  it("joins the three chosen values", () => {
    const described = describeAnswers(
      answers({ core_values: ["freedom", "growth", "peace"] }),
    );
    const values = described.find((d) => d.question === "Core values");
    expect(values?.answer).toBe("Freedom, Growth, Peace");
  });

  it("preserves the quiz screen order", () => {
    const questions = describeAnswers(answers()).map((d) => d.question);
    expect(questions).toEqual([
      "Dream category",
      "Motivation",
      "Change style",
      "Past pattern",
      "First doubt",
      "Inner voice",
      "Core values",
      "Tone preference",
    ]);
  });

  it("falls back to the raw id when an option no longer exists", () => {
    const described = describeAnswers(
      answers({ past_pattern: "removed_option" }),
    );
    const pastPattern = described.find((d) => d.question === "Past pattern");
    expect(pastPattern?.answer).toBe("removed_option");
  });
});
