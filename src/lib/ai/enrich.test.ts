import { describe, it, expect } from "vitest";
import { coerceEnrichment, buildEnrichInput } from "./enrich";

describe("buildEnrichInput", () => {
  it("returns the reply text unchanged when there are no known patterns", () => {
    expect(buildEnrichInput("today was hard", [])).toBe("today was hard");
  });

  it("prepends the user's known pattern codes and hints, then the reply", () => {
    const input = buildEnrichInput("this whole month is ruined", [
      "all_or_nothing",
      "catastrophizing",
    ]);
    expect(input).toContain("all_or_nothing");
    expect(input).toContain("catastrophizing");
    expect(input.toLowerCase()).toContain("all-or-nothing");
    expect(input).toContain("distortion_flags");
    expect(input).toContain("this whole month is ruined");
  });
});

describe("coerceEnrichment distortion_flags", () => {
  function raw(overrides: Record<string, unknown> = {}) {
    return {
      sentiment: "struggling",
      emotional_state: "defeated",
      themes: ["consistency"],
      category: "health",
      modality: "venting",
      mentions: [],
      open_thread: false,
      substantive: true,
      acknowledgement: "one missed morning is one missed morning",
      ...overrides,
    };
  }

  it("keeps only valid distortion codes", () => {
    const result = coerceEnrichment(
      raw({ distortion_flags: ["all_or_nothing", "not_a_code", 7] }),
    );
    expect(result?.distortion_flags).toEqual(["all_or_nothing"]);
  });

  it("defaults to an empty array when the field is missing", () => {
    expect(coerceEnrichment(raw())?.distortion_flags).toEqual([]);
  });

  it("defaults to an empty array when the field is not an array", () => {
    expect(
      coerceEnrichment(raw({ distortion_flags: "all_or_nothing" }))
        ?.distortion_flags,
    ).toEqual([]);
  });

  it("still parses the rest of the enrichment", () => {
    const result = coerceEnrichment(
      raw({ distortion_flags: ["catastrophizing"] }),
    );
    expect(result?.sentiment).toBe("struggling");
    expect(result?.substantive).toBe(true);
    expect(result?.distortion_flags).toEqual(["catastrophizing"]);
  });
});
